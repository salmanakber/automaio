import type { TemplateStructure } from '@/lib/templates/starter-templates'

export type TemplateTheme = {
  primary: string
  primaryText: string
  accent: string
  accentText: string
  background: string
  text: string
  muted: string
  border: string
  badgeBackground: string
  badgeText: string
}

export const DEFAULT_TEMPLATE_THEME: TemplateTheme = {
  primary: '#0f172a',
  primaryText: '#ffffff',
  accent: '#4f46e5',
  accentText: '#ffffff',
  background: '#ffffff',
  text: '#0f172a',
  muted: '#64748b',
  border: '#e2e8f0',
  badgeBackground: '#e0e7ff',
  badgeText: '#3730a3',
}

const THEME_STYLE_ID = 'automaio-template-theme'

export function buildThemeCss(theme: TemplateTheme = DEFAULT_TEMPLATE_THEME): string {
  return `
.ai-landing-wrap,
.ai-landing-wrapper,
.ai-template-scope {
  --automaio-primary: ${theme.primary};
  --automaio-primary-text: ${theme.primaryText};
  --automaio-accent: ${theme.accent};
  --automaio-accent-text: ${theme.accentText};
  --automaio-bg: ${theme.background};
  --automaio-text: ${theme.text};
  --automaio-muted: ${theme.muted};
  --automaio-border: ${theme.border};
  --automaio-badge-bg: ${theme.badgeBackground};
  --automaio-badge-text: ${theme.badgeText};
}
.ai-landing-wrap,
.ai-landing-wrapper {
  color: var(--automaio-text);
  background: var(--automaio-bg);
}
.ai-landing-wrap .badge,
.ai-landing-wrapper .badge {
  background: var(--automaio-badge-bg) !important;
  color: var(--automaio-badge-text) !important;
}
.ai-landing-wrap p.lead,
.ai-landing-wrapper p.lead { color: var(--automaio-muted) !important; }
.ai-landing-wrap .cta,
.ai-landing-wrapper .cta {
  background: var(--automaio-primary) !important;
  color: var(--automaio-primary-text) !important;
}
.ai-landing-wrap .card,
.ai-landing-wrapper .card {
  border-color: var(--automaio-border) !important;
  background: var(--automaio-bg) !important;
}
.ai-landing-wrap .card p,
.ai-landing-wrapper .card p { color: var(--automaio-muted) !important; }
.ai-landing-wrap .ai-footer,
.ai-landing-wrapper .ai-footer,
.ai-landing-wrap footer,
.ai-landing-wrapper footer {
  border-color: var(--automaio-border) !important;
  color: var(--automaio-muted) !important;
}
.ai-landing-wrap a.cta:hover,
.ai-landing-wrapper a.cta:hover { opacity: 0.92; }
`.trim()
}

/** Injects theme CSS into HTML sent to Webflow CMS and previews. */
export function applyThemeToHtml(
  html: string,
  theme?: TemplateTheme | null,
): string {
  if (!html.trim()) return html
  const resolved = theme ?? DEFAULT_TEMPLATE_THEME
  const block = `<style id="${THEME_STYLE_ID}">\n${buildThemeCss(resolved)}\n</style>`

  const existing = new RegExp(
    `<style[^>]*id=["']${THEME_STYLE_ID}["'][^>]*>[\\s\\S]*?</style>`,
    'i',
  )
  if (existing.test(html)) {
    return html.replace(existing, block)
  }

  if (/<\/head>/i.test(html)) {
    return html.replace(/<\/head>/i, `${block}\n</head>`)
  }
  if (/<body[^>]*>/i.test(html)) {
    return html.replace(/<body[^>]*>/i, (match) => `${match}\n${block}`)
  }
  return `${block}\n${html}`
}

export function resolveTemplateTheme(
  structure?: Pick<TemplateStructure, 'theme'> | null,
): TemplateTheme {
  return { ...DEFAULT_TEMPLATE_THEME, ...(structure?.theme ?? {}) }
}
