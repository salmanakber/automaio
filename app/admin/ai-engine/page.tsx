'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Sparkles, Settings2, Loader2 } from 'lucide-react'
import { ModelCatalogPicker } from '@/components/admin/ModelCatalogPicker'
import { OPTIMIZATION_MODES, PROVIDER_LABELS, type AIProvider } from '@/lib/ai/model-catalog'

type AIModelRow = {
  id: string
  modelName: string
  catalogLabel: string
  provider: string
  isActive: boolean
  maxTokens: number
  temperature: number
  fallbackOrder: number | null
  failures: number
  hasStoredApiKey: boolean
}

type AdminModelsResponse = {
  configs: AIModelRow[]
  settings: { primaryModel: string; optimizationMode: string }
  providers: Record<AIProvider, boolean>
}

export default function AIEngineManagement() {
  const [data, setData] = useState<AdminModelsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [primaryModel, setPrimaryModel] = useState('gpt-4o-mini')
  const [mode, setMode] = useState('balanced')
  const [savingSettings, setSavingSettings] = useState(false)
  const [settingsMessage, setSettingsMessage] = useState<string | null>(null)

  const [testPrompt, setTestPrompt] = useState('Say hello and confirm Automaio AI is working.')
  const [testModel, setTestModel] = useState('')
  const [testResult, setTestResult] = useState<string | null>(null)
  const [testError, setTestError] = useState<string | null>(null)
  const [testing, setTesting] = useState(false)
  const [testMeta, setTestMeta] = useState<{ model?: string; latencyMs?: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-models')
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setData(json)
      setPrimaryModel(json.settings?.primaryModel ?? 'gpt-4o-mini')
      setMode(json.settings?.optimizationMode ?? 'balanced')
      const active = (json.configs as AIModelRow[]).filter((c) => c.isActive)
      setTestModel((prev) => prev || json.settings?.primaryModel || active[0]?.modelName || '')
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleToggleModel = async (modelId: string, isActive: boolean) => {
    await fetch(`/api/admin/ai-models/${modelId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    load()
  }

  const handleSaveSettings = async () => {
    setSavingSettings(true)
    setSettingsMessage(null)
    try {
      const res = await fetch('/api/admin/ai-models/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ primaryModel, optimizationMode: mode }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setSettingsMessage('Platform settings saved.')
      load()
    } catch (e) {
      setSettingsMessage(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSavingSettings(false)
    }
  }

  const handleTestPrompt = async () => {
    setTesting(true)
    setTestError(null)
    setTestResult(null)
    setTestMeta(null)
    try {
      const res = await fetch('/api/admin/ai-models/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: testPrompt, model: testModel || primaryModel }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Test failed')
      setTestResult(json.content)
      setTestMeta({ model: json.model, latencyMs: json.latencyMs })
    } catch (e) {
      setTestError(e instanceof Error ? e.message : 'Test failed')
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center p-12">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const activeModels = data?.configs.filter((c) => c.isActive) ?? []

  return (
    <>
      <AdminPageHeader
        title="AI Engine"
        description="Set primary model, optimization mode, enable/disable models, and run live tests."
      >
        <Button asChild variant="outline">
          <Link href="/admin/ai-config">
            <Settings2 className="size-4 mr-2" />
            API keys & models
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="mx-auto w-full max-w-6xl flex-1 space-y-6 p-6">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {data?.providers
            ? (Object.entries(data.providers) as [AIProvider, boolean][]).map(([key, ok]) => (
                <Card key={key}>
                  <CardContent className="py-3 flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">{PROVIDER_LABELS[key]}</span>
                    <Badge variant={ok ? 'default' : 'secondary'} className="text-xs shrink-0">
                      {ok ? 'Ready' : 'No key'}
                    </Badge>
                  </CardContent>
                </Card>
              ))
            : null}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Platform settings</CardTitle>
            <CardDescription>
              Primary model runs first; optimization mode adjusts fallback order for campaigns.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="mb-2 block">Primary model</Label>
                <ModelCatalogPicker
                  value={primaryModel}
                  onChange={setPrimaryModel}
                  providers={data?.providers}
                />
              </div>
              <div>
                <Label className="mb-2 block">Optimization mode</Label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm capitalize"
                >
                  {OPTIMIZATION_MODES.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Button onClick={handleSaveSettings} disabled={savingSettings}>
              {savingSettings ? 'Saving…' : 'Save platform settings'}
            </Button>
            {settingsMessage ? (
              <p className="text-sm text-muted-foreground">{settingsMessage}</p>
            ) : null}
          </CardContent>
        </Card>

        <section className="space-y-4">
          <h2 className="text-lg font-semibold">Active models (fallback order)</h2>
          {data?.configs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-10 text-center">
                <p className="text-muted-foreground mb-4">No models in the database yet.</p>
                <Button asChild>
                  <Link href="/admin/ai-config">Add models in AI Config</Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            data?.configs.map((model) => (
              <Card key={model.id}>
                <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{model.catalogLabel}</h3>
                      <Badge variant={model.isActive ? 'default' : 'secondary'}>
                        {model.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {model.modelName === primaryModel ? (
                        <Badge variant="outline">Primary</Badge>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Fallback #{model.fallbackOrder ?? '—'} · {model.maxTokens} tokens · temp{' '}
                      {model.temperature}
                      · uses saved provider key
                      {model.failures > 0 ? ` · ${model.failures} failures logged` : ''}
                    </p>
                  </div>
                  <Button
                    variant={model.isActive ? 'outline' : 'default'}
                    onClick={() => handleToggleModel(model.id, model.isActive)}
                  >
                    {model.isActive ? 'Disable' : 'Enable'}
                  </Button>
                </CardContent>
              </Card>
            ))
          )}
        </section>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="size-5" />
              Quick prompt test
            </CardTitle>
            <CardDescription>
              Tests the selected model using your DB config or environment API keys.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Model to test</Label>
              {activeModels.length > 0 ? (
                <ModelCatalogPicker
                  value={testModel || primaryModel}
                  onChange={setTestModel}
                  providers={data?.providers}
                  modelIds={activeModels.map((m) => m.modelName)}
                  showFilters={false}
                />
              ) : (
                <ModelCatalogPicker
                  value={testModel || primaryModel}
                  onChange={setTestModel}
                  providers={data?.providers}
                  showFilters
                />
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="test-prompt">Test prompt</Label>
              <Textarea
                id="test-prompt"
                rows={3}
                value={testPrompt}
                onChange={(e) => setTestPrompt(e.target.value)}
              />
            </div>
            <Button onClick={handleTestPrompt} disabled={testing || !testPrompt.trim()}>
              {testing ? 'Running…' : 'Run test'}
            </Button>
            {testError ? <p className="text-sm text-destructive">{testError}</p> : null}
            {testResult ? (
              <div className="rounded-lg border bg-muted/40 p-4 text-sm whitespace-pre-wrap">
                {testResult}
                {testMeta ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Model: {testMeta.model} · {testMeta.latencyMs}ms
                  </p>
                ) : null}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
