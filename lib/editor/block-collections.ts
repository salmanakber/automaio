/** Repeatable item templates for multi-item blocks (FAQ, team, features, etc.). */

export const COLLECTION_WIDGET_TYPES = [
  'faq',
  'team',
  'features',
  'testimonials',
  'pricing',
  'steps',
  'iconBoxes',
  'gallery',
  'logos',
  'stats',
  'counters',
  'tabs',
  'carousel',
] as const

export type CollectionWidgetType = (typeof COLLECTION_WIDGET_TYPES)[number]

export function isCollectionWidget(type: string): type is CollectionWidgetType {
  return (COLLECTION_WIDGET_TYPES as readonly string[]).includes(type)
}

const itemShadow =
  'box-shadow:0 1px 2px rgba(15,23,42,0.04), 0 6px 20px rgba(15,23,42,0.06);'

export function buildCollectionItemHtml(type: CollectionWidgetType): string {
  switch (type) {
    case 'faq':
      return `<details data-am-item style="border:1px solid rgba(15,23,42,0.08);border-radius:14px;padding:16px 18px;background:#fff;${itemShadow}"><summary style="font-weight:600;cursor:pointer;color:#0f172a;">New question?</summary><p style="color:#64748b;font-size:14px;margin:12px 0 0;line-height:1.6;">Answer goes here.</p></details>`
    case 'team':
      return `<div data-am-item style="text-align:center;padding:20px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,0.06);${itemShadow}"><img data-am-team-photo="true" src="https://placehold.co/144x144/e2e8f0/64748b?text=Photo" alt="Team member" style="width:72px;height:72px;border-radius:50%;object-fit:cover;margin:0 auto 12px;display:block;" /><h3 style="margin:0 0 4px;font-size:1rem;color:#0f172a;">Team member</h3><p style="margin:0;color:#64748b;font-size:13px;">Role title</p></div>`
    case 'carousel':
      return `<figure data-am-item style="margin:0;position:relative;"><img src="https://placehold.co/1280x720/e2e8f0/64748b?text=Slide" alt="Slide" style="width:100%;aspect-ratio:16/9;object-fit:cover;display:block;${itemShadow}" /><figcaption style="margin-top:10px;font-size:13px;color:#64748b;text-align:center;">Slide caption</figcaption></figure>`
    case 'features':
      return `<div data-am-item style="padding:28px;border:1px solid rgba(15,23,42,0.06);border-radius:20px;background:#fff;${itemShadow}"><h3 style="margin:0 0 8px;color:#0f172a;">Feature title</h3><p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">Short description.</p></div>`
    case 'testimonials':
      return `<blockquote data-am-item style="padding:28px;border:1px solid rgba(15,23,42,0.06);border-radius:20px;background:#fff;${itemShadow}"><p style="margin:0 0 12px;font-size:15px;line-height:1.65;color:#334155;">&ldquo;Add a customer quote here.&rdquo;</p><footer style="color:#64748b;font-size:13px;font-weight:600;">— Customer name</footer></blockquote>`
    case 'pricing':
      return `<div data-am-item style="padding:32px;border:1px solid rgba(15,23,42,0.08);border-radius:22px;background:#fff;text-align:center;${itemShadow}"><h3 style="margin:0 0 8px;">Plan</h3><p style="font-size:2rem;font-weight:800;margin:0 0 16px;color:#4f46e5;">$49</p><p style="margin:0;color:#64748b;font-size:13px;">Per month</p></div>`
    case 'steps':
      return `<div data-am-item style="text-align:center;padding:16px;"><div style="width:40px;height:40px;border-radius:50%;background:#4f46e5;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:700;margin:0 auto 12px;${itemShadow}">+</div><h3 style="margin:0 0 6px;font-size:1rem;color:#0f172a;">Step title</h3><p style="margin:0;color:#64748b;font-size:13px;">Step description</p></div>`
    case 'iconBoxes':
      return `<div data-am-item style="text-align:center;padding:24px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,0.06);${itemShadow}"><span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="auto_awesome" class="am-icon" style="display:inline-flex;font-family:'Material Symbols Outlined',sans-serif;font-size:2rem;">auto_awesome</span><h3 style="margin:12px 0 6px;font-size:1rem;color:#0f172a;">Title</h3><p style="margin:0;color:#64748b;font-size:13px;">Description</p></div>`
    case 'gallery':
      return `<img data-am-item src="https://placehold.co/400x300/e2e8f0/64748b?text=Image" alt="" style="width:100%;border-radius:14px;${itemShadow}" />`
    case 'logos':
      return `<span data-am-item style="font-weight:700;color:#94a3b8;font-size:15px;padding:12px 20px;border-radius:12px;background:#fff;border:1px solid rgba(15,23,42,0.06);${itemShadow}">Brand</span>`
    case 'stats':
      return `<div data-am-item style="text-align:center;padding:16px;"><p style="font-size:2.5rem;font-weight:800;margin:0;color:#4f46e5;">100+</p><p style="margin:8px 0 0;color:#64748b;font-size:14px;">Metric label</p></div>`
    case 'counters':
      return `<div data-am-item style="text-align:center;"><p style="font-size:2.25rem;font-weight:800;margin:0;color:#7c3aed;">0</p><p style="margin:6px 0 0;font-size:12px;color:#64748b;">Label</p></div>`
    case 'tabs':
      return `<span data-am-item style="padding:8px 16px;border-radius:8px;color:#64748b;font-size:13px;background:#f8fafc;border:1px solid #e2e8f0;">Tab</span>`
    default:
      return `<div data-am-item style="padding:16px;border-radius:12px;background:#fff;${itemShadow}">Item</div>`
  }
}

export function collectionBodyStyle(type: CollectionWidgetType, columns: number): string {
  if (type === 'faq' || columns <= 1) {
    return 'display:flex;flex-direction:column;gap:12px;'
  }
  if (type === 'logos') {
    return `display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:20px;`
  }
  if (type === 'tabs') {
    return 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;border-bottom:1px solid #e2e8f0;padding-bottom:12px;'
  }
  if (type === 'carousel') {
    return 'display:flex;gap:0;'
  }
  return `display:grid;grid-template-columns:repeat(${columns}, minmax(0, 1fr));gap:24px;`
}

export function defaultCollectionColumns(type: CollectionWidgetType): number {
  if (type === 'faq' || type === 'tabs') return 1
  if (type === 'carousel') return 1
  if (type === 'gallery') return 3
  if (type === 'pricing' || type === 'steps') return 2
  return 3
}

export function buildCollectionBody(type: CollectionWidgetType, itemCount = 2, columns?: number): string {
  const cols = columns ?? defaultCollectionColumns(type)
  const count = Math.max(1, itemCount)
  const items = Array.from({ length: count }, () => buildCollectionItemHtml(type)).join('\n    ')
  return `<div data-am-collection-body style="${collectionBodyStyle(type, cols)}" data-am-columns="${cols}">\n    ${items}\n  </div>`
}
