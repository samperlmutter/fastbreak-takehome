'use client'

import { useEffect, useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { getEventsAction } from '@/lib/actions/event.actions'
import { EventCard } from './event-card'
import { EventFilters } from './event-filters'
import type { EventWithVenues } from '@/lib/actions/event.actions'

interface EventListProps {
  initialSearch?: string
  initialSportType?: string
}

export function EventList({
  initialSearch = '',
  initialSportType = '',
}: EventListProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [allEvents, setAllEvents] = useState<EventWithVenues[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [search, setSearch] = useState(initialSearch)
  const [sportType, setSportType] = useState(initialSportType)

  // Fetch all events once on mount
  useEffect(() => {
    async function fetchEvents() {
      const result = await getEventsAction({})

      if (!result.success) {
        setError('Failed to load events. Please try again.')
        setIsLoading(false)
        return
      }

      setAllEvents(result.data)
      setIsLoading(false)
    }

    fetchEvents()
  }, [])

  // Filter events client-side (instant!)
  const filteredEvents = useMemo(() => {
    return allEvents.filter((event) => {
      // Filter by search query
      if (search && !event.name.toLowerCase().includes(search.toLowerCase())) {
        return false
      }

      // Filter by sport type
      if (sportType && event.sport_type !== sportType) {
        return false
      }

      return true
    })
  }, [allEvents, search, sportType])

  // Update URL in background (debounced) for shareability
  useEffect(() => {
    const timer = setTimeout(() => {
      const params = new URLSearchParams()

      if (search) {
        params.set('search', search)
      }

      if (sportType) {
        params.set('sportType', sportType)
      }

      const queryString = params.toString()
      const newUrl = queryString ? `/dashboard?${queryString}` : '/dashboard'

      startTransition(() => {
        router.push(newUrl)
      })
    }, 300)

    return () => clearTimeout(timer)
  }, [search, sportType, router])

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading events...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">{error}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <EventFilters
        search={search}
        sportType={sportType}
        onSearchChange={setSearch}
        onSportTypeChange={setSportType}
      />

      {/* Event Count */}
      <div className="text-sm text-muted-foreground">
        {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            {allEvents.length === 0
              ? 'No events found. Create your first event to get started!'
              : 'No events match your filters. Try adjusting your search.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
