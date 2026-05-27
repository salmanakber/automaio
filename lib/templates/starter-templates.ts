import type { TemplateTheme } from '@/lib/templates/theme'

export type TemplateStructure = {
  /** Source HTML — always uses {{placeholder}} tokens for dynamic fields. */
  html: string
  placeholders: string[]
  category: 'landing' | 'email' | 'promo'
  status: 'draft' | 'published'
  previewDescription?: string
  /** Sample copy for previews only (picker, admin). Not sent to Webflow as-is. */
  previewSample?: Record<string, string>
  /** Brand colors — injected into HTML for Webflow CMS (CSS variables). */
  theme?: TemplateTheme
}

export type StarterTemplate = {
  name: string
  industry: string
  description: string
  bestPractices: string[]
  templateStructure: TemplateStructure
}

const baseStyles = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: system-ui, -apple-system, sans-serif; color: var(--automaio-text, #0f172a); background: var(--automaio-bg, #fff); line-height: 1.6; }
  .wrap { max-width: 960px; margin: 0 auto; padding: 48px 24px; }
  .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--automaio-badge-bg, #e0e7ff); color: var(--automaio-badge-text, #3730a3); }
  h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; margin: 16px 0; }
  p.lead { font-size: 1.125rem; color: var(--automaio-muted, #475569); max-width: 52ch; }
  .cta { display: inline-block; margin-top: 24px; padding: 14px 28px; background: var(--automaio-primary, #0f172a); color: var(--automaio-primary-text, #fff); text-decoration: none; border-radius: 10px; font-weight: 600; }
  .grid { display: grid; gap: 20px; margin-top: 40px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .card { border: 1px solid var(--automaio-border, #e2e8f0); border-radius: 14px; padding: 20px; background: var(--automaio-bg, #fff); }
  .card h3 { font-size: 1rem; margin-bottom: 8px; }
  .card p { font-size: 0.9rem; color: var(--automaio-muted, #64748b); }
  footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--automaio-border, #e2e8f0); font-size: 0.85rem; color: var(--automaio-muted, #94a3b8); }
`

function shell(title: string, badge: string, body: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>${baseStyles}</style>
</head>
<body>
  <div class="wrap">
    <span class="badge">${badge}</span>
    ${body}
    <footer>© {{year}} {{company_name}} · Powered by Automaio</footer>
  </div>
</body>
</html>`
}

export const STARTER_TEMPLATES: StarterTemplate[] = [
  {
    name: 'SaaS Product Launch',
    industry: 'SaaS',
    description: 'Clean landing page for B2B software launches with hero, features, and CTA.',
    bestPractices: ['Lead with outcome', 'Single primary CTA', 'Social proof near fold'],
    templateStructure: {
      category: 'landing',
      status: 'published',
      placeholders: ['{{company_name}}', '{{headline}}', '{{subheadline}}', '{{cta_text}}', '{{year}}'],
      html: shell(
        '{{headline}}',
        'SaaS',
        `<h1>{{headline}}</h1>
    <p class="lead">{{subheadline}}</p>
    <a class="cta" href="#">{{cta_text}}</a>
    <div class="grid">
      <div class="card"><h3>Ship faster</h3><p>Launch campaigns in minutes, not weeks.</p></div>
      <div class="card"><h3>Webflow ready</h3><p>Export and publish to your Webflow site.</p></div>
      <div class="card"><h3>AI powered</h3><p>Generate copy tuned to your audience.</p></div>
    </div>`,
      ),
    },
  },
  {
    name: 'E-commerce Sale',
    industry: 'E-commerce',
    description: 'Prodival layout for seasonal sales and product highlights.',
    bestPractices: ['Urgency in headline', 'Clear discount', 'Mobile-first layout'],
    templateStructure: {
      category: 'promo',
      status: 'published',
      placeholders: ['{{company_name}}', '{{headline}}', '{{offer}}', '{{cta_text}}', '{{year}}'],
      html: shell(
        '{{headline}}',
        'Sale',
        `<h1>{{headline}}</h1>
    <p class="lead">{{offer}}</p>
    <a class="cta" href="#">{{cta_text}}</a>
    <div class="grid">
      <div class="card"><h3>Free shipping</h3><p>On orders over $50 this week.</p></div>
      <div class="card"><h3>Best sellers</h3><p>Curated picks from {{company_name}}.</p></div>
    </div>`,
      ),
    },
  },
  {
    name: 'Agency Services',
    industry: 'Agency',
    description: 'Professional services page for creative and marketing agencies.',
    bestPractices: ['Show expertise', 'Case-study hooks', 'Book-a-call CTA'],
    templateStructure: {
      category: 'landing',
      status: 'published',
      placeholders: ['{{company_name}}', '{{headline}}', '{{subheadline}}', '{{cta_text}}', '{{year}}'],
      html: shell(
        '{{headline}}',
        'Agency',
        `<h1>{{headline}}</h1>
    <p class="lead">{{subheadline}}</p>
    <a class="cta" href="#">{{cta_text}}</a>
    <div class="grid">
      <div class="card"><h3>Strategy</h3><p>Position your brand for measurable growth.</p></div>
      <div class="card"><h3>Creative</h3><p>Campaigns designed for Webflow delivery.</p></div>
      <div class="card"><h3>Automation</h3><p>Schedule and optimize with Automaio.</p></div>
    </div>`,
      ),
    },
  },
  {
    name: 'Local Business',
    industry: 'Local',
    description: 'Friendly layout for restaurants, salons, and local shops.',
    bestPractices: ['Location visible', 'Hours & contact', 'Warm tone'],
    templateStructure: {
      category: 'landing',
      status: 'published',
      placeholders: ['{{company_name}}', '{{headline}}', '{{location}}', '{{cta_text}}', '{{year}}'],
      html: shell(
        '{{headline}}',
        'Local',
        `<h1>{{headline}}</h1>
    <p class="lead">Visit us at {{location}}</p>
    <a class="cta" href="#">{{cta_text}}</a>`,
      ),
    },
  },
  {
    name: 'Healthcare Trust',
    industry: 'Healthcare',
    description: 'Calm, accessible template for clinics and wellness brands.',
    bestPractices: ['Compliance-friendly tone', 'Clear disclaimers', 'Accessible contrast'],
    templateStructure: {
      category: 'landing',
      status: 'published',
      placeholders: ['{{company_name}}', '{{headline}}', '{{subheadline}}', '{{cta_text}}', '{{year}}'],
      html: shell(
        '{{headline}}',
        'Healthcare',
        `<h1>{{headline}}</h1>
    <p class="lead">{{subheadline}}</p>
    <a class="cta" href="#">{{cta_text}}</a>
    <p style="margin-top:24px;font-size:0.85rem;color:#64748b;">This content is informational. Consult a professional for medical advice.</p>`,
      ),
    },
  },
]
