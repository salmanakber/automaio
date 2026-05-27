'use client'

import { useEffect, useState } from 'react'
import { AdminPageHeader } from '@/components/admin/AdminPageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface UserRow {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: string
  organization: string
  status: string
  campaigns: number
  lastActive: string
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/users')
      .then((r) => r.json())
      .then((data) => setUsers(data.users ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <>
      <AdminPageHeader
        title="User & Client Management"
        description="All registered Automaio accounts and their organizations."
      />

      <div className="mx-auto max-w-6xl flex-1 p-6">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="size-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <Card>
            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b bg-muted/40">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium">User</th>
                    <th className="px-4 py-3 text-left font-medium">Role</th>
                    <th className="px-4 py-3 text-left font-medium">Organization</th>
                    <th className="px-4 py-3 text-left font-medium">Campaigns</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                    <th className="px-4 py-3 text-left font-medium">Last active</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No users yet. Run the database seed or sign up a new account.
                      </td>
                    </tr>
                  ) : (
                    users.map((u) => (
                      <tr key={u.id} className="hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium">
                            {[u.firstName, u.lastName].filter(Boolean).join(' ') || u.email}
                          </div>
                          <div className="text-muted-foreground text-xs">{u.email}</div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="outline" className="capitalize">
                            {u.role}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">{u.organization}</td>
                        <td className="px-4 py-3">{u.campaigns}</td>
                        <td className="px-4 py-3">
                          <Badge variant="secondary" className="capitalize">
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(u.lastActive).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  )
}
