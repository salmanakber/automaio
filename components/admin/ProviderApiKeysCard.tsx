'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { PROVIDER_LABELS, type AIProvider } from '@/lib/ai/model-catalog'
import { Loader2 } from 'lucide-react'

const PROVIDER_ORDER: AIProvider[] = [
  'google',
  'openai',
  'anthropic',
  'groq',
  'deepseek',
  'mistral',
  'together',
  'openrouter',
]

type ProviderKeyInfo = { configured: boolean; masked: string | null }

type ProviderApiKeysCardProps = {
  onSaved?: () => void
}

export function ProviderApiKeysCard({ onSaved }: ProviderApiKeysCardProps) {
  const [status, setStatus] = useState<Record<AIProvider, ProviderKeyInfo> | null>(null)
  const [draft, setDraft] = useState<Partial<Record<AIProvider, string>>>({})
  const [clear, setClear] = useState<Partial<Record<AIProvider, boolean>>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-models/provider-keys')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(data.providers)
      setDraft({})
      setClear({})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load keys')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    setError(null)
    try {
      const keys: Partial<Record<AIProvider, string | null>> = {}
      for (const p of PROVIDER_ORDER) {
        if (clear[p]) {
          keys[p] = null
          continue
        }
        const value = draft[p]?.trim()
        if (value) keys[p] = value
      }

      if (Object.keys(keys).length === 0) {
        setMessage('No changes to save.')
        setSaving(false)
        return
      }

      const res = await fetch('/api/admin/ai-models/provider-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keys }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setStatus(data.providers)
      setDraft({})
      setClear({})
      setMessage('API keys saved.')
      onSaved?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Provider API keys</CardTitle>
        <CardDescription>
          Save keys here — no .env file needed. One Google key runs every Gemini model. Leave a
          field blank to keep an existing key; use Clear to remove.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {PROVIDER_ORDER.map((provider) => {
              const info = status?.[provider]
              const configured = info?.configured ?? false
              return (
                <div key={provider} className="space-y-2 rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <Label className="font-medium">{PROVIDER_LABELS[provider]}</Label>
                    <Badge variant={configured ? 'default' : 'secondary'}>
                      {configured ? `Saved ${info?.masked ?? ''}` : 'Not set'}
                    </Badge>
                  </div>
                  <Input
                    type="password"
                    autoComplete="off"
                    value={draft[provider] ?? ''}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [provider]: e.target.value }))
                    }
                    placeholder={
                      clear[provider]
                        ? 'Will be removed on save'
                        : configured
                          ? `${info?.masked ?? '••••'} — paste new key to replace`
                          : 'Paste API key'
                    }
                    className="h-9"
                  />
                  {configured ? (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      <input
                        type="checkbox"
                        checked={Boolean(clear[provider])}
                        onChange={(e) =>
                          setClear((c) => ({ ...c, [provider]: e.target.checked }))
                        }
                        className="rounded border"
                      />
                      Clear saved key
                    </label>
                  ) : null}
                </div>
              )
            })}
          </div>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button type="button" onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Saving…' : 'Save API keys'}
          </Button>
          {message ? <p className="text-sm text-green-600">{message}</p> : null}
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </CardContent>
    </Card>
  )
}
