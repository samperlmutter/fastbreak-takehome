'use client'

import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SPORT_TYPES } from '@/lib/constants/sports'

interface EventFiltersProps {
  search: string
  sportType: string
  onSearchChange: (value: string) => void
  onSportTypeChange: (value: string) => void
}

export function EventFilters({
  search,
  sportType,
  onSearchChange,
  onSportTypeChange,
}: EventFiltersProps) {
  const handleSportTypeChange = (value: string) => {
    const newValue = value === 'all' ? '' : value
    onSportTypeChange(newValue)
  }

  const handleClearFilters = () => {
    onSearchChange('')
    onSportTypeChange('')
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Sport Type Filter */}
        <Select
          value={sportType || 'all'}
          onValueChange={handleSportTypeChange}
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
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
