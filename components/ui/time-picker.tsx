"use client"

import * as React from "react"

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
    <Input
      type="time"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={cn(
        "bg-background [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none",
        !value && "text-muted-foreground"
      )}
      placeholder={placeholder}
    />
  )
}
