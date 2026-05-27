/**
 * Webflow CMS Collection Template embed snippet.
 * Add this to your Collection Template page in Webflow Designer as a single Embed element.
 */
export function buildWebflowCollectionTemplateEmbed(): string {
  return `<!-- Automaio AI Landing Page Renderer -->
<style>
{{wf {"path":"css-content","type":"PlainText"} }}
</style>
<div class="ai-landing-wrapper">
{{wf {"path":"html-content","type":"PlainText"} }}
</div>
<script>
{{wf {"path":"js-content","type":"PlainText"} }}
</script>`
}

export const WEBFLOW_COLLECTION_TEMPLATE_SETUP = [
  'Open your Webflow site → CMS → Landing Pages collection → Collection Template page.',
  'Add an Embed element where the page content should appear.',
  'Paste the Automaio collection template snippet into the Embed.',
  'Bind SEO Title and SEO Description fields to your page SEO settings.',
  'Publish the Webflow site. Each CMS item renders its own HTML/CSS/JS.',
] as const
