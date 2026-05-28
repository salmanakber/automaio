import {
  buildCollectionBody,
  buildCollectionItemHtml,
  type CollectionWidgetType,
} from '@/lib/editor/block-collections'

/** Elementor-style block HTML — class prefix `am-elt-block` for polished defaults. */
const S = {
  section:
    'padding:80px 24px; max-width:1200px; margin:0 auto; font-family: system-ui, -apple-system, sans-serif;',
  h1: 'font-size:clamp(2.5rem, 6vw, 4rem); font-weight:850; line-height:1.05; margin:0 0 20px; letter-spacing:-0.04em; color:#0f172a;',
  h2: 'font-size:clamp(1.75rem, 4vw, 2.5rem); font-weight:800; line-height:1.2; margin:0 0 16px; letter-spacing:-0.02em; color:#0f172a;',
  lead: 'font-size:1.25rem; line-height:1.6; color:#475569; margin:0 0 32px; max-width:60ch;',
  btn: 'display:inline-flex; align-items:center; justify-content:center; padding:14px 32px; background:#6366f1; color:#ffffff; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px; box-shadow:0 4px 14px rgba(99,102,241,0.35); transition: all 0.2s;',
  btnOutline:
    'display:inline-flex; padding:14px 32px; background:#ffffff; color:#0f172a; text-decoration:none; border-radius:12px; font-weight:600; border:1px solid rgba(15,23,42,0.1); box-shadow:0 1px 2px rgba(15,23,42,0.05), 0 4px 12px rgba(15,23,42,0.04);',
  card: 'padding:32px; border:1px solid rgba(15,23,42,0.06); border-radius:22px; background:#ffffff; box-shadow:0 1px 2px rgba(15,23,42,0.04), 0 10px 28px rgba(15,23,42,0.07);',
  panel:
    'border-radius:20px; background:#ffffff; border:1px solid rgba(15,23,42,0.06); box-shadow:0 2px 4px rgba(15,23,42,0.03), 0 12px 32px rgba(15,23,42,0.08);',
}

function collectionBlock(
  type: CollectionWidgetType,
  title: string,
  subtitle?: string,
  itemCount = 2,
  columns?: number,
): string {
  const b = `data-am-block="true" data-am-widget="${type}" data-am-collection="${type}" class="am-elt-block"`
  const sub = subtitle
    ? `<p style="text-align:center;color:#64748b;margin:-24px auto 40px;max-width:52ch;font-size:15px;line-height:1.6;">${subtitle}</p>`
    : ''
  return `<section ${b} style="${S.section}">
  <h2 style="${S.h2}text-align:center;margin-bottom:12px;">${title}</h2>
  ${sub}
  ${buildCollectionBody(type, itemCount, columns)}
</section>`
}

export type ElementorBlockType =
  | 'header'
  | 'footer'
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'section'
  | 'columns2'
  | 'columns3'
  | 'columns'
  | 'list'
  | 'quote'
  | 'video'
  | 'icon'
  | 'badge'
  | 'card'
  | 'hero'
  | 'cta'
  | 'testimonials'
  | 'pricing'
  | 'faq'
  | 'features'
  | 'stats'
  | 'team'
  | 'logos'
  | 'newsletter'
  | 'contact'
  | 'gallery'
  | 'timeline'
  | 'banner'
  | 'heroSplit'
  | 'iconBoxes'
  | 'socialProof'
  | 'comparison'
  | 'callout'
  | 'videoHero'
  | 'counters'
  | 'tabs'
  | 'map'
  | 'dividerWave'
  | 'steps'
  | 'leadForm'

export function buildElementorBlock(type: ElementorBlockType): string {
  const b = 'data-am-block="true" data-am-widget="' + type + '" class="am-elt-block"'
  switch (type) {
    case 'header':
      return `<header ${b} data-am-section="header" style="padding:16px 24px;border-bottom:1px solid #e2e8f0;background:#fff;">
  <div style="max-width:1200px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap;">
    <a href="#" style="font-weight:800;font-size:1.25rem;color:#0f172a;text-decoration:none;">Your Brand</a>
    <nav style="display:flex;gap:24px;align-items:center;flex-wrap:wrap;">
      <a href="#" style="color:#475569;text-decoration:none;font-size:14px;font-weight:500;">Features</a>
      <a href="#" style="color:#475569;text-decoration:none;font-size:14px;font-weight:500;">Pricing</a>
      <a href="#" style="${S.btn}padding:10px 20px;font-size:14px;">Get started</a>
    </nav>
  </div>
</header>`
    case 'footer':
      return `<footer ${b} data-am-section="footer" style="padding:48px 24px;background:#0f172a;color:#94a3b8;">
  <div style="max-width:1200px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px;">
    <div><p style="color:#fff;font-weight:700;margin:0 0 12px;">Your Brand</p><p style="font-size:14px;margin:0;">Build beautiful pages with Automaio.</p></div>
    <div><p style="color:#fff;font-weight:600;margin:0 0 12px;font-size:14px;">Links</p><p style="margin:0;font-size:14px;"><a href="#" style="color:#94a3b8;text-decoration:none;">Privacy</a></p></div>
  </div>
  <p style="text-align:center;margin:32px 0 0;padding-top:24px;border-top:1px solid #1e293b;font-size:13px;">© 2025 Your Company</p>
</footer>`
    case 'hero':
      return `<section ${b} style="${S.section}text-align:center;padding-top:96px;padding-bottom:96px;">
  <span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#eef2ff;color:#4338ca;margin-bottom:20px;">Featured</span>
  <h1 style="${S.h1}">Build landing pages that convert</h1>
  <p style="${S.lead}margin-left:auto;margin-right:auto;">Create, personalize, and publish to Webflow in minutes.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><a href="#" style="${S.btn}">Start free</a><a href="#" style="${S.btnOutline}">Demo</a></div>
</section>`
    case 'features':
      return collectionBlock('features', 'Features', 'Everything you need to launch faster.', 3, 3)
    case 'stats': {
      const inner = buildCollectionBody('stats', 3, 3)
      return `<section ${b} data-am-collection="stats" style="${S.section}background:linear-gradient(180deg,#f8fafc 0%,#fff 100%);">
  ${inner}
</section>`
    }
    case 'columns2':
    case 'columns':
      return `<div ${b} data-am-layout="2col" style="display:grid;grid-template-columns:1fr 1fr;gap:32px;${S.section}">
  <div data-am-column="1" data-am-drop-zone="true"><h3 style="${S.h2}">Column 1</h3><p style="color:#64748b;">Drop blocks here</p></div>
  <div data-am-column="2" data-am-drop-zone="true"><h3 style="${S.h2}">Column 2</h3><p style="color:#64748b;">Drop blocks here</p></div>
</div>`
    case 'columns3':
      return `<div ${b} data-am-layout="3col" style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;${S.section}">
  <div data-am-column="1" data-am-drop-zone="true"><p style="color:#64748b;">Column 1</p></div>
  <div data-am-column="2" data-am-drop-zone="true"><p style="color:#64748b;">Column 2</p></div>
  <div data-am-column="3" data-am-drop-zone="true"><p style="color:#64748b;">Column 3</p></div>
</div>`
    case 'team':
      return collectionBlock('team', 'Our team', 'Meet the people behind the product.', 3, 3)
    case 'newsletter':
      return `<section ${b} style="${S.section}text-align:center;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;border-radius:16px;">
  <h2 style="margin:0 0 12px;font-size:1.75rem;">Newsletter</h2>
  <p style="margin:0 0 20px;opacity:0.9;">Stay updated.</p>
  <a href="#" style="${S.btn}background:#fff;color:#4f46e5;">Subscribe</a>
</section>`
    case 'contact':
      return `<section ${b} style="${S.section}"><h2 style="${S.h2}text-align:center;">Contact</h2>
  <div style="max-width:400px;margin:0 auto;"><input placeholder="Email" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;" readonly /><button style="${S.btn}width:100%;">Send</button></div></section>`
    case 'gallery':
      return collectionBlock('gallery', 'Gallery', undefined, 3, 3)
    case 'logos':
      return `<section ${b} data-am-collection="logos" style="padding:56px 24px;text-align:center;${S.panel}margin:0 auto;max-width:1200px;">
  <p style="font-size:12px;color:#94a3b8;margin:0 0 24px;letter-spacing:0.08em;font-weight:600;">TRUSTED BY</p>
  ${buildCollectionBody('logos', 4, 1)}
</section>`
    case 'banner':
      return `<div ${b} style="padding:12px 24px;background:#fef3c7;color:#92400e;text-align:center;font-size:14px;">Limited offer — <a href="#" style="font-weight:700;color:inherit;">Learn more</a></div>`
    case 'heroSplit':
      return `<section ${b} style="${S.section}"><div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">
  <div><span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#eef2ff;color:#4338ca;margin-bottom:16px;">New</span><h1 style="${S.h1}">Split hero headline</h1><p style="${S.lead}">Compelling subheadline beside a visual.</p><a href="#" style="${S.btn}margin-top:8px;">Get started</a></div>
  <img src="https://placehold.co/600x480/e2e8f0/64748b?text=Hero" alt="" style="width:100%;border-radius:20px;" /></div></section>`
    case 'iconBoxes':
      return collectionBlock('iconBoxes', 'Why choose us', undefined, 3, 3)
    case 'socialProof':
      return `<section ${b} style="${S.section}background:#fafafa;border-radius:20px;"><div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:32px;">
  <div style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;color:#4f46e5;">4.9★</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">2,400+ reviews</p></div>
  <div style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;">50k+</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">Active users</p></div>
  <div style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;">99.9%</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">Uptime SLA</p></div>
</div></section>`
    case 'comparison':
      return `<section ${b} style="${S.section}"><h2 style="${S.h2}text-align:center;margin-bottom:32px;">Compare plans</h2>
  <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="border-bottom:2px solid #e2e8f0;"><th style="padding:12px;text-align:left;">Feature</th><th style="padding:12px;text-align:center;">Starter</th><th style="padding:12px;text-align:center;color:#4f46e5;">Pro</th></tr></thead>
  <tbody><tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:12px;">Projects</td><td style="padding:12px;text-align:center;">5</td><td style="padding:12px;text-align:center;">Unlimited</td></tr>
  <tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:12px;">AI credits</td><td style="padding:12px;text-align:center;">100/mo</td><td style="padding:12px;text-align:center;">Unlimited</td></tr></tbody></table></div></section>`
    case 'callout':
      return `<aside ${b} style="padding:20px 24px;border-left:4px solid #4f46e5;background:#eef2ff;border-radius:0 12px 12px 0;margin:24px 0;"><p style="margin:0;font-weight:600;color:#312e81;">Pro tip</p><p style="margin:8px 0 0;color:#4338ca;font-size:14px;">Highlight important information with a callout block.</p></aside>`
    case 'videoHero':
      return `<section ${b} style="position:relative;min-height:420px;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;background:#0f172a;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0.4),rgba(15,23,42,0.85));"></div>
  <div style="position:relative;z-index:1;padding:48px 24px;max-width:640px;"><h1 style="font-size:2.5rem;font-weight:800;margin:0 0 16px;">Video hero</h1><p style="opacity:0.85;margin:0 0 24px;">Background video placeholder — replace with embed.</p><a href="#" style="${S.btn}">Watch demo</a></div></section>`
    case 'counters':
      return collectionBlock('counters', 'By the numbers', undefined, 4, 4)
    case 'tabs':
      return `<section ${b} data-am-collection="tabs" style="${S.section}">
  ${buildCollectionBody('tabs', 3, 1)}
  <p data-am-tab-content style="color:#475569;margin:0;padding:20px;border-radius:14px;background:#f8fafc;${S.panel}">Tab content — edit this text for the active panel.</p>
</section>`
    case 'map':
      return `<section ${b} style="${S.section}"><h2 style="${S.h2}text-align:center;margin-bottom:24px;">Find us</h2>
  <div style="aspect-ratio:16/7;background:#e2e8f0;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;">Map embed placeholder</div></section>`
    case 'dividerWave':
      return `<div ${b} style="line-height:0;margin:0;"><svg viewBox="0 0 1200 80" preserveAspectRatio="none" style="width:100%;height:48px;display:block;"><path d="M0,40 Q300,80 600,40 T1200,40 L1200,80 L0,80 Z" fill="#f8fafc"/></svg></div>`
    case 'steps':
      return collectionBlock('steps', 'Simple steps', 'Get started in three easy steps.', 3, 3)
    case 'timeline':
      return `<section ${b} style="${S.section}"><h2 style="${S.h2}">How it works</h2>
  <p style="color:#64748b;">1. Choose template → 2. Edit → 3. Publish</p></section>`
    case 'testimonials':
      return collectionBlock('testimonials', 'Testimonials', 'What our customers say.', 2, 2)
    case 'pricing':
      return collectionBlock('pricing', 'Pricing', 'Choose the plan that fits your team.', 2, 2)
    case 'faq':
      return collectionBlock('faq', 'Frequently asked questions', undefined, 2, 1)
    case 'leadForm':
      return `<section ${b} style="${S.section}text-align:center;">
  <h2 style="${S.h2}">Get in touch</h2>
  <p style="color:#64748b;margin:0 0 28px;font-size:15px;">Select a lead form in the inspector to preview it live.</p>
  <div data-am-lead-form-root="true" data-form-token="" data-form-input-width="100" data-form-input-padding="12" data-form-radius="10" data-form-primary="#6366f1" style="max-width:520px;margin:0 auto;text-align:left;${S.panel}padding:28px;">
    <div data-am-lead-form-placeholder style="padding:24px;border:2px dashed #e2e8f0;border-radius:12px;text-align:center;color:#94a3b8;font-size:14px;">Lead form preview appears here</div>
  </div>
</section>`
    case 'cta':
      return `<section ${b} style="${S.section}text-align:center;background:#f8fafc;border-radius:20px;"><h2 style="${S.h2}">Ready?</h2><a href="#" style="${S.btn}">Get started</a></section>`
    case 'heading':
      return `<h2 ${b} style="${S.h2}">Heading</h2>`
    case 'paragraph':
      return `<p ${b} style="line-height:1.7;color:#475569;">Paragraph text</p>`
    case 'button':
      return `<a href="#" ${b} style="${S.btn}">Button</a>`
    case 'image':
      return `<img ${b} src="https://placehold.co/800x450/e2e8f0/64748b?text=Image" alt="" style="max-width:100%;border-radius:12px;" />`
    case 'divider':
      return `<hr ${b} style="border:0;border-top:1px solid #e2e8f0;margin:40px 0;" />`
    case 'spacer':
      return `<div ${b} style="height:64px;"></div>`
    case 'section':
      return `<section ${b} data-am-drop-zone="true" style="${S.section}"><h2 style="${S.h2}">Section</h2><p style="${S.lead}">Drop blocks inside this section.</p></section>`
    case 'list':
      return `<ul ${b} style="line-height:1.8;color:#475569;"><li>Item one</li><li>Item two</li></ul>`
    case 'quote':
      return `<blockquote ${b} style="border-left:4px solid #4f46e5;padding-left:16px;color:#475569;font-style:italic;">Quote</blockquote>`
    case 'video':
      return `<div ${b} style="aspect-ratio:16/9;background:#1e293b;border-radius:16px;display:flex;align-items:center;justify-content:center;color:#94a3b8;">Video</div>`
    case 'icon':
      return `<span ${b} style="font-size:2rem;">★</span>`
    case 'badge':
      return `<span ${b} style="padding:6px 14px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:12px;font-weight:600;">Badge</span>`
    case 'card':
      return `<div ${b} style="${S.card}"><h3 style="margin:0 0 8px;">Card</h3><p style="margin:0;color:#64748b;font-size:14px;">Description</p></div>`
    default:
      return `<p ${b}>Block</p>`
  }
}

export function buildWidgetHtml(type: string): string {
  return buildElementorBlock((type === 'columns' ? 'columns2' : type) as ElementorBlockType)
}

export function buildBlankStarterPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>New Page</title>
</head>
<body>
${buildElementorBlock('header')}
${buildElementorBlock('hero')}
${buildElementorBlock('features')}
${buildElementorBlock('cta')}
${buildElementorBlock('footer')}
</body>
</html>`
}

export function buildMinimalStarterPage(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>New Page</title>
</head>
<body>
${buildElementorBlock('header')}
${buildElementorBlock('section')}
${buildElementorBlock('footer')}
</body>
</html>`
}

export const BLOCK_CATEGORIES: Record<string, { type: string; label: string }[]> = {
  structure: [
    { type: 'header', label: 'Header / Nav' },
    { type: 'footer', label: 'Footer' },
    { type: 'section', label: 'Section' },
    { type: 'columns2', label: '2 Columns' },
    { type: 'columns3', label: '3 Columns' },
    { type: 'spacer', label: 'Spacer' },
    { type: 'divider', label: 'Divider' },
    { type: 'banner', label: 'Alert bar' },
  ],
  basic: [
    { type: 'heading', label: 'Heading' },
    { type: 'paragraph', label: 'Text' },
    { type: 'button', label: 'Button' },
    { type: 'badge', label: 'Badge' },
    { type: 'list', label: 'List' },
    { type: 'quote', label: 'Quote' },
    { type: 'icon', label: 'Icon' },
  ],
  media: [
    { type: 'image', label: 'Image' },
    { type: 'video', label: 'Video' },
    { type: 'gallery', label: 'Gallery' },
  ],
  blocks: [
    { type: 'hero', label: 'Hero' },
    { type: 'features', label: 'Features' },
    { type: 'stats', label: 'Stats' },
    { type: 'cta', label: 'CTA' },
    { type: 'testimonials', label: 'Testimonials' },
    { type: 'pricing', label: 'Pricing' },
    { type: 'faq', label: 'FAQ' },
    { type: 'team', label: 'Team' },
    { type: 'logos', label: 'Logos' },
    { type: 'newsletter', label: 'Newsletter' },
    { type: 'contact', label: 'Contact' },
    { type: 'timeline', label: 'Timeline' },
    { type: 'steps', label: 'Steps' },
    { type: 'card', label: 'Card' },
    { type: 'heroSplit', label: 'Split Hero' },
    { type: 'videoHero', label: 'Video Hero' },
    { type: 'iconBoxes', label: 'Icon Boxes' },
    { type: 'socialProof', label: 'Social Proof' },
    { type: 'comparison', label: 'Comparison' },
    { type: 'callout', label: 'Callout' },
    { type: 'counters', label: 'Counters' },
    { type: 'tabs', label: 'Tabs' },
    { type: 'map', label: 'Map' },
    { type: 'dividerWave', label: 'Wave Divider' },
    { type: 'leadForm', label: 'Lead form' },
  ],
}

export { buildCollectionItemHtml, buildCollectionBody }
