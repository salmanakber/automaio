'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { ProviderApiKeysCard } from '@/components/admin/ProviderApiKeysCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ModelCatalogPicker } from '@/components/admin/ModelCatalogPicker'
import { AI_MODEL_CATALOG, PROVIDER_LABELS, type AIProvider } from '@/lib/ai/model-catalog'
import { Bot, Loader2, Trash2 } from 'lucide-react'

type AIModelRow = {
  id: string
  modelName: string
  catalogLabel: string
  provider: string
  isActive: boolean
  maxTokens: number
  temperature: number
  fallbackOrder: number | null
}

export default function AdminAIConfig() {
  const [configs, setConfigs] = useState<AIModelRow[]>([])
  const [providers, setProviders] = useState<Record<string, boolean>>({})
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [showNewModel, setShowNewModel] = useState(false)
  const [formData, setFormData] = useState({
    modelName: '',
    maxTokens: 2000,
    temperature: 0.7,
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({
    maxTokens: 2000,
    temperature: 0.7,
    fallbackOrder: 1,
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-models')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setConfigs(data.configs ?? [])
      setProviders(data.providers ?? {})
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const handleAddModel = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setMessage(null)
    if (!formData.modelName) {
      setError('Select a model from the catalog')
      return
    }

    const catalog = AI_MODEL_CATALOG.find((m) => m.id === formData.modelName)
    if (catalog && !providers[catalog.provider]) {
      setError(
        `Save your ${PROVIDER_LABELS[catalog.provider]} API key above before adding this model.`,
      )
      return
    }

    try {
      const res = await fetch('/api/admin/ai-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelName: formData.modelName,
          maxTokens: formData.maxTokens,
          temperature: formData.temperature,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage(`Added ${formData.modelName}`)
      setShowNewModel(false)
      setFormData({ modelName: '', maxTokens: 2000, temperature: 0.7 })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add model')
    }
  }

  const startEdit = (row: AIModelRow) => {
    setEditingId(row.id)
    setEditForm({
      maxTokens: row.maxTokens,
      temperature: row.temperature,
      fallbackOrder: row.fallbackOrder ?? 1,
    })
  }

  const handleSaveEdit = async (id: string) => {
    setError(null)
    try {
      const res = await fetch(`/api/admin/ai-models/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maxTokens: editForm.maxTokens,
          temperature: editForm.temperature,
          fallbackOrder: editForm.fallbackOrder,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Model updated')
      setEditingId(null)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed')
    }
  }

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Remove ${name} from configuration?`)) return
    try {
      const res = await fetch(`/api/admin/ai-models/${id}`, { method: 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Model removed')
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  const selectedCatalog = AI_MODEL_CATALOG.find((m) => m.id === formData.modelName)
  const selectedProviderReady =
    selectedCatalog && Boolean(providers[selectedCatalog.provider])

  return (
    <>
      <AdminPageHeader
        title="AI Config"
        description="Save provider API keys here, then add models. No .env setup required."
      >
        <Button asChild variant="outline">
          <Link href="/admin/ai-engine">
            <Bot className="size-4 mr-2" />
            AI Engine
          </Link>
        </Button>
      </AdminPageHeader>

      <div className="mx-auto max-w-6xl px-6 pb-12 space-y-6">
        {message ? (
          <p className="text-sm text-green-600 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive rounded-lg border px-4 py-3">{error}</p>
        ) : null}

        <ProviderApiKeysCard onSaved={load} />

        <Button onClick={() => setShowNewModel(!showNewModel)}>
          {showNewModel ? 'Cancel' : '+ Add AI model'}
        </Button>

        {showNewModel ? (
          <Card>
            <CardHeader>
              <CardTitle>Add model</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddModel} className="space-y-4">
                <div>
                  <Label>Model</Label>
                  <div className="mt-1">
                    <ModelCatalogPicker
                      value={formData.modelName}
                      onChange={(id) => setFormData({ ...formData, modelName: id })}
                      providers={providers as Partial<Record<AIProvider, boolean>>}
                      showKeyHints
                      allowEmpty
                      placeholder="Select model…"
                    />
                  </div>
                </div>
                {selectedCatalog && !selectedProviderReady ? (
                  <p className="text-sm rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-amber-900 dark:text-amber-100">
                    Save your {PROVIDER_LABELS[selectedCatalog.provider]} API key in the
                    section above, then add this model.
                  </p>
                ) : null}
                {selectedCatalog && selectedProviderReady ? (
                  <p className="text-sm rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-green-800 dark:text-green-200">
                    {PROVIDER_LABELS[selectedCatalog.provider]} key is saved — ready to add.
                  </p>
                ) : null}
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label>Max tokens</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      value={formData.maxTokens}
                      onChange={(e) =>
                        setFormData({ ...formData, maxTokens: parseInt(e.target.value, 10) })
                      }
                      min={100}
                      max={8000}
                    />
                  </div>
                  <div>
                    <Label>Temperature</Label>
                    <Input
                      type="number"
                      className="mt-1"
                      value={formData.temperature}
                      onChange={(e) =>
                        setFormData({ ...formData, temperature: parseFloat(e.target.value) })
                      }
                      min={0}
                      max={2}
                      step={0.1}
                    />
                  </div>
                </div>
                <Button type="submit" disabled={Boolean(selectedCatalog && !selectedProviderReady)}>
                  Add model
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : null}

        {loading ? (
          <Loader2 className="size-8 animate-spin mx-auto" />
        ) : configs.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              No models yet. Save a provider key above, then add models.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {configs.map((config) => {
              const cat = AI_MODEL_CATALOG.find((m) => m.id === config.modelName)
              const providerOk = cat ? providers[cat.provider] : false
              return (
                <Card key={config.id}>
                  <CardContent className="py-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-semibold">{config.catalogLabel}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          <code className="text-xs">{config.modelName}</code> · Fallback #
                          {config.fallbackOrder ?? '—'} ·{' '}
                          {providerOk && cat
                            ? `Uses saved ${PROVIDER_LABELS[cat.provider]} key`
                            : 'Provider key missing'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={config.isActive ? 'default' : 'secondary'}>
                          {config.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline" onClick={() => startEdit(config)}>
                          Edit
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(config.id, config.modelName)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>

                    {editingId === config.id ? (
                      <div className="grid gap-3 sm:grid-cols-2 border-t pt-4">
                        <div>
                          <Label>Max tokens</Label>
                          <Input
                            type="number"
                            className="mt-1"
                            value={editForm.maxTokens}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                maxTokens: parseInt(e.target.value, 10),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Temperature</Label>
                          <Input
                            type="number"
                            className="mt-1"
                            step={0.1}
                            value={editForm.temperature}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                temperature: parseFloat(e.target.value),
                              })
                            }
                          />
                        </div>
                        <div>
                          <Label>Fallback order</Label>
                          <Input
                            type="number"
                            className="mt-1"
                            min={1}
                            value={editForm.fallbackOrder}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                fallbackOrder: parseInt(e.target.value, 10),
                              })
                            }
                          />
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                          <Button size="sm" onClick={() => handleSaveEdit(config.id)}>
                            Save changes
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
