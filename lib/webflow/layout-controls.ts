import type { LayoutControls } from '@/lib/ai/business-context-types'

/** @deprecated Layout toggles removed — full template is injected as-is. */
export const DEFAULT_LAYOUT_CONTROLS: LayoutControls = {
  hiddenSections: [],
}

/** @deprecated Returns defaults only; layout UI removed. */
export function parseLayoutControls(_params?: unknown): LayoutControls {
  return { ...DEFAULT_LAYOUT_CONTROLS }
}

/** No-op — entire template HTML/CSS is published without header/footer/full-width overrides. */
export function applyLayoutControlsToHtml(html: string, _controls?: LayoutControls): string {
  return html
}
