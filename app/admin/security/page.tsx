'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Loader2 } from 'lucide-react'

type UserRow = {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  organization: string
  campaigns: number
  lastActive: string
}

export default function SecurityAccessControl() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((d) => setUsers(d.users ?? []))
      .finally(() => setLoading(false))
  }, [])

  return (
    <div>
      <AdminPageHeader
        title="Security & Access Control"
        description="Registered users and roles from the database."
      />

      <div className="mx-auto max-w-6xl px-6 pb-12">
        <Card>
          <CardHeader>
            <CardTitle>Users ({users.length})</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <Loader2 className="size-8 animate-spin mx-auto" />
            ) : users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="pb-2 pr-4">Email</th>
                      <th className="pb-2 pr-4">Name</th>
                      <th className="pb-2 pr-4">Role</th>
                      <th className="pb-2 pr-4">Organization</th>
                      <th className="pb-2 pr-4">Campaigns</th>
                      <th className="pb-2">Last active</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id} className="border-b last:border-0">
                        <td className="py-2 pr-4 font-mono text-xs">{u.email}</td>
                        <td className="py-2 pr-4">
                          {[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}
                        </td>
                        <td className="py-2 pr-4">
                          <Badge variant="secondary">{u.role}</Badge>
                        </td>
                        <td className="py-2 pr-4">{u.organization}</td>
                        <td className="py-2 pr-4">{u.campaigns}</td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(u.lastActive).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-4">
              API key rotation, OAuth audit logs, and IP restrictions require additional integration.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
