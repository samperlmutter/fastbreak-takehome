import Link from 'next/link'
import { Calendar, MapPin, Pencil } from 'lucide-react'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EventWithVenues } from '@/lib/supabase/types'
import { DeleteEventButton } from './delete-event-button'

interface EventCardProps {
  event: EventWithVenues
}

export function EventCard({ event }: EventCardProps) {
  const eventDate = new Date(event.date_time)
  const formattedDate = eventDate.toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
  const formattedTime = eventDate.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  })

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle className="line-clamp-1">{event.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium">
            {event.sport_type}
          </span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-3">
        {/* Date and Time */}
        <div className="flex items-start gap-2 text-sm">
          <Calendar className="mt-0.5 h-4 w-4 text-muted-foreground" />
          <div>
            <div className="font-medium">{formattedDate}</div>
            <div className="text-muted-foreground">{formattedTime}</div>
          </div>
        </div>

        {/* Venues */}
        {event.venues && event.venues.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <MapPin className="mt-0.5 h-4 w-4 text-muted-foreground" />
            <div className="flex-1">
              {event.venues.map((venue, index) => (
                <div key={venue.id}>
                  <div className="font-medium">{venue.name}</div>
                  {venue.city && venue.state && (
                    <div className="text-muted-foreground">
                      {venue.city}, {venue.state}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {event.description && (
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {event.description}
          </p>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        <Link href={`/dashboard/events/${event.id}/edit`} className="flex-1">
          <Button variant="outline" className="w-full">
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
        </Link>
        <DeleteEventButton eventId={event.id} eventName={event.name} />
      </CardFooter>
    </Card>
  )
}
