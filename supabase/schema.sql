-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create events table
CREATE TABLE IF NOT EXISTS events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sport_type VARCHAR(100) NOT NULL,
    date_time TIMESTAMPTZ NOT NULL,
    description TEXT,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create venues table
CREATE TABLE IF NOT EXISTS venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500),
    city VARCHAR(100),
    state VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for many-to-many relationship between events and venues
CREATE TABLE IF NOT EXISTS event_venues (
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    venue_id UUID NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
    PRIMARY KEY (event_id, venue_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_events_user_id ON events(user_id);
CREATE INDEX IF NOT EXISTS idx_events_sport_type ON events(sport_type);
CREATE INDEX IF NOT EXISTS idx_events_date_time ON events(date_time);
CREATE INDEX IF NOT EXISTS idx_event_venues_event_id ON event_venues(event_id);
CREATE INDEX IF NOT EXISTS idx_event_venues_venue_id ON event_venues(venue_id);

-- Create a function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for events table
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- RLS Policies for events table
-- Users can view all events
CREATE POLICY "Anyone can view events" ON events
    FOR SELECT USING (true);

-- Users can only insert their own events
CREATE POLICY "Users can insert their own events" ON events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own events
CREATE POLICY "Users can update their own events" ON events
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own events
CREATE POLICY "Users can delete their own events" ON events
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for venues table
-- Anyone can view venues
CREATE POLICY "Anyone can view venues" ON venues
    FOR SELECT USING (true);

-- Authenticated users can create venues
CREATE POLICY "Authenticated users can insert venues" ON venues
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for event_venues junction table
-- Anyone can view event-venue relationships
CREATE POLICY "Anyone can view event venues" ON event_venues
    FOR SELECT USING (true);

-- Users can only insert event-venue relationships for their own events
CREATE POLICY "Users can insert event venues for their events" ON event_venues
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_venues.event_id
            AND events.user_id = auth.uid()
        )
    );

-- Users can only delete event-venue relationships for their own events
CREATE POLICY "Users can delete event venues for their events" ON event_venues
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM events
            WHERE events.id = event_venues.event_id
            AND events.user_id = auth.uid()
        )
    );
