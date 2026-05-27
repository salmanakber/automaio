'use client'

import { INDUSTRIES } from '@/lib/industries'
import { cn } from '@/lib/utils'

interface IndustrySelectProps {
  value: string
  onChange: (value: string) => void
  id?: string
  className?: string
  required?: boolean
  allowEmpty?: boolean
  emptyLabel?: string
}

export function IndustrySelect({
  value,
  onChange,
  id,
  className,
  required,
  allowEmpty,
  emptyLabel = 'Select industry',
}: IndustrySelectProps) {
  return (
    <select
      id={id}
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        className,
      )}
    >
      {allowEmpty ? <option value="">{emptyLabel}</option> : null}
      {INDUSTRIES.map((industry) => (
        <option key={industry} value={industry}>
          {industry}
        </option>
      ))}
    </select>
  )
}
