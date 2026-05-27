'use client'

import { useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CalendarItem = {
  id: string
  title: string
  type: string
  scheduledFor: string
}

type ScheduleCalendarProps = {
  items: CalendarItem[]
}

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export function ScheduleCalendar({ items }: ScheduleCalendarProps) {
  const [viewDate, setViewDate] = useState(() => new Date())

  const { year, month, days, monthLabel } = useMemo(() => {
    const y = viewDate.getFullYear()
    const m = viewDate.getMonth()
    const first = new Date(y, m, 1)
    const last = new Date(y, m + 1, 0)
    const startPad = first.getDay()
    const totalDays = last.getDate()

    const cells: Array<{ date: Date | null; key: string }> = []
    for (let i = 0; i < startPad; i++) {
      cells.push({ date: null, key: `pad-${i}` })
    }
    for (let d = 1; d <= totalDays; d++) {
      cells.push({ date: new Date(y, m, d), key: `day-${d}` })
    }

    return {
      year: y,
      month: m,
      days: cells,
      monthLabel: viewDate.toLocaleString('default', { month: 'long', year: 'numeric' }),
    }
  }, [viewDate])

  const itemsByDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>()
    for (const item of items) {
      const d = new Date(item.scheduledFor)
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }
    return map
  }, [items])

  const shiftMonth = (delta: number) => {
    setViewDate(new Date(year, month + delta, 1))
  }

  const today = new Date()

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Calendar</CardTitle>
            <CardDescription>Scheduled publishes at a glance</CardDescription>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8" onClick={() => shiftMonth(-1)}>
              <ChevronLeft className="size-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">{monthLabel}</span>
            <Button variant="outline" size="icon" className="size-8" onClick={() => shiftMonth(1)}>
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="text-center text-[10px] font-medium text-muted-foreground py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {days.map(({ date, key }) => {
            if (!date) {
              return <div key={key} className="min-h-[72px]" />
            }
            const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
            const dayItems = itemsByDay.get(dayKey) ?? []
            const isToday =
              date.getDate() === today.getDate() &&
              date.getMonth() === today.getMonth() &&
              date.getFullYear() === today.getFullYear()

            return (
              <div
                key={key}
                className={`min-h-[72px] rounded-md border p-1 ${
                  isToday ? 'border-primary/50 bg-primary/5' : 'border-border/60'
                }`}
              >
                <p className={`text-[10px] font-medium mb-0.5 ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                  {date.getDate()}
                </p>
                <div className="space-y-0.5">
                  {dayItems.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="text-[9px] leading-tight truncate rounded px-1 py-0.5 bg-primary/10 text-primary"
                      title={item.title}
                    >
                      {item.title}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <Badge variant="secondary" className="text-[8px] h-4 px-1">
                      +{dayItems.length - 2}
                    </Badge>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
