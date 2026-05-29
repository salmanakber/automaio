/** How users open Automaio inside Webflow Designer (for render embed auto-install). */

export const WEBFLOW_DESIGNER_OPEN_STEPS = [
  'Open your site in Webflow → click Open in Designer (top right).',
  'In Designer, open the left Apps panel (puzzle icon) → select Automaio.',
  'Go to Pages → CMS Collection pages → open your landing pages template.',
  'The Automaio panel installs the SEO render embed automatically (one time).',
  'Turn ON Publish settings for that template, then publish the site in Webflow.',
] as const

export function buildDesignerSetupMessage(needsRenderEmbedInstall: boolean): string {
  if (!needsRenderEmbedInstall) return ''
  return (
    'Direct HTML mode: open Webflow Designer once with the Automaio app on your CMS collection template. ' +
    'The render embed installs automatically — no copy/paste. After that, only CMS fields update on publish.'
  )
}
