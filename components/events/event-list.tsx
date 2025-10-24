import { getEventsAction } from '@/lib/actions/event.actions'
import { EventCard } from './event-card'
import { EventFilters } from './event-filters'

interface EventListProps {
  searchQuery?: string
  sportTypeFilter?: string
}

export async function EventList({
  searchQuery,
  sportTypeFilter,
}: EventListProps) {
  const result = await getEventsAction({
    search: searchQuery,
    sportType: sportTypeFilter,
  })

  if (!result.success) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">
          Failed to load events. Please try again.
        </p>
      </div>
    )
  }

  const events = result.data

  return (
    <div className="space-y-6">
      {/* Search and Filters */}
      <EventFilters
        initialSearch={searchQuery}
        initialSportType={sportTypeFilter}
      />

      {/* Event Count */}
      <div className="text-sm text-muted-foreground">
        {events.length} {events.length === 1 ? 'event' : 'events'} found
      </div>

      {/* Events Grid */}
      {events.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            No events found. Create your first event to get started!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  )
}
