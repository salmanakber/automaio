'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { INDUSTRIES } from '@/lib/industries'
import { PROMPT_TYPES, DEFAULT_ASSET_PROMPTS } from '@/lib/prompts/defaults'
import { Save, History, Loader2 } from 'lucide-react'

type PromptRow = {
  id: string
  promptContent: string
  promptType: string
  industry: string | null
  version: number
  isActive: boolean
  updatedAt: string
}

const ASSET_LABELS: Record<string, string> = {
  [PROMPT_TYPES.assetHeadline]: 'Headlines',
  [PROMPT_TYPES.assetBodyCopy]: 'Body copy',
  [PROMPT_TYPES.assetCta]: 'CTAs',
  [PROMPT_TYPES.assetSubjectLine]: 'Subject lines',
  [PROMPT_TYPES.assetVisual]: 'Visual descriptions',
}

export default function PromptsManagement() {
  const [prompts, setPrompts] = useState<PromptRow[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selectedTab, setSelectedTab] = useState<'system' | 'industry' | 'assets' | 'versions'>('system')

  const [systemContent, setSystemContent] = useState('')
  const [industryDrafts, setIndustryDrafts] = useState<Record<string, string>>({})
  const [assetDrafts, setAssetDrafts] = useState<Record<string, string>>({})

  const [versionType, setVersionType] = useState<string>(PROMPT_TYPES.system)
  const [versionIndustry, setVersionIndustry] = useState<string>(INDUSTRIES[0])
  const [versions, setVersions] = useState<PromptRow[]>([])
  const [versionsLoading, setVersionsLoading] = useState(false)

  const loadPrompts = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/prompts')
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      const rows: PromptRow[] = data.prompts ?? []
      setPrompts(rows)

      const system = rows.find((p) => p.promptType === PROMPT_TYPES.system)
      setSystemContent(system?.promptContent ?? '')

      const industries: Record<string, string> = {}
      for (const ind of INDUSTRIES) {
        const row = rows.find((p) => p.promptType === PROMPT_TYPES.industry && p.industry === ind)
        industries[ind] = row?.promptContent ?? ''
      }
      setIndustryDrafts(industries)

      const assets: Record<string, string> = {}
      for (const type of Object.keys(DEFAULT_ASSET_PROMPTS)) {
        const row = rows.find((p) => p.promptType === type)
        assets[type] = row?.promptContent ?? DEFAULT_ASSET_PROMPTS[type]
      }
      setAssetDrafts(assets)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load prompts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPrompts()
  }, [loadPrompts])

  const savePrompt = async (
    key: string,
    body: { promptType: string; industry?: string | null; promptContent: string },
  ) => {
    setSaving(key)
    setMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Prompt saved. New version is now active for all campaigns.')
      await loadPrompts()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  const loadVersions = useCallback(async () => {
    setVersionsLoading(true)
    try {
      const params = new URLSearchParams({
        versions: '1',
        promptType: versionType,
      })
      if (versionType === PROMPT_TYPES.industry) {
        params.set('industry', versionIndustry)
      } else {
        params.set('industry', 'null')
      }
      const res = await fetch(`/api/admin/prompts?${params}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setVersions(data.versions ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load versions')
    } finally {
      setVersionsLoading(false)
    }
  }, [versionType, versionIndustry])

  useEffect(() => {
    if (selectedTab === 'versions') loadVersions()
  }, [selectedTab, loadVersions])

  const restoreVersion = async (id: string) => {
    setSaving(id)
    try {
      const res = await fetch(`/api/admin/prompts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'restore' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setMessage('Version restored as the active prompt.')
      await loadPrompts()
      await loadVersions()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Restore failed')
    } finally {
      setSaving(null)
    }
  }

  const industryCount = useMemo(
    () => INDUSTRIES.filter((ind) => industryDrafts[ind]?.trim()).length,
    [industryDrafts],
  )

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div>
      <AdminPageHeader
        title="Prompt & Template Engine"
        description="Edit AI instructions for every industry. Changes apply immediately to new content generation."
      />

      <div className="mx-auto max-w-6xl px-6 pb-12 space-y-6">
        {message ? (
          <p className="text-sm text-green-600 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3">
            {message}
          </p>
        ) : null}
        {error ? (
          <p className="text-sm text-destructive rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3">
            {error}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b pb-2">
          {(
            [
              ['system', 'System prompt'],
              ['industry', `Industries (${INDUSTRIES.length})`],
              ['assets', 'Content prompts'],
              ['versions', 'Version history'],
            ] as const
          ).map(([tab, label]) => (
            <Button
              key={tab}
              variant={selectedTab === tab ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setSelectedTab(tab)}
            >
              {label}
            </Button>
          ))}
        </div>

        {selectedTab === 'system' && (
          <Card>
            <CardHeader>
              <CardTitle>Global system prompt</CardTitle>
              <CardDescription>
                Base instructions for every AI generation call. Industry and asset prompts are layered
                on top.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                className="font-mono text-sm min-h-[200px]"
                value={systemContent}
                onChange={(e) => setSystemContent(e.target.value)}
              />
              <Button
                onClick={() =>
                  savePrompt('system', {
                    promptType: PROMPT_TYPES.system,
                    promptContent: systemContent,
                  })
                }
                disabled={saving === 'system' || !systemContent.trim()}
              >
                {saving === 'system' ? (
                  <Loader2 className="size-4 mr-2 animate-spin" />
                ) : (
                  <Save className="size-4 mr-2" />
                )}
                Save system prompt
              </Button>
            </CardContent>
          </Card>
        )}

        {selectedTab === 'industry' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {industryCount} of {INDUSTRIES.length} industries configured. Each campaign uses the
              prompt matching its industry.
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              {INDUSTRIES.map((industry) => (
                <Card key={industry}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base flex items-center justify-between">
                      {industry}
                      {prompts.find(
                        (p) => p.promptType === PROMPT_TYPES.industry && p.industry === industry,
                      ) ? (
                        <Badge variant="secondary" className="text-xs font-normal">
                          v
                          {
                            prompts.find(
                              (p) =>
                                p.promptType === PROMPT_TYPES.industry && p.industry === industry,
                            )?.version
                          }
                        </Badge>
                      ) : null}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Textarea
                      rows={4}
                      className="text-sm"
                      value={industryDrafts[industry] ?? ''}
                      onChange={(e) =>
                        setIndustryDrafts((prev) => ({ ...prev, [industry]: e.target.value }))
                      }
                      placeholder={`Marketing guidance for ${industry}…`}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      disabled={saving === industry}
                      onClick={() =>
                        savePrompt(industry, {
                          promptType: PROMPT_TYPES.industry,
                          industry,
                          promptContent: industryDrafts[industry] ?? '',
                        })
                      }
                    >
                      {saving === industry ? 'Saving…' : 'Save'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'assets' && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Per-asset user prompts. Use variables:{' '}
              <code className="text-xs">{'{{industry}}'}</code>,{' '}
              <code className="text-xs">{'{{targetAudience}}'}</code>,{' '}
              <code className="text-xs">{'{{goals}}'}</code>,{' '}
              <code className="text-xs">{'{{primaryGoal}}'}</code>
            </p>
            {Object.entries(ASSET_LABELS).map(([promptType, label]) => (
              <Card key={promptType}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{label}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Textarea
                    className="font-mono text-sm min-h-[100px]"
                    value={assetDrafts[promptType] ?? ''}
                    onChange={(e) =>
                      setAssetDrafts((prev) => ({ ...prev, [promptType]: e.target.value }))
                    }
                  />
                  <Button
                    size="sm"
                    disabled={saving === promptType}
                    onClick={() =>
                      savePrompt(promptType, {
                        promptType,
                        promptContent: assetDrafts[promptType] ?? '',
                      })
                    }
                  >
                    {saving === promptType ? 'Saving…' : 'Save'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {selectedTab === 'versions' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="size-5" />
                Version history
              </CardTitle>
              <CardDescription>Restore a previous prompt version at any time.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <div className="space-y-1">
                  <Label>Prompt type</Label>
                  <select
                    className="rounded-md border bg-background px-3 py-2 text-sm"
                    value={versionType}
                    onChange={(e) => {
                      setVersionType(e.target.value)
                      if (e.target.value === PROMPT_TYPES.industry && !versionIndustry) {
                        setVersionIndustry(INDUSTRIES[0])
                      }
                    }}
                  >
                    <option value={PROMPT_TYPES.system}>System</option>
                    <option value={PROMPT_TYPES.industry}>Industry</option>
                    {Object.entries(ASSET_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                {versionType === PROMPT_TYPES.industry ? (
                  <div className="space-y-1">
                    <Label>Industry</Label>
                    <select
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                      value={versionIndustry}
                      onChange={(e) => setVersionIndustry(e.target.value)}
                    >
                      {INDUSTRIES.map((ind) => (
                        <option key={ind} value={ind}>
                          {ind}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}
                <Button variant="outline" className="self-end" onClick={loadVersions}>
                  Refresh
                </Button>
              </div>

              {versionsLoading ? (
                <Loader2 className="size-6 animate-spin mx-auto" />
              ) : versions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No versions found.</p>
              ) : (
                <ul className="space-y-2">
                  {versions.map((v) => (
                    <li
                      key={v.id}
                      className="flex items-start justify-between gap-4 rounded-lg border p-4"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">Version {v.version}</span>
                          {v.isActive ? <Badge>Active</Badge> : null}
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">
                          {new Date(v.updatedAt).toLocaleString()}
                        </p>
                        <p className="text-sm line-clamp-3 font-mono">{v.promptContent}</p>
                      </div>
                      {!v.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={saving === v.id}
                          onClick={() => restoreVersion(v.id)}
                        >
                          Restore
                        </Button>
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
