/** Rebuild inner markup when switching block design variants in the editor. */

import {
  buildCollectionBody,
  buildCollectionItemHtml,
} from '@/lib/editor/block-collections'
import type { BlockVariantId } from '@/lib/editor/block-variants'
import {
  alertVariantInner,
  awardsVariantInner,
  bannerVariantInner,
  bentoVariantInner,
  calloutVariantInner,
  caseStudyVariantInner,
  comparisonVariantInner,
  contactVariantInner,
  countersVariantInner,
  countdownVariantInner,
  faqVariantInner,
  galleryVariantInner,
  heroSplitVariantInner,
  iconBoxesVariantInner,
  logoStripVariantInner,
  mapVariantInner,
  marqueeVariantInner,
  newsletterVariantInner,
  portfolioVariantInner,
  servicesVariantInner,
  socialProofVariantInner,
  statsVariantInner,
  stepsVariantInner,
  tabsVariantInner,
  teamVariantInner,
  timelineVariantInner,
  videoHeroVariantInner,
} from '@/lib/editor/block-variant-extended'

const S = {
  section:
    'padding:80px 24px; max-width:1200px; margin:0 auto; font-family: system-ui, -apple-system, sans-serif;',
  h1: 'font-size:clamp(2.5rem, 6vw, 4rem); font-weight:850; line-height:1.05; margin:0 0 20px; letter-spacing:-0.04em; color:#0f172a;',
  h2: 'font-size:clamp(1.75rem, 4vw, 2.5rem); font-weight:800; line-height:1.2; margin:0 0 16px; letter-spacing:-0.02em; color:#0f172a;',
  lead: 'font-size:1.25rem; line-height:1.6; color:#475569; margin:0 0 32px; max-width:60ch;',
  btn: 'display:inline-flex; align-items:center; justify-content:center; padding:14px 32px; background:#6366f1; color:#ffffff !important; text-decoration:none; border-radius:12px; font-weight:600; font-size:16px; box-shadow:0 4px 14px rgba(99,102,241,0.35); border:0; cursor:pointer;',
  btnOutline:
    'display:inline-flex; padding:14px 32px; background:#ffffff; color:#0f172a !important; text-decoration:none; border-radius:12px; font-weight:600; border:1px solid rgba(15,23,42,0.1);',
}

export function heroVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'gradient':
      return `<div style="text-align:center;padding:48px 32px;border-radius:28px;background:radial-gradient(ellipse 80% 60% at 50% 0%,#eef2ff 0%,#fff 70%);">
  <span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#fff;color:#4338ca;margin-bottom:20px;box-shadow:0 2px 8px rgba(99,102,241,0.15);">Featured</span>
  <h1 style="${S.h1}">Build landing pages that convert</h1>
  <p style="${S.lead}margin-left:auto;margin-right:auto;">Create, personalize, and publish in minutes.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><a href="#" style="${S.btn}">Start free</a><a href="#" style="${S.btnOutline}">Demo</a></div>
</div>`
    case 'bold':
      return `<div style="padding:56px 40px;border-radius:24px;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#fff;text-align:left;position:relative;overflow:hidden;">
  <div style="position:absolute;top:0;left:0;width:6px;height:100%;background:linear-gradient(180deg,#6366f1,#a855f7);"></div>
  <span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:11px;font-weight:700;background:rgba(99,102,241,0.25);color:#c7d2fe;margin-bottom:16px;letter-spacing:0.06em;">NEW</span>
  <h1 style="font-size:clamp(2.25rem,5vw,3.5rem);font-weight:900;line-height:1.05;margin:0 0 16px;color:#fff;">Ship pages faster</h1>
  <p style="font-size:1.15rem;line-height:1.6;color:#94a3b8;margin:0 0 28px;max-width:48ch;">High-contrast hero for product launches and SaaS brands.</p>
  <a href="#" style="${S.btn}background:linear-gradient(90deg,#6366f1,#8b5cf6);">Get started</a>
</div>`
    default:
      return `<div style="text-align:center;padding-top:16px;padding-bottom:16px;">
  <span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#eef2ff;color:#4338ca;margin-bottom:20px;">Featured</span>
  <h1 style="${S.h1}">Build landing pages that convert</h1>
  <p style="${S.lead}margin-left:auto;margin-right:auto;">Create, personalize, and publish to Webflow in minutes.</p>
  <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><a href="#" style="${S.btn}">Start free</a><a href="#" style="${S.btnOutline}">Demo</a></div>
</div>`
  }
}

export function featuresVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'list':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Features</h2>
  <p style="text-align:center;color:#64748b;margin:-8px auto 32px;max-width:52ch;font-size:15px;">Everything you need to launch faster.</p>
  <div style="display:flex;flex-direction:column;gap:16px;max-width:640px;margin:0 auto;">
    ${[1, 2, 3]
      .map(
        (i) =>
          `<div data-am-item style="display:flex;gap:16px;align-items:flex-start;padding:20px;border-radius:16px;background:#fff;border:1px solid rgba(15,23,42,0.06);box-shadow:0 4px 16px rgba(15,23,42,0.04);">
      <span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="bolt" class="am-icon" style="display:inline-flex;font-family:'Material Symbols Outlined',sans-serif;font-size:1.75rem;color:#6366f1;">bolt</span>
      <div><h3 style="margin:0 0 6px;color:#0f172a;">Feature ${i}</h3><p style="margin:0;color:#64748b;font-size:14px;line-height:1.6;">Short description for this capability.</p></div>
    </div>`,
      )
      .join('\n    ')}
  </div>`
    case 'bento':
      return `<h2 style="${S.h2}margin-bottom:24px;">Features</h2>
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:auto auto;gap:16px;" data-am-columns="3">
    <div data-am-item style="grid-column:span 2;padding:32px;border-radius:20px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;min-height:180px;">
      <h3 style="margin:0 0 8px;font-size:1.35rem;">Primary highlight</h3>
      <p style="margin:0;opacity:0.9;font-size:14px;">Lead feature with extra visual weight.</p>
    </div>
    <div data-am-item style="padding:24px;border-radius:20px;background:#fff;border:1px solid rgba(15,23,42,0.06);">
      <h3 style="margin:0 0 6px;color:#0f172a;">Fast</h3><p style="margin:0;color:#64748b;font-size:13px;">Quick setup</p>
    </div>
    <div data-am-item style="padding:24px;border-radius:20px;background:#fff;border:1px solid rgba(15,23,42,0.06);">
      <h3 style="margin:0 0 6px;color:#0f172a;">Secure</h3><p style="margin:0;color:#64748b;font-size:13px;">Enterprise ready</p>
    </div>
    <div data-am-item style="grid-column:span 2;padding:24px;border-radius:20px;background:#f8fafc;border:1px solid #e2e8f0;">
      <h3 style="margin:0 0 6px;color:#0f172a;">Flexible layouts</h3><p style="margin:0;color:#64748b;font-size:14px;">Mix blocks and variants freely.</p>
    </div>
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Features</h2>
  <p style="text-align:center;color:#64748b;margin:-24px auto 40px;max-width:52ch;font-size:15px;line-height:1.6;">Everything you need to launch faster.</p>
  ${buildCollectionBody('features', 3, 3)}`
  }
}

export function testimonialsVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'stacked':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Testimonials</h2>
  <blockquote data-am-item style="max-width:720px;margin:0 auto;padding:40px;border-radius:24px;background:#fff;border:1px solid rgba(15,23,42,0.06);box-shadow:0 12px 40px rgba(15,23,42,0.08);text-align:center;">
    <p style="margin:0 0 24px;font-size:1.35rem;line-height:1.65;color:#334155;font-weight:500;">&ldquo;This product changed how we ship landing pages. Our team saves hours every week.&rdquo;</p>
    <footer style="display:flex;align-items:center;justify-content:center;gap:12px;color:#64748b;font-size:14px;">
      <img src="https://placehold.co/48x48/e2e8f0/64748b?text=AV" alt="" style="width:48px;height:48px;border-radius:50%;" />
      <span><strong style="color:#0f172a;">Alex Rivera</strong> · VP Marketing</span>
    </footer>
  </blockquote>`
    case 'minimal':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:40px;font-weight:700;">What customers say</h2>
  <div data-am-collection-body style="display:flex;flex-direction:column;gap:28px;max-width:640px;margin:0 auto;" data-am-columns="1">
    ${[1, 2]
      .map(
        () =>
          `<blockquote data-am-item style="margin:0;padding:0;border:0;border-top:1px solid #e2e8f0;padding-top:24px;">
      <p style="margin:0 0 12px;font-size:1.1rem;line-height:1.7;color:#475569;font-style:italic;">&ldquo;Add a customer quote here.&rdquo;</p>
      <footer style="color:#94a3b8;font-size:13px;font-weight:600;">— Customer name</footer>
    </blockquote>`,
      )
      .join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Testimonials</h2>
  <p style="text-align:center;color:#64748b;margin:-24px auto 40px;max-width:52ch;font-size:15px;">What our customers say.</p>
  ${buildCollectionBody('testimonials', 2, 2)}`
  }
}

export function ctaVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'gradient':
      return `<div style="text-align:center;padding:56px 32px;border-radius:24px;background:linear-gradient(135deg,#4f46e5 0%,#7c3aed 50%,#a855f7 100%);color:#fff;">
  <h2 style="margin:0 0 12px;font-size:clamp(1.5rem,3vw,2rem);font-weight:800;">Ready to grow?</h2>
  <p style="margin:0 0 24px;opacity:0.9;font-size:15px;">Start your free trial — no credit card required.</p>
  <a href="#" style="${S.btn}background:#fff;color:#4f46e5;box-shadow:0 8px 24px rgba(0,0,0,0.15);">Get started</a>
</div>`
    case 'outline':
      return `<div style="text-align:center;padding:48px 32px;border-radius:20px;border:2px solid #e2e8f0;background:#fff;">
  <h2 style="${S.h2}margin-bottom:8px;">Ready?</h2>
  <p style="color:#64748b;margin:0 0 24px;font-size:15px;">Join thousands of teams already using Automaio.</p>
  <a href="#" style="${S.btn}">Get started</a>
</div>`
    default:
      return `<div style="text-align:center;padding:48px 32px;background:#f8fafc;border-radius:20px;">
  <h2 style="${S.h2}">Ready?</h2>
  <a href="#" style="${S.btn}margin-top:8px;">Get started</a>
</div>`
  }
}

export function pricingVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'highlight':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Pricing</h2>
  <p style="text-align:center;color:#64748b;margin:0 auto 40px;max-width:52ch;font-size:15px;">Choose the plan that fits your team.</p>
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(2,1fr);gap:24px;align-items:center;max-width:880px;margin:0 auto;" data-am-columns="2">
    <div data-am-item style="padding:32px;border:1px solid rgba(15,23,42,0.08);border-radius:22px;background:#fff;text-align:center;box-shadow:0 4px 16px rgba(15,23,42,0.04);">
      <h3 style="margin:0 0 8px;">Starter</h3><p style="font-size:2rem;font-weight:800;margin:0 0 16px;color:#64748b;">$49</p><p style="margin:0;color:#64748b;font-size:13px;">Per month</p>
    </div>
    <div data-am-item style="padding:40px 32px;border:2px solid #6366f1;border-radius:24px;background:linear-gradient(180deg,#fafaff,#fff);text-align:center;transform:scale(1.04);box-shadow:0 20px 50px rgba(99,102,241,0.18);">
      <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#eef2ff;color:#4338ca;font-size:11px;font-weight:700;margin-bottom:12px;">POPULAR</span>
      <h3 style="margin:0 0 8px;">Pro</h3><p style="font-size:2.5rem;font-weight:800;margin:0 0 16px;color:#4f46e5;">$99</p><p style="margin:0;color:#64748b;font-size:13px;">Per month</p>
    </div>
  </div>`
    case 'minimal':
      return `<h2 style="${S.h2}margin-bottom:24px;">Pricing</h2>
  <div data-am-collection-body style="display:flex;flex-direction:column;gap:0;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;" data-am-columns="1">
    ${[49, 99]
      .map(
        (price) =>
          `<div data-am-item style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;background:#fff;border-bottom:1px solid #f1f5f9;">
      <div><h3 style="margin:0 0 4px;font-size:1rem;">Plan</h3><p style="margin:0;color:#64748b;font-size:13px;">Per month</p></div>
      <p style="font-size:1.5rem;font-weight:800;margin:0;color:#0f172a;">$${price}</p>
    </div>`,
      )
      .join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Pricing</h2>
  <p style="text-align:center;color:#64748b;margin:-24px auto 40px;max-width:52ch;font-size:15px;">Choose the plan that fits your team.</p>
  ${buildCollectionBody('pricing', 2, 2)}`
  }
}

const VARIANT_HANDLERS: Record<string, (v: BlockVariantId) => string> = {
  hero: heroVariantInner,
  features: featuresVariantInner,
  testimonials: testimonialsVariantInner,
  cta: ctaVariantInner,
  pricing: pricingVariantInner,
  timeline: timelineVariantInner,
  stats: statsVariantInner,
  team: teamVariantInner,
  gallery: galleryVariantInner,
  steps: stepsVariantInner,
  faq: faqVariantInner,
  newsletter: newsletterVariantInner,
  contact: contactVariantInner,
  heroSplit: heroSplitVariantInner,
  iconBoxes: iconBoxesVariantInner,
  socialProof: socialProofVariantInner,
  comparison: comparisonVariantInner,
  callout: calloutVariantInner,
  videoHero: videoHeroVariantInner,
  counters: countersVariantInner,
  tabs: tabsVariantInner,
  map: mapVariantInner,
  marquee: marqueeVariantInner,
  bento: bentoVariantInner,
  countdown: countdownVariantInner,
  alert: alertVariantInner,
  logoStrip: logoStripVariantInner,
  banner: bannerVariantInner,
  caseStudy: caseStudyVariantInner,
  services: servicesVariantInner,
  portfolio: portfolioVariantInner,
  awards: awardsVariantInner,
}

export function getVariantInnerHtml(widget: string, variant: BlockVariantId): string | null {
  const handler = VARIANT_HANDLERS[widget]
  if (!handler) return null
  return handler(variant)
}
