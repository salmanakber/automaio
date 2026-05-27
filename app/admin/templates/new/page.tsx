import { redirect } from 'next/navigation'

/**
 * Blank "new template" creation is disabled — use Import HTML for custom markup
 * or duplicate/edit a seeded template from the library.
 */
export default function NewTemplateRedirect() {
  redirect('/admin/templates/import')
}
