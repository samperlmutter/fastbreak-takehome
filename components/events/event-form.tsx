'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DatePicker } from '@/components/ui/date-picker'
import { TimePicker } from '@/components/ui/time-picker'
import {
  createEventAction,
  updateEventAction,
} from '@/lib/actions/event.actions'
import { EventWithVenues } from '@/lib/supabase/types'

const SPORT_TYPES = [
  'Soccer',
  'Basketball',
  'Tennis',
  'Baseball',
  'Football',
  'Volleyball',
  'Hockey',
  'Cricket',
  'Rugby',
  'Swimming',
  'Robotics'
]

const venueSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Venue name is required'),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
})

const eventFormSchema = z.object({
  name: z.string().min(1, 'Event name is required').max(255),
  sport_type: z.string().min(1, 'Sport type is required'),
  date: z.string().min(1, 'Date is required'),
  time: z.string().min(1, 'Time is required'),
  description: z.string().optional(),
  venues: z.array(venueSchema).min(1, 'At least one venue is required'),
})

type EventFormData = z.infer<typeof eventFormSchema>

interface EventFormProps {
  event?: EventWithVenues
}

export function EventForm({ event }: EventFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isEditing = !!event

  // Parse date and time for editing
  let defaultDate = ''
  let defaultTime = ''

  if (event) {
    const eventDate = new Date(event.date_time)
    // Extract local date components to avoid timezone issues
    const year = eventDate.getFullYear()
    const month = String(eventDate.getMonth() + 1).padStart(2, '0')
    const day = String(eventDate.getDate()).padStart(2, '0')
    defaultDate = `${year}-${month}-${day}`
    defaultTime = eventDate.toTimeString().slice(0, 5)
  }

  const form = useForm<EventFormData>({
    resolver: zodResolver(eventFormSchema),
    defaultValues: {
      name: event?.name || '',
      sport_type: event?.sport_type || '',
      date: defaultDate,
      time: defaultTime,
      description: event?.description || '',
      venues:
        event?.venues && event.venues.length > 0
          ? event.venues.map((v) => ({
              id: v.id,
              name: v.name,
              address: v.address || '',
              city: v.city || '',
              state: v.state || '',
            }))
          : [{ name: '', address: '', city: '', state: '' }],
    },
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'venues',
  })

  const onSubmit = async (data: EventFormData) => {
    setIsSubmitting(true)

    try {
      // Combine date and time into ISO string
      const dateTime = new Date(`${data.date}T${data.time}`).toISOString()

      const eventData = {
        name: data.name,
        sport_type: data.sport_type,
        date_time: dateTime,
        description: data.description,
        venues: data.venues,
      }

      let result

      if (isEditing && event) {
        result = await updateEventAction({
          id: event.id,
          ...eventData,
        })
      } else {
        result = await createEventAction(eventData)
      }

      if (result.success) {
        toast.success(
          result.message || `Event ${isEditing ? 'updated' : 'created'} successfully`
        )
        router.push('/dashboard')
        router.refresh()
      } else {
        if (result.fieldErrors) {
          // Set field-specific errors
          Object.entries(result.fieldErrors).forEach(([field, errors]) => {
            if (errors && errors.length > 0) {
              form.setError(field as keyof EventFormData, {
                message: errors[0],
              })
            }
          })
        }
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Event Details Card */}
        <Card>
          <CardHeader>
            <CardTitle>Event Details</CardTitle>
            <CardDescription>
              Basic information about your event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Event Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Summer Basketball Tournament"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="sport_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sport Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a sport" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPORT_TYPES.map((sport) => (
                        <SelectItem key={sport} value={sport}>
                          {sport}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => {
                  // Parse string date to Date object (local timezone)
                  const dateValue = field.value
                    ? (() => {
                        const [year, month, day] = field.value.split('-').map(Number)
                        return new Date(year, month - 1, day)
                      })()
                    : undefined

                  return (
                    <FormItem>
                      <FormLabel>Date</FormLabel>
                      <FormControl>
                        <DatePicker
                          date={dateValue}
                          onDateChange={(date) => {
                            if (date) {
                              // Convert Date to string (local timezone)
                              const year = date.getFullYear()
                              const month = String(date.getMonth() + 1).padStart(2, '0')
                              const day = String(date.getDate()).padStart(2, '0')
                              field.onChange(`${year}-${month}-${day}`)
                            } else {
                              field.onChange('')
                            }
                          }}
                          disabled={isSubmitting}
                          placeholder="Select event date"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )
                }}
              />

              <FormField
                control={form.control}
                name="time"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Time</FormLabel>
                    <FormControl>
                      <TimePicker
                        value={field.value}
                        onChange={field.onChange}
                        disabled={isSubmitting}
                        placeholder="Select event time"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Add any additional details about your event..."
                      className="min-h-[100px]"
                      {...field}
                      disabled={isSubmitting}
                    />
                  </FormControl>
                  <FormDescription>
                    Provide more context about the event
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Venues Card */}
        <Card>
          <CardHeader>
            <CardTitle>Venues</CardTitle>
            <CardDescription>
              Add one or more venues for this event
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="space-y-4 rounded-lg border p-4"
              >
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">Venue {index + 1}</h4>
                  {fields.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => remove(index)}
                      disabled={isSubmitting}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <FormField
                  control={form.control}
                  name={`venues.${index}.name`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Venue Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Madison Square Garden"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`venues.${index}.address`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="123 Main St"
                          {...field}
                          disabled={isSubmitting}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name={`venues.${index}.city`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="New York"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`venues.${index}.state`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="NY"
                            {...field}
                            disabled={isSubmitting}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({ name: '', address: '', city: '', state: '' })
              }
              disabled={isSubmitting}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Another Venue
            </Button>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? isEditing
                ? 'Updating...'
                : 'Creating...'
              : isEditing
                ? 'Update Event'
                : 'Create Event'}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  )
}
