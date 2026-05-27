'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Plug, AlertTriangle } from 'lucide-react'
import { WebflowSetupNotice } from '@/components/webflow/WebflowSetupNotice'
import { AuthPanel } from '@/components/auth/AuthPanel'

const ERROR_MESSAGES: Record<string, string> = {
  missing_code: 'Webflow did not return an authorization code. Please make sure the Redirect URI in your Webflow App settings exactly matches your callback URL, then try again.',
  invalid_state: 'The authorization state was invalid or expired. Please try installing again.',
  oauth_failed: 'OAuth authorization failed. Please try again.',
}

/**
 * Webflow App Marketplace install entry.
 * Register this URL in your Webflow App settings as the install / homepage URL.
 */
export default function WebflowInstallPage() {
  const searchParams = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const { organizations, loading: orgsLoading, createOrganization } = useOrganizations()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const webflowError = searchParams.get('webflow') === 'error'
    ? searchParams.get('message') || 'unknown'
    : null

  useEffect(() => {
    if (authLoading || orgsLoading || !user) return
    if (organizations.length === 1) {
      window.location.href = `/api/integrations/webflow/oauth?orgId=${organizations[0].id}`
    }
  }, [authLoading, orgsLoading, user, organizations])

  const handleConnect = (orgId: string) => {
    window.location.href = `/api/integrations/webflow/oauth?orgId=${orgId}`
  }

  const handleCreateOrg = async () => {
    const name = prompt('Organization name (your team or company):')
    if (!name?.trim()) return
    setCreating(true)
    setError(null)
    try {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
      const org = await createOrganization(name.trim(), slug || 'my-org')
      handleConnect(org.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create organization')
    } finally {
      setCreating(false)
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md space-y-4">
          {webflowError && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Webflow connection failed</p>
                    <p className="text-sm text-muted-foreground">
                      {ERROR_MESSAGES[webflowError] ?? webflowError}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          <WebflowSetupNotice context="install" />
          <Card>
            <CardContent className="pt-6">
              <AuthPanel
                redirectTo="/webflow/install"
                title="Install Automaio"
                defaultTab="login"
                onSuccess={() => window.location.reload()}
              />
              <p className="text-xs text-muted-foreground text-center pt-4">
                After sign-in you&apos;ll authorize Webflow to connect your site.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (orgsLoading || organizations.length === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="flex items-center gap-3 text-sm">
          <Loader2 className="size-5 animate-spin text-primary" />
          <span>Redirecting to Webflow authorization…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-lg space-y-4">
        {webflowError && (
          <Card className="border-destructive">
            <CardContent className="pt-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="size-5 text-destructive shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-medium text-destructive">Webflow connection failed</p>
                  <p className="text-sm text-muted-foreground">
                    {ERROR_MESSAGES[webflowError] ?? webflowError}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
        <WebflowSetupNotice context="install" />
        <Card>
          <CardHeader>
            <CardTitle>Connect Webflow</CardTitle>
            <CardDescription>
              Choose which Automaio organization should own this Webflow connection.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error ? <p className="text-sm text-destructive">{error}</p> : null}
            {organizations.length === 0 ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Create an organization to store campaigns and Webflow settings.
                </p>
                <Button onClick={handleCreateOrg} disabled={creating} className="w-full">
                  {creating ? 'Creating…' : 'Create organization & connect Webflow'}
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {organizations.map((org) => (
                  <Button
                    key={org.id}
                    variant="outline"
                    className="w-full justify-start h-auto py-3"
                    onClick={() => handleConnect(org.id)}
                  >
                    <Plug className="size-4 mr-2 shrink-0" />
                    <span className="text-left">
                      <span className="block font-medium">{org.name}</span>
                      <span className="block text-xs text-muted-foreground font-normal">
                        Connect Webflow to this workspace
                      </span>
                    </span>
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
