import { useEffect, useState } from 'react'

interface Organization {
  id: string
  name: string
  slug: string
  logoUrl?: string
  description?: string
  _count?: {
    campaigns: number
    teamMembers: number
  }
}

export function useOrganizations() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        const res = await fetch('/api/organizations', {
          
        })
        const data = await res.json()
        setOrganizations(data.organizations || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations')
      } finally {
        setLoading(false)
      }
    }

    fetchOrganizations()
  }, [])

  const createOrganization = async (name: string, slug: string, description?: string) => {
    try {
      const res = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, description }),
      })

      if (!res.ok) {
        throw new Error('Failed to create organization')
      }

      const data = await res.json()
      setOrganizations([data.organization, ...organizations])
      return data.organization
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to create organization')
    }
  }

  return { organizations, loading, error, createOrganization }
}
