/** Widget types and catalog — delegates HTML to elementor-blocks. */
import {
  buildElementorBlock,
  buildWidgetHtml as buildBlockHtml,
  BLOCK_CATEGORIES,
  type ElementorBlockType,
} from '@/lib/editor/elementor-blocks'

export type EditorWidgetType = ElementorBlockType

export type EditorWidget = {
  type: EditorWidgetType
  label: string
  category: keyof typeof BLOCK_CATEGORIES
}

export const EDITOR_WIDGETS: EditorWidget[] = Object.entries(BLOCK_CATEGORIES).flatMap(
  ([category, items]) =>
    items.map((item) => ({
      type: item.type as EditorWidgetType,
      label: item.label,
      category: category as keyof typeof BLOCK_CATEGORIES,
    })),
)

export const EDITOR_CATEGORY_LABELS: Record<keyof typeof BLOCK_CATEGORIES, string> = {
  structure: 'Structure',
  basic: 'Basic',
  media: 'Media',
  blocks: 'Blocks',
}

export function buildWidgetHtml(type: EditorWidgetType | string): string {
  return buildBlockHtml(type)
}

export { buildElementorBlock, BLOCK_CATEGORIES }
