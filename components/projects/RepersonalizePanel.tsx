'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Loader2, RefreshCw, Sparkles } from 'lucide-react'
import {
  LandingPageOnboarding,
  type OnboardingFormData,
} from '@/components/projects/LandingPageOnboarding'
import {
  formToOnboardingInput,
  parseStoredBusinessContext,
  parseStoredOnboardingDraft,
} from '@/lib/onboarding/persistence'
import type { BusinessContext } from '@/lib/ai/business-context-types'
import { parseJsonResponse } from '@/lib/api/parse-json-response'

type RepersonalizePanelProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  orgId: string
  projectId: string
  projectParameters?: Record<string, unknown>
  onComplete: (project: Record<string, unknown>) => void
  onRunningChange?: (running: boolean) => void
}

function contextToForm(ctx: BusinessContext): OnboardingFormData {
  return {
    websiteUrl: ctx.websiteUrl ?? '',
    businessDescription: ctx.description ?? '',
    primaryGoal: ctx.primaryGoal ?? '',
    targetAudience: ctx.targetAudience ?? '',
    offer: ctx.offer ?? '',
    tonePreset: ctx.tonePreset ?? 'high_converting',
    ctaGoal: ctx.ctaGoal ?? 'leads',
  }
}

export function RepersonalizePanel({
  open,
  onOpenChange,
  orgId,
  projectId,
  projectParameters,
  onComplete,
  onRunningChange,
}: RepersonalizePanelProps) {
  const [running, setRunning] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState<OnboardingFormData | null>(null)
  const [context, setContext] = useState<BusinessContext | null>(null)
  const [mode, setMode] = useState<'edit' | 'confirm'>('edit')

  useEffect(() => {
    if (!open) return
    setError('')
    setMode('edit')

    const params = projectParameters ?? {}
    const storedContext = parseStoredBusinessContext(params)
    const storedDraft = parseStoredOnboardingDraft(params)

    if (storedContext) {
      setContext(storedContext)
      setFormData(contextToForm(storedContext))
    } else if (storedDraft) {
      setFormData(storedDraft)
    } else {
      setFormData(null)
      setContext(null)
    }
  }, [open, projectParameters])

  const runPersonalize = async (onboarding: OnboardingFormData, ctx?: BusinessContext) => {
    setRunning(true)
    onRunningChange?.(true)
    setError('')
    try {
      const res = await fetch(`/api/projects/${projectId}/personalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({
          onboarding: formToOnboardingInput(onboarding),
          businessContext: ctx,
        }),
      })
      const data = await parseJsonResponse<{
        project?: Record<string, unknown>
        error?: string
      }>(res)
      if (!res.ok) throw new Error(data.error ?? 'Personalization failed')

      await fetch(`/api/projects/${projectId}/onboarding`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': '1' },
        body: JSON.stringify({ clearDraft: true, onboardingComplete: true }),
      })

      if (data.project) onComplete(data.project)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Personalization failed')
    } finally {
      setRunning(false)
      onRunningChange?.(false)
    }
  }

  const handleOnboardingComplete = (data: OnboardingFormData, ctx?: BusinessContext) => {
    setFormData(data)
    setContext(ctx ?? null)
    setMode('confirm')
  }

  const handleQuickRepersonalize = () => {
    if (formData) {
      runPersonalize(formData, context ?? undefined)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0c0c0e] border-zinc-800 text-white sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 text-blue-400" />
            Re-personalize landing page
          </DialogTitle>
          <DialogDescription className="text-zinc-500">
            Update your business context and regenerate copy across all sections while preserving
            the template design.
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </div>
        )}

        {mode === 'edit' ? (
          <LandingPageOnboarding
            orgId={orgId}
            compact
            initialData={formData ?? undefined}
            storageKey={`automaio-onboarding:${orgId}:project:${projectId}`}
            onComplete={handleOnboardingComplete}
          />
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4 text-sm space-y-2">
              <p className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Ready to apply</p>
              {formData?.businessDescription && (
                <p><span className="text-zinc-500">Business:</span> {formData.businessDescription.slice(0, 160)}…</p>
              )}
              {formData?.targetAudience && (
                <p><span className="text-zinc-500">Audience:</span> {formData.targetAudience}</p>
              )}
              {formData?.offer && (
                <p><span className="text-zinc-500">Offer:</span> {formData.offer}</p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="border-zinc-700"
                onClick={() => setMode('edit')}
                disabled={running}
              >
                Edit answers
              </Button>
              <Button
                className="bg-blue-600 gap-2"
                onClick={handleQuickRepersonalize}
                disabled={running || !formData}
              >
                {running ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Personalizing…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Re-personalize now
                  </>
                )}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
