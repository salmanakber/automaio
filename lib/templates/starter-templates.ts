import type { TemplateTheme } from '@/lib/templates/theme'

export type TemplateStructure = {
  /** Section markup only — no html/head/body wrappers. Uses {{placeholder}} tokens. */
  html: string
  placeholders: string[]
  category: 'landing' | 'email' | 'promo'
  status: 'draft' | 'published'
  previewDescription?: string
  previewSample?: Record<string, string>
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
  .ai-landing-wrap { max-width: 960px; margin: 0 auto; padding: 48px 24px; font-family: system-ui, -apple-system, sans-serif; color: var(--automaio-text, #0f172a); background: var(--automaio-bg, #fff); line-height: 1.6; box-sizing: border-box; }
  .ai-landing-wrap *, .ai-landing-wrap *::before, .ai-landing-wrap *::after { box-sizing: border-box; }
  .ai-landing-wrap .badge { display: inline-block; padding: 6px 12px; border-radius: 999px; font-size: 12px; font-weight: 600; background: var(--automaio-badge-bg, #e0e7ff); color: var(--automaio-badge-text, #3730a3); }
  .ai-landing-wrap h1 { font-size: clamp(2rem, 5vw, 3rem); line-height: 1.1; margin: 16px 0; }
  .ai-landing-wrap p.lead { font-size: 1.125rem; color: var(--automaio-muted, #475569); max-width: 52ch; }
  .ai-landing-wrap .cta { display: inline-block; margin-top: 24px; padding: 14px 28px; background: var(--automaio-primary, #0f172a); color: var(--automaio-primary-text, #fff); text-decoration: none; border-radius: 10px; font-weight: 600; }
  .ai-landing-wrap .grid { display: grid; gap: 20px; margin-top: 40px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
  .ai-landing-wrap .card { border: 1px solid var(--automaio-border, #e2e8f0); border-radius: 14px; padding: 20px; background: var(--automaio-bg, #fff); }
  .ai-landing-wrap .card h3 { font-size: 1rem; margin-bottom: 8px; }
  .ai-landing-wrap .card p { font-size: 0.9rem; color: var(--automaio-muted, #64748b); }
  .ai-landing-wrap .ai-footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid var(--automaio-border, #e2e8f0); font-size: 0.85rem; color: var(--automaio-muted, #94a3b8); }
`

/** Section-only landing template — CSS in style block, no document wrapper. Scoped at publish time. */
function sectionTemplate(badge: string, body: string): string {
  return `<style>${baseStyles}</style>
<section class="ai-landing-wrap">
  <span class="badge" data-ai-field="hero.badge">${badge}</span>
  ${body}
  <footer class="ai-footer" data-ai-field="footer.copyright">© {{year}} {{company_name}} · Powered by Automaio</footer>
</section>`
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
      html: sectionTemplate(
        'SaaS',
        `<h1 data-ai-field="hero.title">{{headline}}</h1>
    <p class="lead" data-ai-field="hero.description">{{subheadline}}</p>
    <a class="cta" href="#contact" data-ai-field="cta.primary">{{cta_text}}</a>
    <div class="grid">
      <div class="card"><h3 data-ai-field="features.1.title">Ship faster</h3><p data-ai-field="features.1.description">Launch campaigns in minutes, not weeks.</p></div>
      <div class="card"><h3 data-ai-field="features.2.title">Webflow ready</h3><p data-ai-field="features.2.description">Export and publish to your Webflow site.</p></div>
      <div class="card"><h3 data-ai-field="features.3.title">AI powered</h3><p data-ai-field="features.3.description">Generate copy tuned to your audience.</p></div>
    </div>`,
      ),
    },
  },
  {
    name: 'E-commerce Sale',
    industry: 'E-commerce',
    description: 'Promotional layout for seasonal sales and product highlights.',
    bestPractices: ['Urgency in headline', 'Clear discount', 'Mobile-first layout'],
    templateStructure: {
      category: 'promo',
      status: 'published',
      placeholders: ['{{company_name}}', '{{headline}}', '{{offer}}', '{{cta_text}}', '{{year}}'],
      html: sectionTemplate(
        'Sale',
        `<h1 data-ai-field="hero.title">{{headline}}</h1>
    <p class="lead" data-ai-field="hero.description">{{offer}}</p>
    <a class="cta" href="#shop" data-ai-field="cta.primary">{{cta_text}}</a>
    <div class="grid">
      <div class="card"><h3 data-ai-field="features.1.title">Free shipping</h3><p data-ai-field="features.1.description">On orders over $50 this week.</p></div>
      <div class="card"><h3 data-ai-field="features.2.title">Best sellers</h3><p data-ai-field="features.2.description">Curated picks from {{company_name}}.</p></div>
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
      html: sectionTemplate(
        'Agency',
        `<h1 data-ai-field="hero.title">{{headline}}</h1>
    <p class="lead" data-ai-field="hero.description">{{subheadline}}</p>
    <a class="cta" href="#contact" data-ai-field="cta.primary">{{cta_text}}</a>
    <div class="grid">
      <div class="card"><h3 data-ai-field="features.1.title">Strategy</h3><p data-ai-field="features.1.description">Position your brand for measurable growth.</p></div>
      <div class="card"><h3 data-ai-field="features.2.title">Creative</h3><p data-ai-field="features.2.description">Campaigns designed for Webflow delivery.</p></div>
      <div class="card"><h3 data-ai-field="features.3.title">Automation</h3><p data-ai-field="features.3.description">Schedule and optimize with Automaio.</p></div>
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
      html: sectionTemplate(
        'Local',
        `<h1 data-ai-field="hero.title">{{headline}}</h1>
    <p class="lead" data-ai-field="hero.description">Visit us at {{location}}</p>
    <a class="cta" href="#contact" data-ai-field="cta.primary">{{cta_text}}</a>`,
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
      html: sectionTemplate(
        'Healthcare',
        `<h1 data-ai-field="hero.title">{{headline}}</h1>
    <p class="lead" data-ai-field="hero.description">{{subheadline}}</p>
    <a class="cta" href="#contact" data-ai-field="cta.primary">{{cta_text}}</a>
    <p class="disclaimer" style="margin-top:24px;font-size:0.85rem;color:#64748b;" data-ai-field="content.disclaimer">This content is informational. Consult a professional for medical advice.</p>`,
      ),
    },
  },
]
