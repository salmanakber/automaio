'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle2, Circle, ArrowRight, Sparkles } from 'lucide-react'
import type { OrgSetupStatus } from '@/lib/organizations/setup-status'

type SetupHealthChecklistProps = {
  orgId: string
  compact?: boolean
}

export function SetupHealthChecklist({ orgId, compact = false }: SetupHealthChecklistProps) {
  const [status, setStatus] = useState<OrgSetupStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/organizations/${orgId}/setup-status`, {
      headers: { 'ngrok-skip-browser-warning': '1' },
    })
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [orgId])

  if (loading || !status || status.isFullySetup) return null

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent mb-8">
      <CardHeader className={compact ? 'pb-3' : undefined}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="size-5 text-primary" />
              Get set up in minutes
            </CardTitle>
            <CardDescription>
              {status.completedCount} of {status.totalCount} steps complete ({status.percentComplete}%)
            </CardDescription>
          </div>
          {!compact && (
            <Link href={`/dashboard/${orgId}/get-started`}>
              <Button size="sm">
                Start wizard
                <ArrowRight className="size-3.5 ml-1" />
              </Button>
            </Link>
          )}
        </div>
        <div className="mt-3 h-2 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${status.percentComplete}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {status.steps.map((step) => (
          <div
            key={step.id}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
              step.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background'
            }`}
          >
            {step.done ? (
              <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
            ) : (
              <Circle className="size-4 text-muted-foreground shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{step.label}</p>
              {!compact && <p className="text-xs text-muted-foreground">{step.description}</p>}
            </div>
            {!step.done && step.href && step.actionLabel && (
              <Link href={step.href}>
                <Button variant="outline" size="sm" className="shrink-0 text-xs h-8">
                  {step.actionLabel}
                </Button>
              </Link>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
