'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { DashboardShell } from '@/components/dashboard/DashboardShell'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WebflowCmsSettings } from '@/components/webflow/WebflowCmsSettings'

interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  description?: string
}

export default function OrgSettings() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const orgId = params.orgId as string
  const { user, loading: authLoading } = useAuth()

  const [org, setOrg] = useState<Organization | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState<Organization | null>(null)
  const [activeTab, setActiveTab] = useState('general')

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab === 'integrations' || tab === 'general' || tab === 'team') {
      setActiveTab(tab)
    }
  }, [searchParams])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchOrg = async () => {
      try {
        const res = await fetch(`/api/organizations/${orgId}`)
        const data = await res.json()
        if (data.organization) {
          setOrg(data.organization)
          setFormData(data.organization)
        }
      } catch (error) {
        console.error('Failed to fetch organization:', error)
      } finally {
        setLoading(false)
      }
    }

    if (orgId) {
      fetchOrg()
    }
  }, [orgId])

  const handleSave = async () => {
    if (!formData) return

    try {
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (res.ok) {
        const data = await res.json()
        setOrg(data.organization)
        setEditing(false)
      }
    } catch (error) {
      console.error('Failed to update organization:', error)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  if (!org) return null

  return (
    <DashboardShell orgId={orgId} title={`${org.name} Settings`} description="Manage your organization and integrations">
      <div className="border-b mb-6">
        <div className="flex gap-6">
          {[
            { id: 'general', label: 'General' },
            { id: 'team', label: 'Team Members' },
            { id: 'integrations', label: 'Integrations' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'general' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-card rounded-lg border p-6">
            <h3 className="text-lg font-semibold mb-6">Organization Details</h3>
            {!editing ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Name</label>
                  <p>{org.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Slug</label>
                  <p>{org.slug}</p>
                </div>
                {org.description && (
                  <div>
                    <label className="block text-sm font-medium text-muted-foreground mb-1">Description</label>
                    <p>{org.description}</p>
                  </div>
                )}
                <Button onClick={() => setEditing(true)}>Edit Details</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <Input
                    value={formData?.name || ''}
                    onChange={(e) => setFormData({ ...formData!, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Description</label>
                  <textarea
                    value={formData?.description || ''}
                    onChange={(e) => setFormData({ ...formData!, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-md bg-background min-h-24"
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="bg-card rounded-lg border p-6 max-w-2xl">
          <h3 className="text-lg font-semibold mb-4">Team Members</h3>
          <p className="text-muted-foreground">Manage team members coming soon</p>
        </div>
      )}

      {activeTab === 'integrations' && <WebflowCmsSettings orgId={orgId} />}
    </DashboardShell>
  )
}
