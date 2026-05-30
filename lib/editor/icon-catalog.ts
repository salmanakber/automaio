/** Curated icon catalog for studio picker (Material Symbols, Lucide, Bootstrap-style). */

export type IconSetId = 'material' | 'lucide' | 'bootstrap'

export type IconCategory =
  | 'all'
  | 'arrows'
  | 'navigation'
  | 'media'
  | 'communication'
  | 'social'
  | 'ui'
  | 'business'
  | 'shapes'

export type IconCatalogEntry = {
  set: IconSetId
  name: string
  label: string
  category: Exclude<IconCategory, 'all'>
  keywords?: string
  /** SVG path `d` for lucide / bootstrap sets */
  path?: string
}

export const ICON_SET_LABELS: Record<IconSetId, string> = {
  material: 'Material',
  lucide: 'Lucide',
  bootstrap: 'Bootstrap',
}

export const ICON_CATEGORY_LABELS: Record<Exclude<IconCategory, 'all'>, string> = {
  arrows: 'Arrows',
  navigation: 'Navigation',
  media: 'Media',
  communication: 'Communication',
  social: 'Social',
  ui: 'UI',
  business: 'Business',
  shapes: 'Shapes',
}

export const DEFAULT_CAROUSEL_PREV = 'lucide:chevron-left'
export const DEFAULT_CAROUSEL_NEXT = 'lucide:chevron-right'

export function formatIconRef(set: IconSetId, name: string): string {
  return `${set}:${name}`
}

export function parseIconRef(ref: string): { set: IconSetId; name: string } {
  const trimmed = (ref || '').trim()
  const idx = trimmed.indexOf(':')
  if (idx <= 0) return { set: 'lucide', name: trimmed || 'chevron-left' }
  const set = trimmed.slice(0, idx) as IconSetId
  const name = trimmed.slice(idx + 1)
  if (set === 'material' || set === 'lucide' || set === 'bootstrap') {
    return { set, name }
  }
  return { set: 'lucide', name: trimmed }
}

/** Lucide-style stroke paths (24×24 viewBox). */
const L = {
  chevronLeft: 'M15 18l-6-6 6-6',
  chevronRight: 'M9 18l6-6-6-6',
  arrowLeft: 'M19 12H5M12 19l-7-7 7-7',
  arrowRight: 'M5 12h14M12 5l7 7-7 7',
  arrowUp: 'M12 19V5M5 12l7-7 7 7',
  arrowDown: 'M12 5v14M19 12l-7 7-7-7',
  chevronsLeft: 'M11 17l-5-5 5-5M18 17l-5-5 5-5',
  chevronsRight: 'M13 17l5-5-5-5M6 17l5-5-5-5',
  play: 'M5 5l14 7-14 7V5z',
  pause: 'M6 4h4v16H6V4zm8 0h4v16h-4V4z',
  star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
  heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
  check: 'M20 6L9 17l-5-5',
  x: 'M18 6L6 18M6 6l12 12',
  plus: 'M12 5v14M5 12h14',
  minus: 'M5 12h14',
  search: 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16zM21 21l-4.35-4.35',
  home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
  user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail: 'M4 4h16v16H4V4zm0 0l8 8 8-8',
  phone: 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z',
  image: 'M19 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM21 15l-5-5L5 21',
  settings: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
  download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3',
  upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12',
  link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
  share: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8M16 6l-4-4-4 4M12 2v13',
  cart: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6zM3 6h18M16 10a4 4 0 0 1-8 0',
  zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
  globe: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z',
  menu: 'M4 6h16M4 12h16M4 18h16',
  circle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
}

export const ICON_CATALOG: IconCatalogEntry[] = [
  // Arrows — Lucide
  { set: 'lucide', name: 'chevron-left', label: 'Chevron left', category: 'arrows', path: L.chevronLeft, keywords: 'prev back' },
  { set: 'lucide', name: 'chevron-right', label: 'Chevron right', category: 'arrows', path: L.chevronRight, keywords: 'next forward' },
  { set: 'lucide', name: 'arrow-left', label: 'Arrow left', category: 'arrows', path: L.arrowLeft },
  { set: 'lucide', name: 'arrow-right', label: 'Arrow right', category: 'arrows', path: L.arrowRight },
  { set: 'lucide', name: 'arrow-up', label: 'Arrow up', category: 'arrows', path: L.arrowUp },
  { set: 'lucide', name: 'arrow-down', label: 'Arrow down', category: 'arrows', path: L.arrowDown },
  { set: 'lucide', name: 'chevrons-left', label: 'Chevrons left', category: 'arrows', path: L.chevronsLeft },
  { set: 'lucide', name: 'chevrons-right', label: 'Chevrons right', category: 'arrows', path: L.chevronsRight },
  // Material arrows
  { set: 'material', name: 'chevron_left', label: 'Chevron left', category: 'arrows', keywords: 'prev' },
  { set: 'material', name: 'chevron_right', label: 'Chevron right', category: 'arrows', keywords: 'next' },
  { set: 'material', name: 'arrow_back', label: 'Arrow back', category: 'arrows' },
  { set: 'material', name: 'arrow_forward', label: 'Arrow forward', category: 'arrows' },
  { set: 'material', name: 'keyboard_arrow_left', label: 'Keyboard arrow left', category: 'arrows' },
  { set: 'material', name: 'keyboard_arrow_right', label: 'Keyboard arrow right', category: 'arrows' },
  { set: 'material', name: 'navigate_before', label: 'Navigate before', category: 'arrows' },
  { set: 'material', name: 'navigate_next', label: 'Navigate next', category: 'arrows' },
  // Navigation
  { set: 'lucide', name: 'home', label: 'Home', category: 'navigation', path: L.home },
  { set: 'lucide', name: 'menu', label: 'Menu', category: 'navigation', path: L.menu },
  { set: 'lucide', name: 'search', label: 'Search', category: 'navigation', path: L.search },
  { set: 'material', name: 'home', label: 'Home', category: 'navigation' },
  { set: 'material', name: 'menu', label: 'Menu', category: 'navigation' },
  { set: 'material', name: 'search', label: 'Search', category: 'navigation' },
  { set: 'material', name: 'close', label: 'Close', category: 'navigation' },
  { set: 'material', name: 'more_horiz', label: 'More', category: 'navigation' },
  // Media
  { set: 'lucide', name: 'play', label: 'Play', category: 'media', path: L.play },
  { set: 'lucide', name: 'pause', label: 'Pause', category: 'media', path: L.pause },
  { set: 'lucide', name: 'image', label: 'Image', category: 'media', path: L.image },
  { set: 'material', name: 'play_arrow', label: 'Play', category: 'media' },
  { set: 'material', name: 'pause', label: 'Pause', category: 'media' },
  { set: 'material', name: 'photo', label: 'Photo', category: 'media' },
  { set: 'material', name: 'videocam', label: 'Video', category: 'media' },
  // Communication
  { set: 'lucide', name: 'mail', label: 'Mail', category: 'communication', path: L.mail },
  { set: 'lucide', name: 'phone', label: 'Phone', category: 'communication', path: L.phone },
  { set: 'material', name: 'mail', label: 'Mail', category: 'communication' },
  { set: 'material', name: 'call', label: 'Call', category: 'communication' },
  { set: 'material', name: 'chat', label: 'Chat', category: 'communication' },
  // Social
  { set: 'material', name: 'share', label: 'Share', category: 'social' },
  { set: 'material', name: 'thumb_up', label: 'Like', category: 'social' },
  { set: 'material', name: 'group', label: 'Group', category: 'social' },
  { set: 'lucide', name: 'share', label: 'Share', category: 'social', path: L.share },
  { set: 'lucide', name: 'heart', label: 'Heart', category: 'social', path: L.heart },
  // UI
  { set: 'lucide', name: 'check', label: 'Check', category: 'ui', path: L.check },
  { set: 'lucide', name: 'x', label: 'Close', category: 'ui', path: L.x },
  { set: 'lucide', name: 'plus', label: 'Plus', category: 'ui', path: L.plus },
  { set: 'lucide', name: 'minus', label: 'Minus', category: 'ui', path: L.minus },
  { set: 'lucide', name: 'settings', label: 'Settings', category: 'ui', path: L.settings },
  { set: 'lucide', name: 'download', label: 'Download', category: 'ui', path: L.download },
  { set: 'lucide', name: 'upload', label: 'Upload', category: 'ui', path: L.upload },
  { set: 'lucide', name: 'link', label: 'Link', category: 'ui', path: L.link },
  { set: 'material', name: 'check', label: 'Check', category: 'ui' },
  { set: 'material', name: 'add', label: 'Add', category: 'ui' },
  { set: 'material', name: 'remove', label: 'Remove', category: 'ui' },
  { set: 'material', name: 'settings', label: 'Settings', category: 'ui' },
  { set: 'material', name: 'download', label: 'Download', category: 'ui' },
  { set: 'material', name: 'upload', label: 'Upload', category: 'ui' },
  { set: 'material', name: 'link', label: 'Link', category: 'ui' },
  { set: 'material', name: 'visibility', label: 'Visibility', category: 'ui' },
  { set: 'material', name: 'edit', label: 'Edit', category: 'ui' },
  { set: 'material', name: 'delete', label: 'Delete', category: 'ui' },
  // Business
  { set: 'lucide', name: 'cart', label: 'Cart', category: 'business', path: L.cart },
  { set: 'lucide', name: 'zap', label: 'Zap', category: 'business', path: L.zap },
  { set: 'lucide', name: 'shield', label: 'Shield', category: 'business', path: L.shield },
  { set: 'lucide', name: 'globe', label: 'Globe', category: 'business', path: L.globe },
  { set: 'lucide', name: 'user', label: 'User', category: 'business', path: L.user },
  { set: 'material', name: 'shopping_cart', label: 'Cart', category: 'business' },
  { set: 'material', name: 'bolt', label: 'Bolt', category: 'business' },
  { set: 'material', name: 'shield', label: 'Shield', category: 'business' },
  { set: 'material', name: 'public', label: 'Globe', category: 'business' },
  { set: 'material', name: 'person', label: 'Person', category: 'business' },
  { set: 'material', name: 'work', label: 'Work', category: 'business' },
  { set: 'material', name: 'storefront', label: 'Store', category: 'business' },
  // Shapes / misc
  { set: 'lucide', name: 'star', label: 'Star', category: 'shapes', path: L.star },
  { set: 'lucide', name: 'circle', label: 'Circle', category: 'shapes', path: L.circle },
  { set: 'material', name: 'star', label: 'Star', category: 'shapes' },
  { set: 'material', name: 'favorite', label: 'Favorite', category: 'shapes' },
  { set: 'material', name: 'lightbulb', label: 'Lightbulb', category: 'shapes' },
  { set: 'material', name: 'rocket_launch', label: 'Rocket', category: 'shapes' },
  { set: 'material', name: 'auto_awesome', label: 'Sparkle', category: 'shapes' },
  { set: 'bootstrap', name: 'star-fill', label: 'Star filled', category: 'shapes', path: 'M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.283.95l-3.976 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z' },
  { set: 'bootstrap', name: 'heart-fill', label: 'Heart filled', category: 'shapes', path: 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z' },
  { set: 'bootstrap', name: 'check-circle-fill', label: 'Check circle', category: 'ui', path: 'M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z' },
]

export function getLucidePathMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of ICON_CATALOG) {
    if (entry.set === 'lucide' && entry.path) map[entry.name] = entry.path
  }
  return map
}

export function getBootstrapPathMap(): Record<string, string> {
  const map: Record<string, string> = {}
  for (const entry of ICON_CATALOG) {
    if (entry.set === 'bootstrap' && entry.path) map[entry.name] = entry.path
  }
  return map
}

export function findIconEntry(ref: string): IconCatalogEntry | undefined {
  const { set, name } = parseIconRef(ref)
  return ICON_CATALOG.find((e) => e.set === set && e.name === name)
}

export function searchIconCatalog(
  query: string,
  setFilter: IconSetId | 'all' = 'all',
  categoryFilter: IconCategory = 'all',
): IconCatalogEntry[] {
  const q = query.trim().toLowerCase()
  return ICON_CATALOG.filter((entry) => {
    if (setFilter !== 'all' && entry.set !== setFilter) return false
    if (categoryFilter !== 'all' && entry.category !== categoryFilter) return false
    if (!q) return true
    const hay = `${entry.label} ${entry.name} ${entry.set} ${entry.keywords ?? ''}`.toLowerCase()
    return hay.includes(q)
  })
}
