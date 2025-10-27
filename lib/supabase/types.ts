export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      events: {
        Row: {
          id: string
          name: string
          sport_type: string
          date_time: string
          description: string | null
          user_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          sport_type: string
          date_time: string
          description?: string | null
          user_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          sport_type?: string
          date_time?: string
          description?: string | null
          user_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      venues: {
        Row: {
          id: string
          name: string
          address: string | null
          city: string | null
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          address?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          address?: string | null
          city?: string | null
          state?: string | null
          created_at?: string
        }
      }
      event_venues: {
        Row: {
          event_id: string
          venue_id: string
        }
        Insert: {
          event_id: string
          venue_id: string
        }
        Update: {
          event_id?: string
          venue_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          first_name: string
          last_name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name: string
          last_name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string
          last_name?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type Event = Database['public']['Tables']['events']['Row']
export type Venue = Database['public']['Tables']['venues']['Row']
export type EventVenue = Database['public']['Tables']['event_venues']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

export type EventWithVenues = Event & {
  venues: Venue[]
}
