'use client'

import { useAuth } from '@/hooks/useAuth'
import { useOrganizations } from '@/hooks/useOrganizations'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const { organizations, loading: orgsLoading, createOrganization } = useOrganizations()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login')
    }
  }, [user, authLoading, router])

  const handleCreateOrg = async () => {
    try {
      const name = prompt('Enter organization name:')
      if (!name) return

      const slug = name.toLowerCase().replace(/\s+/g, '-')
      await createOrganization(name, slug)
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to create organization')
    }
  }

  if (authLoading || orgsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Loading...</h2>
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Automaio</h1>
            <p className="text-muted-foreground">Welcome, {user.firstName || user.email}</p>
          </div>
          <Link href="/auth/login">
            <Button variant="outline">Logout</Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold mb-2">Your Organizations</h2>
            <p className="text-muted-foreground">Manage campaigns across your organizations</p>
          </div>
          <Button onClick={handleCreateOrg} size="lg">
            + New Organization
          </Button>
        </div>

        {organizations.length === 0 ? (
          <div className="bg-card rounded-lg border-2 border-dashed p-12 text-center">
            <h3 className="text-xl font-semibold mb-2">No organizations yet</h3>
            <p className="text-muted-foreground mb-4">Create your first organization to start building AI-powered marketing campaigns</p>
            <Button onClick={handleCreateOrg}>Create Organization</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((org) => (
              <Link key={org.id} href={`/dashboard/${org.id}`}>
                <div className="bg-card rounded-lg border p-6 hover:border-primary hover:shadow-lg transition-all cursor-pointer">
                  {org.logoUrl && (
                    <img src={org.logoUrl} alt={org.name} className="w-12 h-12 mb-4 rounded" />
                  )}
                  <h3 className="text-lg font-semibold mb-2">{org.name}</h3>
                  {org.description && (
                    <p className="text-muted-foreground text-sm mb-4">{org.description}</p>
                  )}
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{org._count?.campaigns || 0} campaigns</span>
                    <span>{org._count?.teamMembers || 0} members</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
