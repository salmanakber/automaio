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
  boxShadow?: string
  transform?: string
  animation?: string
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

export const SHADOW_PRESETS = [
  { label: 'None', value: '' },
  { label: 'Soft', value: '0 2px 8px rgba(0,0,0,0.08)' },
  { label: 'Medium', value: '0 4px 16px rgba(0,0,0,0.12)' },
  { label: 'Strong', value: '0 8px 32px rgba(0,0,0,0.18)' },
  { label: 'Glow', value: '0 0 24px rgba(124,58,237,0.35)' },
] as const

export const ANIMATION_PRESETS = [
  { label: 'None', value: '' },
  { label: 'Fade in', value: 'am-fade-in 0.6s ease both' },
  { label: 'Slide up', value: 'am-slide-up 0.6s ease both' },
  { label: 'Pulse', value: 'am-pulse 2s ease-in-out infinite' },
  { label: 'Bounce', value: 'am-bounce 1.2s ease-in-out infinite' },
] as const

export type TransformValues = {
  rotate: number
  scale: number
  translateX: number
  translateY: number
}

export function buildTransform(values: TransformValues): string {
  const parts: string[] = []
  if (values.translateX || values.translateY) {
    parts.push(`translate(${values.translateX}px, ${values.translateY}px)`)
  }
  if (values.rotate) parts.push(`rotate(${values.rotate}deg)`)
  if (values.scale !== 1) parts.push(`scale(${values.scale})`)
  return parts.join(' ').trim()
}

export function parseTransform(raw?: string): TransformValues {
  const values: TransformValues = { rotate: 0, scale: 1, translateX: 0, translateY: 0 }
  if (!raw?.trim() || raw === 'none') return values

  const rotate = raw.match(/rotate\(([-\d.]+)deg\)/)
  if (rotate) values.rotate = parseFloat(rotate[1]) || 0

  const scale = raw.match(/scale\(([-\d.]+)\)/)
  if (scale) values.scale = parseFloat(scale[1]) || 1

  const translate = raw.match(/translate\(([-\d.]+)px,\s*([-\d.]+)px\)/)
  if (translate) {
    values.translateX = parseFloat(translate[1]) || 0
    values.translateY = parseFloat(translate[2]) || 0
  }

  return values
}

export type ShadowValues = {
  x: number
  y: number
  blur: number
  spread: number
  color: string
}

export function buildBoxShadow(values: ShadowValues): string {
  if (!values.blur && !values.x && !values.y && !values.spread) return ''
  const color = values.color || 'rgba(0,0,0,0.15)'
  return `${values.x}px ${values.y}px ${values.blur}px ${values.spread}px ${color}`
}

export function parseBoxShadow(raw?: string): ShadowValues {
  const empty: ShadowValues = { x: 0, y: 4, blur: 12, spread: 0, color: 'rgba(0,0,0,0.12)' }
  if (!raw?.trim() || raw === 'none') return { ...empty, y: 0, blur: 0 }

  const rgba = raw.match(/rgba?\([^)]+\)/)?.[0]
  const hex = raw.match(/#[0-9a-f]{3,8}/i)?.[0]
  const color = rgba || hex || empty.color
  const nums = raw
    .replace(rgba ?? '', '')
    .replace(hex ?? '', '')
    .match(/-?\d+(\.\d+)?/g)
    ?.map(Number)

  return {
    x: nums?.[0] ?? 0,
    y: nums?.[1] ?? 4,
    blur: nums?.[2] ?? 12,
    spread: nums?.[3] ?? 0,
    color,
  }
}
