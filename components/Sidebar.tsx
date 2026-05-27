'use client'

import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import {
  LayoutDashboard,
  FolderKanban,
  Mail,
  FileInput,
  CalendarDays,
  Megaphone,
  Settings,
  Sparkles,
  LayoutTemplate,
  Rocket,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarProps {
  orgId?: string
  campaignId?: string
}

function NavItem({
  href,
  label,
  icon: Icon,
  active,
}: {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  active: boolean
}) {
  return (
    <Link href={href}>
      <div
        className={cn(
          'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer',
          active
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-muted hover:text-foreground',
        )}
      >
        <Icon className="size-4 shrink-0" />
        {label}
      </div>
    </Link>
  )
}

export function Sidebar({ orgId, campaignId }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { logout } = useAuth()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/')

  return (
    <aside className="w-64 border-r bg-card h-screen fixed left-0 top-0 flex flex-col z-20">
      <div className="p-6 border-b">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
            <Sparkles className="size-4 text-primary-foreground" />
          </div>
          <h1 className="text-lg font-bold">Automaio</h1>
        </Link>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <NavItem
          href="/dashboard"
          label="Organizations"
          icon={LayoutDashboard}
          active={pathname === '/dashboard'}
        />

        {orgId && (
          <>
            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Workspace
              </p>
            </div>

            <NavItem
              href={`/dashboard/${orgId}`}
              label="Overview"
              icon={LayoutDashboard}
              active={pathname === `/dashboard/${orgId}`}
            />
            <NavItem
              href={`/dashboard/${orgId}/get-started`}
              label="Quick start"
              icon={Rocket}
              active={pathname === `/dashboard/${orgId}/get-started`}
            />
            <NavItem
              href={`/dashboard/${orgId}/templates`}
              label="Templates"
              icon={LayoutTemplate}
              active={isActive(`/dashboard/${orgId}/templates`)}
            />
            <NavItem
              href={`/dashboard/${orgId}/projects`}
              label="Projects & CMS"
              icon={FolderKanban}
              active={isActive(`/dashboard/${orgId}/projects`)}
            />
            <NavItem
              href={`/dashboard/${orgId}/email`}
              label="Email Campaigns"
              icon={Mail}
              active={isActive(`/dashboard/${orgId}/email`)}
            />
            <NavItem
              href={`/dashboard/${orgId}/forms`}
              label="Lead Forms"
              icon={FileInput}
              active={isActive(`/dashboard/${orgId}/forms`)}
            />
            <NavItem
              href={`/dashboard/${orgId}/schedule`}
              label="Schedule"
              icon={CalendarDays}
              active={isActive(`/dashboard/${orgId}/schedule`)}
            />
            <NavItem
              href={`/dashboard/${orgId}/campaigns/new`}
              label="Campaigns"
              icon={Megaphone}
              active={isActive(`/dashboard/${orgId}/campaigns`)}
            />

            {campaignId && (
              <NavItem
                href={`/dashboard/${orgId}/campaigns/${campaignId}`}
                label="Campaign Detail"
                icon={Megaphone}
                active={pathname === `/dashboard/${orgId}/campaigns/${campaignId}`}
              />
            )}

            <div className="pt-4 pb-2 px-4">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Settings
              </p>
            </div>

            <NavItem
              href={`/dashboard/${orgId}/settings`}
              label="Integrations"
              icon={Settings}
              active={pathname === `/dashboard/${orgId}/settings`}
            />
          </>
        )}
      </nav>

      <div className="p-4 border-t">
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout}>
          Logout
        </Button>
      </div>
    </aside>
  )
}
