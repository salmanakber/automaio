'use client'

import { useCallback, useEffect, useState } from 'react'
import { BRAND } from '@/lib/brand'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  ExternalLink,
  Loader2,
  LogOut,
  FolderKanban,
  Mail,
  FileInput,
  CalendarDays,
  Plus,
  LayoutDashboard,
  Rocket,
  LayoutTemplate,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { WebflowSetupNotice } from '@/components/webflow/WebflowSetupNotice'
import { DesignerAuthOnboarding } from '@/components/webflow/DesignerAuthOnboarding'
import { DesignerScreensPanel } from '@/components/webflow/DesignerScreensPanel'
import { TemplateShellInstaller } from '@/components/webflow/TemplateShellInstaller'
import type { OrgSetupStatus } from '@/lib/organizations/setup-status'

export default function WebflowDesignerPage() {
  const [authenticated, setAuthenticated] = useState(false)
  const [checking, setChecking] = useState(true)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [orgId, setOrgId] = useState<string | null>(null)
  const [webflowSiteId, setWebflowSiteId] = useState<string | null>(null)
  const [webflowIntegrationId, setWebflowIntegrationId] = useState<string | null>(null)
  const [templatesCollectionId, setTemplatesCollectionId] = useState<string | null>(null)
  const [setupStatus, setSetupStatus] = useState<OrgSetupStatus | null>(null)
  const [justInstalled, setJustInstalled] = useState(false)
  const [signedInBanner, setSignedInBanner] = useState(false)

  const checkAuth = useCallback(() => {
    setChecking(true)
    return fetch('/api/auth/me', {
      credentials: 'include',
    })
      .then((r) => r.json())
      .then((d) => {
        const ok = Boolean(d.user)
        setAuthenticated(ok)
        setUserEmail(d.user?.email ?? null)
        if (ok) setSignedInBanner(false)
        return ok
      })
      .catch(() => {
        setAuthenticated(false)
        setUserEmail(null)
        return false
      })
      .finally(() => setChecking(false))
  }, [])

  useEffect(() => {
    let siteFromQuery = ''
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      setJustInstalled(params.get('installed') === '1')
      siteFromQuery = params.get('siteId')?.trim() ?? ''
      if (siteFromQuery) setWebflowSiteId(siteFromQuery)
      if (params.get('signedIn') === '1') {
        setSignedInBanner(true)
        const next = new URLSearchParams(params)
        next.delete('signedIn')
        const qs = next.toString()
        window.history.replaceState({}, '', `/webflow/designer${qs ? `?${qs}` : ''}`)
      }
    }
    const querySiteId = siteFromQuery
    checkAuth().then((ok) => {
      if (ok) {
        fetch('/api/organizations', { credentials: 'include' })
          .then((r) => r.json())
          .then((d) => {
            const id = d.organizations?.[0]?.id
            if (id) {
              setOrgId(id)
              fetch(`/api/organizations/${id}/setup-status`, { credentials: 'include' })
                .then((r) => r.json())
                .then(setSetupStatus)
                .catch(() => {})
              fetch(`/api/integrations/webflow?orgId=${encodeURIComponent(id)}`, {
                credentials: 'include',
              })
                .then((r) => r.json())
                .then((data) => {
                  const list = data.integrations ?? []
                  const first = Array.isArray(list) ? list[0] : null
                  if (first?.id) setWebflowIntegrationId(first.id)
                  if (first?.templatesCollectionId) setTemplatesCollectionId(first.templatesCollectionId)
                  if (first?.webflowSiteId && !querySiteId) {
                    setWebflowSiteId(first.webflowSiteId)
                  }
                })
                .catch(() => {})
            }
          })
          .catch(() => {})
      }
    })
  }, [checkAuth])

  const dash = (path: string) => (orgId ? `/dashboard/${orgId}${path}` : '/dashboard')

  const quickLinks: Array<{ label: string; href: string; icon: typeof Rocket; primary?: boolean }> = orgId
    ? [
        { label: 'Quick start', href: dash('/get-started'), icon: Rocket, primary: true },
        { label: 'New project', href: dash('/projects/new'), icon: Plus },
        { label: 'Templates', href: dash('/templates'), icon: LayoutTemplate },
        { label: 'Projects', href: dash('/projects'), icon: FolderKanban },
        { label: 'Schedule', href: dash('/schedule'), icon: CalendarDays },
        { label: 'Forms', href: dash('/forms'), icon: FileInput },
        { label: 'Email', href: dash('/email'), icon: Mail },
      ]
    : [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }]

  return (
    <div className="min-h-0 bg-background p-3">
      <WebflowSetupNotice context="designer" />
      <Card className="border-0 shadow-none sm:border sm:shadow-sm">
        <CardHeader className="pb-2 px-3 pt-3">
          <div className="flex items-start justify-between gap-2">
            <div>
              <CardTitle className="text-base">{BRAND.name}</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                {authenticated
                  ? `Signed in${userEmail ? ` · ${userEmail}` : ''}`
                  : 'Sign in to manage campaigns'}
              </CardDescription>
            </div>
            {checking ? (
              <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
            ) : null}
          </div>
          {webflowSiteId ? (
            <Badge variant="outline" className="text-[9px] font-mono mt-1">
              site: {webflowSiteId.slice(0, 12)}…
            </Badge>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3 px-3 pb-3">
          {signedInBanner && !authenticated ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
              Login completed in your browser. Click <strong>Refresh</strong> below to connect this
              panel.
            </div>
          ) : null}

          {authenticated ? (
            <>
              <TemplateShellInstaller
                integrationId={webflowIntegrationId}
                collectionId={templatesCollectionId}
                autoSync
              />
              <DesignerScreensPanel siteId={webflowSiteId} />

              {setupStatus && !setupStatus.isFullySetup && (
                <div className="rounded-md border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">Setup progress</p>
                    <Badge variant="secondary" className="text-[10px]">
                      {setupStatus.percentComplete}%
                    </Badge>
                  </div>
                  {setupStatus.steps.slice(0, 3).map((step) => (
                    <div key={step.id} className="flex items-center gap-2 text-[10px]">
                      {step.done ? (
                        <CheckCircle2 className="size-3 text-emerald-600" />
                      ) : (
                        <Circle className="size-3 text-muted-foreground" />
                      )}
                      <span className={step.done ? 'text-muted-foreground line-through' : ''}>
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                {quickLinks.map((link) => (
                  <Button
                    key={link.href}
                    asChild
                    variant={link.primary ? 'default' : 'outline'}
                    size="sm"
                    className="h-auto py-2 justify-start"
                  >
                    <a href={link.href} target="_blank" rel="noreferrer">
                      <link.icon className="size-3.5 mr-1.5 shrink-0" />
                      <span className="text-xs">{link.label}</span>
                    </a>
                  </Button>
                ))}
              </div>
              <Button asChild className="w-full" size="sm">
                <a href={dash('')} target="_blank" rel="noreferrer">
                  Open full dashboard
                  <ExternalLink className="ml-2 size-3.5" />
                </a>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={async () => {
                  await fetch('/api/auth/logout', {
                    method: 'POST',
                    credentials: 'include',
                  })
                  setAuthenticated(false)
                  setUserEmail(null)
                  setOrgId(null)
                  setSetupStatus(null)
                }}
              >
                <LogOut className="size-4 mr-2" />
                Sign out
              </Button>
            </>
          ) : (
            <DesignerAuthOnboarding
              onRefresh={() => void checkAuth()}
              checking={checking}
              justInstalled={justInstalled}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}
