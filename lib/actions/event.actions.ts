// @ts-nocheck
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAction } from './action-wrapper'
import { ActionResponse } from './types'
import { Event, EventWithVenues, Venue } from '@/lib/supabase/types'

// Validation schemas
const venueSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Venue name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

const createEventSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  sport_type: z.string().min(1, 'Sport type is required'),
  date_time: z.string().min(1, 'Date and time are required'),
  description: z.string().optional(),
  venues: z.array(venueSchema).min(1, 'At least one venue is required'),
})

const updateEventSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, 'Event name is required').max(255),
  sport_type: z.string().min(1, 'Sport type is required'),
  date_time: z.string().min(1, 'Date and time are required'),
  description: z.string().optional(),
  venues: z.array(venueSchema).min(1, 'At least one venue is required'),
})

const deleteEventSchema = z.object({
  id: z.string().uuid(),
})

const getEventsSchema = z.object({
  search: z.string().optional(),
  sportType: z.string().optional(),
})

// Type definitions
type CreateEventInput = z.infer<typeof createEventSchema>
type UpdateEventInput = z.infer<typeof updateEventSchema>
type DeleteEventInput = z.infer<typeof deleteEventSchema>
type GetEventsInput = z.infer<typeof getEventsSchema>

/**
 * Create a new event with venues
 */
export async function createEventAction(
  input: CreateEventInput
): Promise<ActionResponse<Event>> {
  const validation = createEventSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const { name, sport_type, date_time, description, venues } = validation.data

    // Insert event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert({
        name,
        sport_type,
        date_time,
        description: description || null,
        user_id: user.id,
      } as any)
      .select()
      .single()

    if (eventError || !event) {
      console.error('Event creation error:', eventError)
      return {
        success: false,
        error: 'Failed to create event',
      }
    }

    // Process venues
    for (const venue of venues) {
      let venueId = venue.id

      // If no venue ID, create new venue
      if (!venueId) {
        const { data: newVenue, error: venueError } = await supabase
          .from('venues')
          .insert({
            name: venue.name,
            address: venue.address || null,
            city: venue.city || null,
            state: venue.state || null,
          } as any)
          .select()
          .single()

        if (venueError || !newVenue) {
          console.error('Venue creation error:', venueError)
          continue
        }

        venueId = (newVenue as any).id
      }

      // Link venue to event
      const { error: linkError } = await supabase
        .from('event_venues')
        .insert({
          event_id: (event as any).id,
          venue_id: venueId,
        } as any)

      if (linkError) {
        console.error('Event-venue link error:', linkError)
      }
    }

    revalidatePath('/dashboard')

    return {
      success: true,
      data: event,
      message: 'Event created successfully',
    }
  } catch (error) {
    console.error('Create event error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Update an existing event
 */
export async function updateEventAction(
  input: UpdateEventInput
): Promise<ActionResponse<Event>> {
  const validation = updateEventSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: 'Validation failed',
      fieldErrors: validation.error.flatten().fieldErrors as Record<
        string,
        string[]
      >,
    }
  }

  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const { id, name, sport_type, date_time, description, venues } =
      validation.data

    // Update event
    const { data: event, error: eventError } = await supabase
      .from('events')
      .update({
        name,
        sport_type,
        date_time,
        description: description || null,
      } as any)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (eventError || !event) {
      console.error('Event update error:', eventError)
      return {
        success: false,
        error: 'Failed to update event',
      }
    }

    // Delete existing venue links
    await supabase.from('event_venues').delete().eq('event_id', id)

    // Process venues
    for (const venue of venues) {
      let venueId = venue.id

      // If no venue ID, create new venue
      if (!venueId) {
        const { data: newVenue, error: venueError } = await supabase
          .from('venues')
          .insert({
            name: venue.name,
            address: venue.address || null,
            city: venue.city || null,
            state: venue.state || null,
          } as any)
          .select()
          .single()

        if (venueError || !newVenue) {
          console.error('Venue creation error:', venueError)
          continue
        }

        venueId = (newVenue as any).id
      }

      // Link venue to event
      const { error: linkError } = await supabase
        .from('event_venues')
        .insert({
          event_id: (event as any).id,
          venue_id: venueId,
        } as any)

      if (linkError) {
        console.error('Event-venue link error:', linkError)
      }
    }

    revalidatePath('/dashboard')

    return {
      success: true,
      data: event,
      message: 'Event updated successfully',
    }
  } catch (error) {
    console.error('Update event error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Delete an event
 */
export async function deleteEventAction(
  input: DeleteEventInput
): Promise<ActionResponse<void>> {
  const validation = deleteEventSchema.safeParse(input)

  if (!validation.success) {
    return {
      success: false,
      error: 'Invalid event ID',
    }
  }

  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        success: false,
        error: 'Authentication required',
      }
    }

    const { id } = validation.data

    // Delete event (cascade will handle event_venues)
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Event deletion error:', deleteError)
      return {
        success: false,
        error: 'Failed to delete event',
      }
    }

    revalidatePath('/dashboard')

    return {
      success: true,
      data: undefined,
      message: 'Event deleted successfully',
    }
  } catch (error) {
    console.error('Delete event error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all events with optional filtering
 * This runs server-side and supports search and filtering
 */
export async function getEventsAction(
  input: GetEventsInput = {}
): Promise<ActionResponse<EventWithVenues[]>> {
  try {
    const supabase = await createClient()

    // Build query
    let query = supabase
      .from('events')
      .select('*')
      .order('date_time', { ascending: true })

    // Apply search filter
    if (input.search && input.search.trim()) {
      query = query.ilike('name', `%${input.search.trim()}%`)
    }

    // Apply sport type filter
    if (input.sportType && input.sportType.trim()) {
      query = query.eq('sport_type', input.sportType.trim())
    }

    const { data: events, error: eventsError } = await query

    if (eventsError) {
      console.error('Events fetch error:', eventsError)
      return {
        success: false,
        error: 'Failed to fetch events',
      }
    }

    // Fetch venues for each event
    const eventsWithVenues: EventWithVenues[] = await Promise.all(
      (events || []).map(async (event) => {
        const { data: eventVenues } = await supabase
          .from('event_venues')
          .select('venue_id')
          .eq('event_id', event.id)

        const venueIds = eventVenues?.map((ev) => ev.venue_id) || []

        if (venueIds.length === 0) {
          return { ...event, venues: [] }
        }

        const { data: venues } = await supabase
          .from('venues')
          .select('*')
          .in('id', venueIds)

        return {
          ...event,
          venues: venues || [],
        }
      })
    )

    return {
      success: true,
      data: eventsWithVenues,
    }
  } catch (error) {
    console.error('Get events error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get a single event by ID
 */
export async function getEventByIdAction(
  id: string
): Promise<ActionResponse<EventWithVenues>> {
  try {
    const supabase = await createClient()

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single()

    if (eventError || !event) {
      console.error('Event fetch error:', eventError)
      return {
        success: false,
        error: 'Event not found',
      }
    }

    // Fetch venues
    const { data: eventVenues } = await supabase
      .from('event_venues')
      .select('venue_id')
      .eq('event_id', event.id)

    const venueIds = eventVenues?.map((ev) => ev.venue_id) || []

    let venues: Venue[] = []

    if (venueIds.length > 0) {
      const { data: venuesData } = await supabase
        .from('venues')
        .select('*')
        .in('id', venueIds)

      venues = venuesData || []
    }

    return {
      success: true,
      data: {
        ...event,
        venues,
      },
    }
  } catch (error) {
    console.error('Get event by ID error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}

/**
 * Get all available venues
 */
export async function getVenuesAction(): Promise<ActionResponse<Venue[]>> {
  try {
    const supabase = await createClient()

    const { data: venues, error } = await supabase
      .from('venues')
      .select('*')
      .order('name', { ascending: true })

    if (error) {
      console.error('Venues fetch error:', error)
      return {
        success: false,
        error: 'Failed to fetch venues',
      }
    }

    return {
      success: true,
      data: venues || [],
    }
  } catch (error) {
    console.error('Get venues error:', error)
    return {
      success: false,
      error: 'An unexpected error occurred',
    }
  }
}
