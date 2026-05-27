import type { LayoutControls } from '@/lib/ai/business-context-types'

export const DEFAULT_LAYOUT_CONTROLS: LayoutControls = {
  showHeader: false,
  showFooter: false,
  fullWidth: true,
  removeContainerConstraints: true,
  landingPageFocusMode: true,
  cleanEmbedMode: true,
  hiddenSections: [],
}

export function parseLayoutControls(params: unknown): LayoutControls {
  if (!params || typeof params !== 'object') return { ...DEFAULT_LAYOUT_CONTROLS }

  const raw = params as Record<string, unknown>
  const stored = raw.layoutControls as LayoutControls | undefined

  if (stored && typeof stored === 'object') {
    return { ...DEFAULT_LAYOUT_CONTROLS, ...stored }
  }

  return {
    showHeader: raw.showHeader === 'true' || raw.showHeader === true,
    showFooter: raw.showFooter === 'true' || raw.showFooter === true,
    fullWidth: raw.fullWidth !== 'false' && raw.fullWidth !== false,
    removeContainerConstraints: raw.removeContainerConstraints !== 'false',
    landingPageFocusMode: raw.landingPageFocusMode !== 'false',
    cleanEmbedMode: raw.cleanEmbedMode !== 'false',
    hiddenSections: [],
  }
}

export function layoutControlsToCss(controls: LayoutControls): string {
  const rules: string[] = []

  if (!controls.showHeader) {
    rules.push('nav, header { display: none !important; }')
  }
  if (!controls.showFooter) {
    rules.push('footer { display: none !important; }')
  }
  if (controls.fullWidth || controls.removeContainerConstraints) {
    rules.push(
      '.wrap, .container, .w-container, [class*="container"] { max-width: 100% !important; width: 100% !important; padding-left: 0 !important; padding-right: 0 !important; }',
    )
  }
  if (controls.landingPageFocusMode) {
    rules.push('body { margin: 0; padding: 0; }')
  }
  if (controls.hiddenSections?.length) {
    for (const sel of controls.hiddenSections) {
      if (/^[a-z0-9#.\-_[\]()]+$/i.test(sel)) {
        rules.push(`${sel} { display: none !important; }`)
      }
    }
  }

  return rules.join('\n')
}

export function applyLayoutControlsToHtml(html: string, controls: LayoutControls): string {
  const css = layoutControlsToCss(controls)
  if (!css.trim()) return html

  const styleBlock = `<style data-automaio-layout>${css}</style>`

  if (/<head[\s>]/i.test(html)) {
    return html.replace(/<head([^>]*)>/i, `<head$1>${styleBlock}`)
  }

  return `${styleBlock}${html}`
}
