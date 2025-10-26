"use client"

import * as React from "react"
import { Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface TimePickerProps {
  value?: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}

export function TimePicker({
  value,
  onChange,
  disabled,
  placeholder = "Select time",
}: TimePickerProps) {
  return (
    <div className="relative">
      <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={cn(
          "pl-10",
          !value && "text-muted-foreground"
        )}
        placeholder={placeholder}
      />
    </div>
  )
}
