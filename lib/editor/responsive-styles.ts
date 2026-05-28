/** Breakpoints used for tablet/mobile overrides saved in page HTML. */
export type EditViewport = 'desktop' | 'tablet' | 'mobile'

export const VIEWPORT_BREAKPOINTS: Record<EditViewport, number | null> = {
  desktop: null,
  tablet: 991,
  mobile: 767,
}

export type ElementStyles = {
  backgroundColor?: string
  color?: string
  borderColor?: string
  borderRadius?: string
}

export type StyleTarget = {
  id: string
  tag: string
  label: string
  styles: ElementStyles
}

export const STYLE_PRESETS = [
  '#ffffff',
  '#f8fafc',
  '#0f172a',
  '#4f46e5',
  '#7c3aed',
  '#059669',
  '#dc2626',
  '#f59e0b',
  '#64748b',
  '#e2e8f0',
] as const
