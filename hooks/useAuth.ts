import { useCallback, useEffect, useState } from 'react'

interface User {
  id: string
  email: string
  firstName?: string
  lastName?: string
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        cache: 'no-store',
        headers: { 'ngrok-skip-browser-warning': '1' },
      })
      const data = await res.json()
      setUser(data.user ?? null)
      return data.user as User | null
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user')
      setUser(null)
      return null
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      let current = await fetchUser()
      // Brief retry after login redirect — cookie may not be visible on first paint
      if (!current && !cancelled) {
        await new Promise((r) => setTimeout(r, 400))
        current = await fetchUser()
      }
      if (!cancelled) setLoading(false)
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [fetchUser])

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include', headers: { 'ngrok-skip-browser-warning': '1' } })
      setUser(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout')
    }
  }

  return { user, loading, error, logout, refetch: fetchUser }
}
