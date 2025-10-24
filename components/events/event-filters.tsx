'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

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
]

interface EventFiltersProps {
  initialSearch?: string
  initialSportType?: string
}

export function EventFilters({
  initialSearch = '',
  initialSportType = '',
}: EventFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()

  const [search, setSearch] = useState(initialSearch)
  const [sportType, setSportType] = useState(initialSportType)

  const updateFilters = (newSearch: string, newSportType: string) => {
    const params = new URLSearchParams(searchParams)

    if (newSearch) {
      params.set('search', newSearch)
    } else {
      params.delete('search')
    }

    if (newSportType) {
      params.set('sportType', newSportType)
    } else {
      params.delete('sportType')
    }

    startTransition(() => {
      router.push(`/dashboard?${params.toString()}`)
    })
  }

  const handleSearchChange = (value: string) => {
    setSearch(value)
    updateFilters(value, sportType)
  }

  const handleSportTypeChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    setSportType(newValue)
    updateFilters(search, newValue)
  }

  const handleClearFilters = () => {
    setSearch('')
    setSportType('')
    router.push('/dashboard')
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search events by name..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
            disabled={isPending}
          />
        </div>

        {/* Sport Type Filter */}
        <Select
          value={sportType || 'all'}
          onValueChange={handleSportTypeChange}
          disabled={isPending}
        >
          <SelectTrigger className="w-full sm:w-60">
            <SelectValue placeholder="Filter by sport" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sports</SelectItem>
            {SPORT_TYPES.map((sport) => (
              <SelectItem key={sport} value={sport}>
                {sport}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Active Filters */}
      {(search || sportType) && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {search && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
              Search: {search}
            </span>
          )}
          {sportType && (
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm">
              Sport: {sportType}
            </span>
          )}
          <button
            onClick={handleClearFilters}
            className="text-sm text-primary hover:underline"
            disabled={isPending}
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
