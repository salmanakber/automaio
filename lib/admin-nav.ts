import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  BarChart3,
  Bot,
  Brain,
  CreditCard,
  FileText,
  FlaskConical,
  FolderOpen,
  LayoutDashboard,
  LineChart,
  ListTodo,
  Lock,
  Megaphone,
  Plug,
  Settings,
  Shield,
  Sparkles,
  Store,
  TrendingUp,
  Users,
  Webhook,
  Workflow,
  Zap,
} from 'lucide-react'

export type AdminNavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
}

export type AdminNavGroup = {
  label: string
  items: AdminNavItem[]
}

export const adminNavGroups: AdminNavGroup[] = [
  {
    label: 'Overview',
    items: [
      { title: 'Dashboard', href: '/admin', icon: LayoutDashboard },
      { title: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'AI & Content',
    items: [
      { title: 'AI Engine', href: '/admin/ai-engine', icon: Bot, badge: 'Ops' },
      { title: 'AI Config', href: '/admin/ai-config', icon: Settings, badge: 'Setup' },
      { title: 'Prompts & Templates', href: '/admin/prompts', icon: FileText },
      { title: 'Prompt Intelligence', href: '/admin/prompt-intelligence', icon: Sparkles },
      { title: 'Template Intelligence', href: '/admin/template-intelligence', icon: Brain },
    ],
  },
  {
    label: 'Campaigns',
    items: [
      { title: 'Campaign Monitor', href: '/admin/campaigns', icon: Megaphone },
      { title: 'Campaign Intelligence', href: '/admin/campaign-intelligence', icon: LineChart },
      { title: 'Scheduling', href: '/admin/scheduling', icon: ListTodo },
      { title: 'Queue Management', href: '/admin/queue-management', icon: Workflow, badge: 'Jobs' },
      { title: 'Simulations', href: '/admin/simulations', icon: FlaskConical },
    ],
  },
  {
    label: 'Intelligence',
    items: [
      { title: 'Revenue Intelligence', href: '/admin/revenue-intelligence', icon: TrendingUp },
      { title: 'AI Cost Optimization', href: '/admin/ai-cost-optimization', icon: Zap },
      { title: 'Trend Intelligence', href: '/admin/trends', icon: Activity },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { title: 'Webflow Bridge', href: '/admin/webflow-bridge', icon: Plug },
      { title: 'Asset Library', href: '/admin/assets', icon: FolderOpen },
      { title: 'Automation Rules', href: '/admin/automation', icon: Webhook },
    ],
  },
  {
    label: 'Users & Growth',
    items: [
      { title: 'Users & Clients', href: '/admin/users', icon: Users },
      { title: 'Campaign Templates', href: '/admin/templates', icon: FileText },
      { title: 'Template Marketplace', href: '/admin/marketplace', icon: Store },
      { title: 'Growth Lab', href: '/admin/growth-lab', icon: FlaskConical },
    ],
  },
  {
    label: 'System',
    items: [
      { title: 'System Config', href: '/admin/system-config', icon: Settings },
      { title: 'Billing', href: '/admin/billing', icon: CreditCard },
      { title: 'Security & Access', href: '/admin/security', icon: Shield },
      { title: 'Compliance', href: '/admin/compliance', icon: Lock },
      { title: 'Logs & Debugging', href: '/admin/logs', icon: FileText },
    ],
  },
]

export function getAdminPageTitle(pathname: string): string {
  if (pathname === '/admin') return 'Dashboard'

  for (const group of adminNavGroups) {
    const item = group.items.find((entry) => entry.href === pathname)
    if (item) return item.title
  }

  const segment = pathname.split('/').filter(Boolean).pop()
  if (!segment) return 'Admin'
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
