/** Extended block variant HTML — timeline, stats, team, and more. */

import { buildCollectionBody, buildCollectionItemHtml } from '@/lib/editor/block-collections'
import type { BlockVariantId } from '@/lib/editor/block-variants'

const S = {
  h2: 'font-size:clamp(1.75rem, 4vw, 2.5rem); font-weight:800; line-height:1.2; margin:0 0 16px; letter-spacing:-0.02em; color:#0f172a;',
  lead: 'font-size:1.05rem; line-height:1.65; color:#64748b; margin:0;',
  btn: 'display:inline-flex;align-items:center;justify-content:center;padding:12px 24px;background:#6366f1;color:#fff !important;text-decoration:none;border-radius:10px;font-weight:600;font-size:14px;border:0;',
  shadow: 'box-shadow:0 4px 24px rgba(15,23,42,0.08), 0 1px 3px rgba(15,23,42,0.04);',
}

type TimelineStep = { phase: string; title: string; desc: string; icon: string }

const TIMELINE_STEPS: TimelineStep[] = [
  {
    phase: 'Phase 01',
    title: 'Discovery & strategy',
    desc: 'Stakeholder workshops, audience research, and positioning to align brand and business goals.',
    icon: 'explore',
  },
  {
    phase: 'Phase 02',
    title: 'Design & prototyping',
    desc: 'High-fidelity UI, design systems, and interactive prototypes validated with real users.',
    icon: 'palette',
  },
  {
    phase: 'Phase 03',
    title: 'Build & launch',
    desc: 'Development, QA, and performance-tuned deployment with analytics and conversion tracking.',
    icon: 'rocket_launch',
  },
  {
    phase: 'Phase 04',
    title: 'Scale & optimize',
    desc: 'Ongoing CRO, A/B tests, and content iterations driven by data and client feedback.',
    icon: 'trending_up',
  },
]

function timelineItemVertical(step: TimelineStep, index: number): string {
  const isLeft = index % 2 === 0
  const align = isLeft ? 'margin-right:calc(50% + 32px);text-align:right;' : 'margin-left:calc(50% + 32px);text-align:left;'
  return `<div data-am-item style="position:relative;padding:0 0 48px;${align}">
    <div style="position:absolute;top:8px;${isLeft ? 'right' : 'left'}:-39px;width:14px;height:14px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);border:3px solid #fff;${S.shadow}z-index:2;"></div>
    <span style="display:inline-block;padding:4px 10px;border-radius:999px;font-size:10px;font-weight:700;letter-spacing:0.08em;background:#eef2ff;color:#4338ca;margin-bottom:10px;">${step.phase}</span>
    <h3 style="margin:0 0 8px;font-size:1.15rem;font-weight:800;color:#0f172a;">${step.title}</h3>
    <p style="margin:0;font-size:14px;line-height:1.65;color:#64748b;max-width:36ch;${isLeft ? 'margin-left:auto;' : ''}">${step.desc}</p>
    <span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="${step.icon}" class="am-icon" style="display:inline-flex;margin-top:12px;font-family:'Material Symbols Outlined',sans-serif;font-size:1.25rem;color:#6366f1;">${step.icon}</span>
  </div>`
}

export function timelineVariantInner(variant: BlockVariantId): string {
  const header = `<div style="text-align:center;margin-bottom:56px;max-width:640px;margin-left:auto;margin-right:auto;">
  <span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:0.1em;background:linear-gradient(135deg,#eef2ff,#fae8ff);color:#4338ca;margin-bottom:16px;">OUR PROCESS</span>
  <h2 style="${S.h2}margin-bottom:12px;">How we deliver results</h2>
  <p style="${S.lead}">A proven agency workflow from first brief to measurable growth.</p>
</div>`

  switch (variant) {
    case 'roadmap':
      return `${header}
  <div data-am-collection-body style="display:flex;gap:0;overflow-x:auto;padding:8px 4px 24px;scrollbar-width:thin;" data-am-columns="1">
    ${TIMELINE_STEPS.map((step, i) => {
      const last = i === TIMELINE_STEPS.length - 1
      return `<div data-am-item style="flex:0 0 min(240px,70vw);position:relative;padding:0 24px 0 0;">
      ${!last ? '<div style="position:absolute;top:28px;left:calc(100% - 12px);width:24px;height:2px;background:linear-gradient(90deg,#6366f1,#c4b5fd);"></div>' : ''}
      <div style="width:56px;height:56px;border-radius:16px;background:linear-gradient(135deg,#6366f1,#8b5cf6);display:flex;align-items:center;justify-content:center;margin-bottom:16px;${S.shadow}">
        <span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="${step.icon}" class="am-icon" style="font-family:'Material Symbols Outlined',sans-serif;font-size:1.5rem;color:#fff;">${step.icon}</span>
      </div>
      <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.1em;color:#6366f1;">${step.phase}</p>
      <h3 style="margin:0 0 8px;font-size:1rem;font-weight:800;color:#0f172a;">${step.title}</h3>
      <p style="margin:0;font-size:13px;line-height:1.6;color:#64748b;">${step.desc}</p>
    </div>`
    }).join('\n    ')}
  </div>
  <div style="margin-top:8px;height:4px;border-radius:999px;background:linear-gradient(90deg,#6366f1 0%,#a855f7 50%,#e9d5ff 100%);max-width:100%;"></div>`

    case 'cards':
      return `${header}
  <div style="display:flex;flex-direction:column;gap:20px;max-width:720px;margin:0 auto;">
    ${TIMELINE_STEPS.map((step, i) => `
    <div data-am-item style="display:flex;gap:20px;align-items:flex-start;padding:28px 32px;border-radius:20px;background:#fff;border:1px solid rgba(15,23,42,0.06);${S.shadow}">
      <div style="flex-shrink:0;width:52px;height:52px;border-radius:14px;background:linear-gradient(135deg,#0f172a,#334155);color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.25rem;font-weight:900;">${String(i + 1).padStart(2, '0')}</div>
      <div style="flex:1;">
        <p style="margin:0 0 6px;font-size:10px;font-weight:800;letter-spacing:0.08em;color:#6366f1;">${step.phase}</p>
        <h3 style="margin:0 0 8px;font-size:1.2rem;font-weight:800;color:#0f172a;">${step.title}</h3>
        <p style="margin:0;font-size:14px;line-height:1.65;color:#64748b;">${step.desc}</p>
      </div>
      <span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="${step.icon}" class="am-icon" style="flex-shrink:0;font-family:'Material Symbols Outlined',sans-serif;font-size:2rem;color:#cbd5e1;">${step.icon}</span>
    </div>`).join('')}
  </div>`

    default:
      return `${header}
  <div style="position:relative;max-width:880px;margin:0 auto;">
    <div style="position:absolute;left:50%;top:0;bottom:0;width:3px;transform:translateX(-50%);background:linear-gradient(180deg,#6366f1 0%,#a855f7 50%,#e9d5ff 100%);border-radius:999px;"></div>
    ${TIMELINE_STEPS.map((step, i) => timelineItemVertical(step, i)).join('\n    ')}
  </div>`
  }
}

export function statsVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'cards':
      return `<div style="padding:56px 32px;border-radius:24px;background:linear-gradient(180deg,#f8fafc,#fff);">
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;" data-am-columns="3">
    ${['250+', '98%', '4.9★'].map((n, i) => `<div data-am-item style="padding:28px;border-radius:18px;background:#fff;border:1px solid rgba(15,23,42,0.06);text-align:center;${S.shadow}"><p style="margin:0;font-size:2.5rem;font-weight:800;color:#4f46e5;">${n}</p><p style="margin:8px 0 0;color:#64748b;font-size:14px;">${['Projects', 'Retention', 'Rating'][i]}</p></div>`).join('\n    ')}
  </div>
</div>`
    case 'minimal':
      return `<div style="display:flex;flex-wrap:wrap;justify-content:space-between;gap:32px;padding:40px 0;border-top:1px solid #e2e8f0;border-bottom:1px solid #e2e8f0;">
    ${['250+', '98%', '4.9★'].map((n, i) => `<div data-am-item style="text-align:center;flex:1;min-width:120px;"><p style="margin:0;font-size:2.25rem;font-weight:800;color:#0f172a;">${n}</p><p style="margin:8px 0 0;font-size:13px;color:#94a3b8;">${['Projects', 'Retention', 'Rating'][i]}</p></div>`).join('')}
  </div>`
    default:
      return `<section style="padding:64px 32px;border-radius:24px;background:linear-gradient(135deg,#eef2ff 0%,#faf5ff 50%,#fff 100%);text-align:center;">
  ${buildCollectionBody('stats', 3, 3)}
</section>`
  }
}

export function teamVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'spotlight':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:40px;">Leadership</h2>
  <div data-am-item style="display:grid;grid-template-columns:1fr 1.2fr;gap:40px;align-items:center;padding:40px;border-radius:24px;background:linear-gradient(135deg,#0f172a,#1e293b);color:#fff;margin-bottom:32px;${S.shadow}">
    <img src="https://placehold.co/400x480/334155/94a3b8?text=Lead" alt="" style="width:100%;border-radius:20px;aspect-ratio:4/5;object-fit:cover;" />
    <div><p style="margin:0 0 8px;font-size:12px;font-weight:700;letter-spacing:0.1em;color:#a5b4fc;">CEO & Founder</p><h3 style="margin:0 0 12px;font-size:1.75rem;font-weight:800;">Alex Morgan</h3><p style="margin:0;font-size:15px;line-height:1.7;color:#94a3b8;">15+ years building brands for Fortune 500 and high-growth startups.</p></div>
  </div>
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;" data-am-columns="3">
    ${[1, 2, 3].map(() => buildCollectionItemHtml('team')).join('\n    ')}
  </div>`
    case 'compact':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:28px;">The team</h2>
  <div data-am-collection-body style="display:flex;flex-wrap:wrap;justify-content:center;gap:24px;" data-am-columns="1">
    ${['AM', 'JR', 'SK', 'LP'].map((initials) => `<div data-am-item style="text-align:center;width:100px;"><div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin:0 auto 10px;font-size:1.1rem;">${initials}</div><p style="margin:0;font-weight:700;font-size:13px;color:#0f172a;">Name</p><p style="margin:4px 0 0;font-size:11px;color:#94a3b8;">Role</p></div>`).join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Our team</h2>
  <p style="text-align:center;color:#64748b;margin:0 auto 40px;max-width:52ch;">Meet the people behind the product.</p>
  ${buildCollectionBody('team', 3, 3)}`
  }
}

export function galleryVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'masonry':
      return `<h2 style="${S.h2}margin-bottom:24px;">Gallery</h2>
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(3,1fr);grid-auto-rows:120px;gap:12px;" data-am-columns="3">
    <img data-am-item src="https://placehold.co/600x800/e2e8f0/64748b?text=1" alt="" style="grid-row:span 2;width:100%;height:100%;object-fit:cover;border-radius:14px;" />
    <img data-am-item src="https://placehold.co/400x300/e2e8f0/64748b?text=2" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" />
    <img data-am-item src="https://placehold.co/400x500/e2e8f0/64748b?text=3" alt="" style="grid-row:span 2;width:100%;height:100%;object-fit:cover;border-radius:14px;" />
    <img data-am-item src="https://placehold.co/400x280/e2e8f0/64748b?text=4" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:14px;" />
  </div>`
    case 'showcase':
      return `<div style="display:grid;grid-template-columns:1.4fr 1fr;gap:16px;">
  <img data-am-item src="https://placehold.co/800x600/e2e8f0/64748b?text=Featured" alt="" style="width:100%;border-radius:20px;aspect-ratio:4/3;object-fit:cover;${S.shadow}" />
  <div data-am-collection-body style="display:grid;grid-template-columns:1fr 1fr;gap:12px;" data-am-columns="2">
    ${[1, 2, 3, 4].map((n) => `<img data-am-item src="https://placehold.co/300x220/e2e8f0/64748b?text=${n}" alt="" style="width:100%;border-radius:12px;aspect-ratio:4/3;object-fit:cover;" />`).join('\n    ')}
  </div>
</div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:28px;">Gallery</h2>${buildCollectionBody('gallery', 3, 3)}`
  }
}

export function stepsVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'timeline':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:40px;">Simple steps</h2>
  <div data-am-collection-body style="display:flex;justify-content:space-between;align-items:flex-start;position:relative;gap:16px;" data-am-columns="3">
    <div style="position:absolute;top:20px;left:10%;right:10%;height:2px;background:linear-gradient(90deg,#6366f1,#c4b5fd);z-index:0;"></div>
    ${[1, 2, 3].map((n) => `<div data-am-item style="flex:1;text-align:center;position:relative;z-index:1;"><div style="width:40px;height:40px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;margin:0 auto 14px;border:4px solid #fff;${S.shadow}">${n}</div><h3 style="margin:0 0 6px;font-size:0.95rem;">Step ${n}</h3><p style="margin:0;font-size:12px;color:#64748b;">Description</p></div>`).join('\n    ')}
  </div>`
    case 'cards':
      return `<h2 style="${S.h2}margin-bottom:24px;">Get started in three steps</h2>
  <div data-am-collection-body style="display:flex;flex-direction:column;gap:16px;max-width:560px;" data-am-columns="1">
    ${[1, 2, 3].map((n) => `<div data-am-item style="padding:24px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;${S.shadow}"><span style="font-size:11px;font-weight:800;color:#6366f1;">STEP ${n}</span><h3 style="margin:8px 0 6px;">Step title</h3><p style="margin:0;font-size:13px;color:#64748b;">Step description</p></div>`).join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Simple steps</h2>
  <p style="text-align:center;color:#64748b;margin:0 auto 40px;">Get started in three easy steps.</p>
  ${buildCollectionBody('steps', 3, 3)}`
  }
}

export function faqVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'twoCol':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">FAQ</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px 32px;max-width:960px;margin:0 auto;">
    ${[1, 2, 3, 4].map((n) => `<div data-am-item style="padding:20px;border-radius:14px;background:#f8fafc;"><h3 style="margin:0 0 8px;font-size:0.95rem;font-weight:700;color:#0f172a;">Question ${n}?</h3><p style="margin:0;font-size:13px;color:#64748b;line-height:1.6;">Answer goes here with helpful detail.</p></div>`).join('\n    ')}
  </div>`
    case 'minimal':
      return `<h2 style="${S.h2}margin-bottom:24px;">Questions</h2>
  <div data-am-collection-body style="display:flex;flex-direction:column;gap:0;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;" data-am-columns="1">
    ${[1, 2].map(() => buildCollectionItemHtml('faq').replace('border-radius:14px', 'border-radius:0;border:0;border-bottom:1px solid #e2e8f0')).join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:28px;">Frequently asked questions</h2>${buildCollectionBody('faq', 3, 1)}`
  }
}

export function newsletterVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'split':
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:40px;align-items:center;padding:48px;border-radius:24px;background:#f8fafc;border:1px solid #e2e8f0;">
  <div><h2 style="${S.h2}margin-bottom:8px;">Stay in the loop</h2><p style="${S.lead}">Weekly insights on design, growth, and conversion.</p></div>
  <div style="display:flex;gap:8px;"><input placeholder="you@company.com" style="flex:1;padding:14px;border:1px solid #e2e8f0;border-radius:10px;" readonly /><a href="#" style="${S.btn}">Subscribe</a></div>
</div>`
    case 'minimal':
      return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:16px;padding:24px 28px;border-radius:14px;border:1px solid #e2e8f0;">
  <p style="margin:0;font-weight:700;color:#0f172a;">Subscribe to our newsletter</p>
  <a href="#" style="${S.btn}padding:10px 20px;font-size:13px;">Join</a>
</div>`
    default:
      return `<div style="text-align:center;padding:56px 32px;border-radius:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;">
  <h2 style="margin:0 0 12px;font-size:1.75rem;font-weight:800;">Newsletter</h2>
  <p style="margin:0 0 20px;opacity:0.9;">Stay updated with agency insights.</p>
  <a href="#" style="${S.btn}background:#fff;color:#4f46e5;">Subscribe</a>
</div>`
  }
}

export function contactVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'split':
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:start;">
  <div><h2 style="${S.h2}">Let's talk</h2><p style="${S.lead}margin-bottom:24px;">hello@agency.com<br/>+1 (555) 000-0000<br/>San Francisco, CA</p></div>
  <div style="padding:32px;border-radius:20px;background:#fff;border:1px solid #e2e8f0;${S.shadow}"><input placeholder="Email" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;" readonly /><button style="${S.btn}width:100%;">Send message</button></div>
</div>`
    case 'minimal':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:20px;">Contact</h2>
  <div style="max-width:400px;margin:0 auto;"><input placeholder="Email" style="width:100%;padding:14px;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:12px;background:#fff;" readonly /><button style="${S.btn}width:100%;">Send</button></div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:24px;">Contact</h2>
  <div style="max-width:440px;margin:0 auto;padding:36px;border-radius:22px;background:#fff;border:1px solid rgba(15,23,42,0.06);${S.shadow}"><input placeholder="Email" style="width:100%;padding:12px;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:12px;" readonly /><button style="${S.btn}width:100%;">Send</button></div>`
  }
}

export function heroSplitVariantInner(variant: BlockVariantId): string {
  const copy = `<span style="display:inline-block;padding:6px 14px;border-radius:999px;font-size:12px;font-weight:600;background:#eef2ff;color:#4338ca;margin-bottom:16px;">New</span><h1 style="font-size:clamp(2rem,4vw,3rem);font-weight:900;line-height:1.05;margin:0 0 16px;color:#0f172a;">Split hero headline</h1><p style="font-size:1.1rem;line-height:1.6;color:#64748b;margin:0 0 24px;">Compelling subheadline beside a visual.</p><a href="#" style="${S.btn}">Get started</a>`
  const img = `<img src="https://placehold.co/600x480/e2e8f0/64748b?text=Visual" alt="" style="width:100%;border-radius:20px;aspect-ratio:5/4;object-fit:cover;${S.shadow}" />`
  switch (variant) {
    case 'imageLeft':
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;">${img}<div>${copy}</div></div>`
    case 'overlap':
      return `<div style="position:relative;padding:48px 0;"><div style="max-width:55%;position:relative;z-index:2;padding:40px;border-radius:24px;background:#fff;${S.shadow}">${copy}</div><img src="https://placehold.co/700x500/e2e8f0/64748b?text=Hero" alt="" style="position:absolute;right:0;top:50%;transform:translateY(-50%);width:58%;border-radius:24px;aspect-ratio:16/10;object-fit:cover;${S.shadow}" /></div>`
    default:
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:48px;align-items:center;"><div>${copy}</div>${img}</div>`
  }
}

export function iconBoxesVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'row':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Why choose us</h2>
  <div data-am-collection-body style="display:flex;flex-wrap:wrap;justify-content:center;gap:32px;" data-am-columns="1">
    ${[1, 2, 3].map(() => buildCollectionItemHtml('iconBoxes')).join('\n    ')}
  </div>`
    case 'gradient':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;color:#fff;">Capabilities</h2>
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;" data-am-columns="3">
    ${['Strategy', 'Design', 'Growth'].map((t) => `<div data-am-item style="padding:28px;border-radius:18px;background:linear-gradient(145deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04));border:1px solid rgba(255,255,255,0.15);color:#fff;text-align:center;"><h3 style="margin:12px 0 6px;">${t}</h3><p style="margin:0;font-size:13px;opacity:0.85;">Expert delivery</p></div>`).join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:12px;">Why choose us</h2>${buildCollectionBody('iconBoxes', 3, 3)}`
  }
}

export function socialProofVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'badges':
      return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:40px;padding:40px;">
  ${['G2 Leader', 'SOC 2', 'ISO'].map((b) => `<span data-am-item style="padding:12px 20px;border-radius:12px;background:#fff;border:1px solid #e2e8f0;font-size:12px;font-weight:800;color:#64748b;${S.shadow}">${b}</span>`).join('\n  ')}
  <div style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;color:#4f46e5;">4.9★</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">2,400+ reviews</p></div>
</div>`
    case 'dark':
      return `<div style="padding:48px 32px;border-radius:20px;background:#0f172a;color:#fff;display:flex;flex-wrap:wrap;justify-content:center;gap:48px;">
  ${[['50k+', 'Users'], ['99.9%', 'Uptime'], ['4.9★', 'Rating']].map(([n, l]) => `<div data-am-item style="text-align:center;"><p style="font-size:2.25rem;font-weight:800;margin:0;background:linear-gradient(90deg,#818cf8,#c4b5fd);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">${n}</p><p style="margin:6px 0 0;font-size:12px;color:#94a3b8;">${l}</p></div>`).join('\n  ')}
</div>`
    default:
      return `<div style="display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:32px;padding:32px;background:#fafafa;border-radius:20px;">
  <div data-am-item style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;color:#4f46e5;">4.9★</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">2,400+ reviews</p></div>
  <div data-am-item style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;">50k+</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">Active users</p></div>
  <div data-am-item style="text-align:center;"><p style="font-size:2rem;font-weight:800;margin:0;">99.9%</p><p style="margin:4px 0 0;font-size:12px;color:#64748b;">Uptime SLA</p></div>
</div>`
  }
}

export function comparisonVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'cards':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Compare plans</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;max-width:720px;margin:0 auto 32px;">
    <div data-am-item style="padding:28px;border-radius:18px;border:1px solid #e2e8f0;text-align:center;"><h3>Starter</h3><p style="font-size:1.5rem;font-weight:800;">$29</p></div>
    <div data-am-item style="padding:28px;border-radius:18px;border:2px solid #6366f1;text-align:center;background:#fafaff;"><h3>Pro</h3><p style="font-size:1.5rem;font-weight:800;color:#6366f1;">$99</p></div>
  </div>
  <table style="width:100%;border-collapse:collapse;font-size:14px;"><tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:12px;">Feature</td><td style="padding:12px;text-align:center;">Starter</td><td style="padding:12px;text-align:center;color:#6366f1;">Pro</td></tr></table>`
    case 'minimal':
      return `<h2 style="${S.h2}margin-bottom:20px;">Included</h2>
  ${['Unlimited projects', 'AI credits', 'Priority support'].map((f) => `<div data-am-item style="display:flex;align-items:center;gap:12px;padding:14px 0;border-bottom:1px solid #f1f5f9;"><span style="color:#22c55e;font-weight:800;">✓</span><span style="color:#334155;font-size:14px;">${f}</span></div>`).join('\n')}`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Compare plans</h2>
  <div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:14px;"><thead><tr style="border-bottom:2px solid #e2e8f0;"><th style="padding:12px;text-align:left;">Feature</th><th style="padding:12px;text-align:center;">Starter</th><th style="padding:12px;text-align:center;color:#4f46e5;">Pro</th></tr></thead>
  <tbody><tr style="border-bottom:1px solid #f1f5f9;"><td style="padding:12px;">Projects</td><td style="padding:12px;text-align:center;">5</td><td style="padding:12px;text-align:center;">Unlimited</td></tr></tbody></table></div>`
  }
}

export function calloutVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'gradient':
      return `<aside data-am-item style="padding:24px 28px;border-radius:16px;background:linear-gradient(135deg,#eef2ff,#faf5ff);border:1px solid #c7d2fe;"><p style="margin:0 0 6px;font-weight:700;color:#4338ca;">Pro tip</p><p style="margin:0;color:#4f46e5;font-size:14px;line-height:1.6;">Highlight important information with a polished callout.</p></aside>`
    case 'dark':
      return `<aside data-am-item style="padding:24px 28px;border-radius:16px;background:#0f172a;color:#e2e8f0;"><p style="margin:0 0 6px;font-weight:700;color:#fff;">Note</p><p style="margin:0;font-size:14px;line-height:1.6;opacity:0.9;">Dark callouts work well on light pages.</p></aside>`
    default:
      return `<aside data-am-item style="padding:20px 24px;border-left:4px solid #4f46e5;background:#eef2ff;border-radius:0 12px 12px 0;"><p style="margin:0;font-weight:600;color:#312e81;">Pro tip</p><p style="margin:8px 0 0;color:#4338ca;font-size:14px;">Highlight important information.</p></aside>`
  }
}

export function videoHeroVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'split':
      return `<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;align-items:center;min-height:360px;padding:48px 0;">
  <div><h1 style="font-size:2.25rem;font-weight:800;margin:0 0 16px;color:#0f172a;">Video story</h1><p style="color:#64748b;margin:0 0 20px;">Showcase your product with a side-by-side layout.</p><a href="#" style="${S.btn}">Watch demo</a></div>
  <div style="aspect-ratio:16/10;background:#1e293b;border-radius:20px;display:flex;align-items:center;justify-content:center;color:#94a3b8;">▶ Video</div>
</div>`
    case 'minimal':
      return `<div style="padding:64px 32px;text-align:center;border-radius:24px;background:#f8fafc;border:1px solid #e2e8f0;">
  <div style="width:72px;height:72px;border-radius:50%;background:#6366f1;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 20px;font-size:1.5rem;">▶</div>
  <h1 style="font-size:2rem;font-weight:800;margin:0 0 12px;">Video hero</h1><p style="color:#64748b;margin:0;">Light, minimal video CTA block.</p>
</div>`
    default:
      return `<div style="position:relative;min-height:420px;display:flex;align-items:center;justify-content:center;text-align:center;color:#fff;background:#0f172a;border-radius:20px;overflow:hidden;">
  <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,0.35),rgba(15,23,42,0.9));"></div>
  <div style="position:relative;z-index:1;padding:48px;"><h1 style="font-size:2.5rem;font-weight:800;margin:0 0 16px;">Video hero</h1><p style="opacity:0.85;margin:0 0 24px;">Cinematic full-width video section.</p><a href="#" style="${S.btn}">Watch demo</a></div></div>`
  }
}

export function countersVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'dark':
      return `<div style="padding:56px 32px;border-radius:24px;background:#0f172a;">${buildCollectionBody('counters', 4, 4).replace(/color:#7c3aed/g, 'color:#a5b4fc').replace(/color:#64748b/g, 'color:#94a3b8')}</div>`
    case 'gradient':
      return `<div style="padding:48px;border-radius:24px;background:linear-gradient(135deg,#4f46e5,#7c3aed);">
  <div data-am-collection-body style="display:grid;grid-template-columns:repeat(4,1fr);gap:16px;" data-am-columns="4">
    ${[0, 1, 2, 3].map(() => `<div data-am-item style="text-align:center;padding:20px;border-radius:14px;background:rgba(255,255,255,0.12);color:#fff;"><p style="font-size:2rem;font-weight:800;margin:0;">100</p><p style="margin:6px 0 0;font-size:12px;opacity:0.85;">Label</p></div>`).join('\n    ')}
  </div></div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">By the numbers</h2>${buildCollectionBody('counters', 4, 4)}`
  }
}

export function tabsVariantInner(variant: BlockVariantId): string {
  const content = `<p data-am-tab-content style="color:#475569;margin:0;padding:24px;border-radius:14px;background:#f8fafc;border:1px solid #e2e8f0;">Tab content — edit for the active panel.</p>`
  switch (variant) {
    case 'underline':
      return `${buildCollectionBody('tabs', 3, 1).replace(/border-radius:8px/g, 'border-radius:0;border-bottom:2px solid transparent').replace(/background:#f8fafc/g, 'background:transparent')}
  ${content}`
    case 'cards':
      return `<div data-am-collection-body style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-bottom:16px;" data-am-columns="3">
    ${['Overview', 'Features', 'Pricing'].map((t, i) => `<span data-am-item style="padding:14px;border-radius:12px;text-align:center;font-size:13px;font-weight:600;${i === 0 ? 'background:#6366f1;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;color:#64748b;'}">${t}</span>`).join('\n    ')}
  </div>${content}`
    default:
      return `${buildCollectionBody('tabs', 3, 1)}${content}`
  }
}

export function mapVariantInner(variant: BlockVariantId): string {
  const map = `<div style="aspect-ratio:16/7;background:linear-gradient(135deg,#e2e8f0,#f1f5f9);border-radius:16px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:14px;border:1px solid #e2e8f0;">Map embed placeholder</div>`
  switch (variant) {
    case 'split':
      return `<div style="display:grid;grid-template-columns:1fr 1.2fr;gap:32px;align-items:center;">
  <div><h2 style="${S.h2}">Visit us</h2><p style="${S.lead}">123 Market Street<br/>San Francisco, CA 94105<br/><br/>Mon–Fri 9am–6pm</p></div>
  ${map}
</div>`
    case 'minimal':
      return `${map.replace('border-radius:16px', 'border-radius:0')}`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:24px;">Find us</h2>${map}`
  }
}

export function marqueeVariantInner(variant: BlockVariantId): string {
  const logos = ['Brand One', 'Brand Two', 'Brand Three', 'Brand Four', 'Brand Five']
  switch (variant) {
    case 'fade':
      return `<div style="overflow:hidden;padding:32px 0;mask-image:linear-gradient(90deg,transparent,#000 12%,#000 88%,transparent);">
  <div style="display:flex;gap:48px;animation:am-marquee 24s linear infinite;white-space:nowrap;width:max-content;">
    ${logos.concat(logos).map((n) => `<span style="font-size:1.2rem;font-weight:800;color:#94a3b8;">${n}</span>`).join('\n    ')}
  </div><style>@keyframes am-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style></div>`
    case 'static':
      return `<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:40px;padding:32px;">
  ${logos.map((n) => `<span style="font-size:1.15rem;font-weight:700;color:#cbd5e1;">${n}</span>`).join('\n  ')}
</div>`
    default:
      return `<div style="display:flex;gap:48px;animation:am-marquee 24s linear infinite;white-space:nowrap;overflow:hidden;padding:24px 0;">
  ${logos.map((n) => `<span style="font-size:1.25rem;font-weight:700;color:#94a3b8;">${n}</span>`).join('\n  ')}
</div><style>@keyframes am-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>`
  }
}

export function bentoVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'hero':
      return `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
  <div data-am-drop-zone="true" style="grid-column:1/-1;min-height:220px;padding:48px;border-radius:24px;background:linear-gradient(135deg,#0f172a,#334155);color:#fff;"><h3 style="margin:0 0 8px;font-size:1.5rem;">Hero bento cell</h3><p style="margin:0;opacity:0.85;">Full-width highlight</p></div>
  ${[1, 2, 3].map((n) => `<div data-am-drop-zone="true" style="padding:24px;border-radius:16px;background:#fff;border:1px solid #e2e8f0;"><p style="margin:0;color:#64748b;">Cell ${n}</p></div>`).join('\n  ')}
</div>`
    case 'dense':
      return `<div style="display:grid;grid-template-columns:repeat(2,1fr);gap:12px;">
  ${[1, 2, 3, 4].map((n) => `<div data-am-drop-zone="true" style="min-height:140px;padding:24px;border-radius:16px;background:${n % 2 ? '#f8fafc' : '#fff'};border:1px solid #e2e8f0;"><p style="margin:0;color:#64748b;">Tile ${n}</p></div>`).join('\n  ')}
</div>`
    default:
      return `<h2 style="${S.h2}margin-bottom:24px;">Bento grid</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    <div data-am-drop-zone="true" style="grid-column:span 2;min-height:200px;padding:32px;border-radius:20px;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;"><h3 style="margin:0;">Highlight</h3></div>
    <div data-am-drop-zone="true" style="padding:24px;border-radius:20px;background:#fff;border:1px solid #e2e8f0;"><p style="margin:0;color:#64748b;">Side</p></div>
  </div>`
  }
}

export function countdownVariantInner(variant: BlockVariantId): string {
  const units = [['12', 'Days'], ['08', 'Hours'], ['42', 'Mins']]
  const cell = (n: string, l: string, dark: boolean) =>
    `<div style="min-width:80px;padding:18px 22px;border-radius:16px;text-align:center;${dark ? 'background:#0f172a;color:#fff;' : 'background:#fff;border:1px solid #e2e8f0;'}"><p style="margin:0;font-size:2rem;font-weight:800;">${n}</p><p style="margin:4px 0 0;font-size:11px;opacity:0.7;">${l}</p></div>`
  switch (variant) {
    case 'gradient':
      return `<div style="text-align:center;padding:56px 32px;border-radius:24px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;">
  <p style="font-size:11px;font-weight:800;letter-spacing:0.12em;margin:0 0 12px;opacity:0.9;">LAUNCHING SOON</p>
  <h2 style="margin:0 0 28px;font-size:1.75rem;font-weight:800;">We're almost live</h2>
  <div style="display:flex;justify-content:center;gap:12px;flex-wrap:wrap;">${units.map(([n, l]) => cell(n, l, true).replace('background:#0f172a', 'background:rgba(0,0,0,0.25)')).join('')}</div>
</div>`
    case 'minimal':
      return `<div style="text-align:center;"><h2 style="${S.h2}margin-bottom:20px;">Countdown</h2><div style="display:flex;justify-content:center;gap:12px;">${units.map(([n, l]) => cell(n, l, false)).join('')}</div></div>`
    default:
      return `<div style="text-align:center;"><p style="font-size:12px;font-weight:700;letter-spacing:0.12em;color:#6366f1;margin:0 0 12px;">LAUNCHING SOON</p><h2 style="${S.h2}margin-bottom:24px;">Countdown</h2><div style="display:flex;justify-content:center;gap:16px;flex-wrap:wrap;">${units.map(([n, l]) => cell(n, l, true)).join('')}</div></div>`
  }
}

export function alertVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'success':
      return `<div data-am-item style="padding:16px 20px;border-radius:14px;background:#ecfdf5;border:1px solid #a7f3d0;display:flex;gap:12px;max-width:1200px;margin:24px auto;"><span style="color:#059669;font-weight:800;">✓</span><div><p style="margin:0 0 4px;font-weight:700;color:#065f46;">Success</p><p style="margin:0;color:#047857;font-size:13px;">Your changes were saved successfully.</p></div></div>`
    case 'warning':
      return `<div data-am-item style="padding:16px 20px;border-radius:14px;background:#fffbeb;border:1px solid #fde68a;display:flex;gap:12px;max-width:1200px;margin:24px auto;"><span style="color:#d97706;font-weight:800;">!</span><div><p style="margin:0 0 4px;font-weight:700;color:#92400e;">Warning</p><p style="margin:0;color:#b45309;font-size:13px;">Please review before continuing.</p></div></div>`
    default:
      return `<div data-am-item style="padding:16px 20px;border-radius:14px;background:#eff6ff;border:1px solid #bfdbfe;display:flex;gap:12px;max-width:1200px;margin:24px auto;"><span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="info" class="am-icon" style="font-family:'Material Symbols Outlined',sans-serif;color:#2563eb;">info</span><div><p style="margin:0 0 4px;font-weight:700;color:#1e40af;">Information</p><p style="margin:0;color:#3b82f6;font-size:13px;">Use alerts for tips and announcements.</p></div></div>`
  }
}

export function logoStripVariantInner(variant: BlockVariantId): string {
  const brands = ['Acme', 'Globex', 'Umbrella', 'Stark', 'Wayne']
  switch (variant) {
    case 'scroll':
      return `<p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#94a3b8;margin:0 0 20px;">TRUSTED BY</p>
  <div style="overflow:hidden;mask-image:linear-gradient(90deg,transparent,#000 8%,#000 92%,transparent);"><div style="display:flex;gap:48px;animation:am-marquee 20s linear infinite;width:max-content;">
  ${brands.concat(brands).map((n) => `<span style="font-weight:800;font-size:1.1rem;color:#cbd5e1;">${n}</span>`).join('\n  ')}
  </div></div><style>@keyframes am-marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}</style>`
    case 'grid':
      return `<p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#94a3b8;margin:0 0 24px;">PARTNERS</p>
  <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:16px;max-width:900px;margin:0 auto;">
  ${brands.map((n) => `<div data-am-item style="text-align:center;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;"><span style="font-weight:800;font-size:13px;color:#94a3b8;">${n}</span></div>`).join('\n  ')}
  </div>`
    default:
      return `<p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:0.1em;color:#94a3b8;margin:0 0 20px;">PARTNERS</p>
  <div style="display:flex;gap:40px;justify-content:center;flex-wrap:wrap;">${brands.map((n) => `<span style="font-weight:800;font-size:1.1rem;color:#cbd5e1;">${n}</span>`).join('\n  ')}</div>`
  }
}

export function bannerVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'dark':
      return `<div data-am-item style="padding:14px 24px;background:#0f172a;color:#e2e8f0;text-align:center;font-size:14px;">New feature — <a href="#" style="font-weight:700;color:#a5b4fc;text-decoration:underline;">Explore now</a></div>`
    case 'gradient':
      return `<div data-am-item style="padding:14px 24px;background:linear-gradient(90deg,#6366f1,#8b5cf6);color:#fff;text-align:center;font-size:14px;">Limited offer — <a href="#" style="font-weight:700;color:#fff;text-decoration:underline;">Claim spot</a></div>`
    default:
      return `<div data-am-item style="padding:12px 24px;background:#fef3c7;color:#92400e;text-align:center;font-size:14px;">Limited offer — <a href="#" style="font-weight:700;color:inherit;">Learn more</a></div>`
  }
}

export function caseStudyVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'grid':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Case studies</h2>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;">
    ${[1, 2].map((n) => `<article data-am-item style="border-radius:20px;overflow:hidden;background:#fff;border:1px solid #e2e8f0;${S.shadow}"><img src="https://placehold.co/600x320/e2e8f0/64748b?text=Case+${n}" alt="" style="width:100%;aspect-ratio:16/9;object-fit:cover;" /><div style="padding:24px;"><p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#6366f1;">FINTECH</p><h3 style="margin:0 0 8px;font-size:1.1rem;">Client success story ${n}</h3><p style="margin:0;font-size:13px;color:#64748b;">+142% conversion in 90 days</p></div></article>`).join('\n    ')}
  </div>`
    case 'minimal':
      return `<h2 style="${S.h2}margin-bottom:24px;">Work</h2>
  ${[1, 2, 3].map((n) => `<div data-am-item style="display:flex;justify-content:space-between;align-items:center;padding:20px 0;border-bottom:1px solid #e2e8f0;"><div><h3 style="margin:0 0 4px;font-size:1rem;">Project ${n}</h3><p style="margin:0;font-size:13px;color:#94a3b8;">Brand · Web</p></div><span style="color:#6366f1;font-weight:700;font-size:13px;">View →</span></div>`).join('\n')}`
    default:
      return `<article data-am-item style="display:grid;grid-template-columns:1.1fr 1fr;gap:40px;align-items:center;padding:48px;border-radius:28px;background:linear-gradient(135deg,#f8fafc,#fff);border:1px solid #e2e8f0;${S.shadow}">
  <img src="https://placehold.co/720x480/e2e8f0/64748b?text=Case+Study" alt="" style="width:100%;border-radius:20px;aspect-ratio:3/2;object-fit:cover;" />
  <div><span style="font-size:11px;font-weight:800;letter-spacing:0.1em;color:#6366f1;">FEATURED WORK</span><h2 style="${S.h2}margin:16px 0 12px;">How we grew revenue 3×</h2><p style="${S.lead}margin-bottom:20px;">End-to-end rebrand and conversion-focused landing system for a Series B SaaS.</p><a href="#" style="${S.btn}">Read case study</a></div>
</article>`
  }
}

export function servicesVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'list':
      return `<h2 style="${S.h2}margin-bottom:28px;">Services</h2>
  ${['Brand strategy', 'Web design', 'Development', 'Growth marketing'].map((t) => `<div data-am-item style="display:flex;gap:20px;padding:24px 0;border-bottom:1px solid #e2e8f0;"><div style="width:8px;height:8px;border-radius:50%;background:#6366f1;margin-top:8px;flex-shrink:0;"></div><div><h3 style="margin:0 0 6px;font-size:1.05rem;font-weight:800;">${t}</h3><p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Full-service delivery from discovery through launch and optimization.</p></div></div>`).join('\n')}`
    case 'pricing':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Service tiers</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
    ${['Starter', 'Growth', 'Enterprise'].map((tier, i) => `<div data-am-item style="padding:28px;border-radius:20px;text-align:center;${i === 1 ? 'border:2px solid #6366f1;background:#fafaff;transform:scale(1.03);' : 'border:1px solid #e2e8f0;background:#fff;'}${S.shadow}"><h3 style="margin:0 0 8px;">${tier}</h3><p style="margin:0;font-size:13px;color:#64748b;">Scope & support level</p></div>`).join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">What we do</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
    ${['Strategy', 'Design', 'Engineering'].map((t) => `<div data-am-item style="padding:32px;border-radius:20px;background:#fff;border:1px solid rgba(15,23,42,0.06);${S.shadow}"><span data-am-icon="true" data-am-icon-set="material" data-am-icon-name="auto_awesome" class="am-icon" style="font-family:'Material Symbols Outlined',sans-serif;font-size:2rem;color:#6366f1;">auto_awesome</span><h3 style="margin:16px 0 8px;">${t}</h3><p style="margin:0;font-size:14px;color:#64748b;line-height:1.6;">Agency-grade ${t.toLowerCase()} for ambitious brands.</p></div>`).join('\n    ')}
  </div>`
  }
}

export function portfolioVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'showcase':
      return `<div style="display:grid;grid-template-columns:1.5fr 1fr;gap:16px;">
  <article data-am-item style="position:relative;border-radius:24px;overflow:hidden;min-height:360px;"><img src="https://placehold.co/800x600/1e293b/94a3b8?text=Featured" alt="" style="width:100%;height:100%;object-fit:cover;position:absolute;inset:0;" /><div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(15,23,42,0.85),transparent);"></div><div style="position:absolute;bottom:0;left:0;right:0;padding:32px;color:#fff;"><h3 style="margin:0 0 6px;font-size:1.35rem;">Featured project</h3><p style="margin:0;font-size:14px;opacity:0.85;">Brand identity · Web</p></div></article>
  <div style="display:flex;flex-direction:column;gap:16px;">${[1, 2].map((n) => `<article data-am-item style="flex:1;border-radius:16px;overflow:hidden;position:relative;min-height:160px;"><img src="https://placehold.co/400x280/e2e8f0/64748b?text=${n}" alt="" style="width:100%;height:100%;object-fit:cover;" /></article>`).join('\n    ')}</div>
</div>`
    case 'minimal':
      return `<h2 style="${S.h2}margin-bottom:28px;">Selected work</h2>
  ${['Nova Health', 'Arc Finance', 'Bloom Retail'].map((p) => `<div data-am-item style="padding:20px 0;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;"><span style="font-weight:700;color:#0f172a;">${p}</span><span style="font-size:13px;color:#94a3b8;">2025</span></div>`).join('\n')}`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Portfolio</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;">
    ${[1, 2, 3, 4, 5, 6].map((n) => `<article data-am-item style="border-radius:16px;overflow:hidden;position:relative;aspect-ratio:4/3;"><img src="https://placehold.co/480x360/e2e8f0/64748b?text=${n}" alt="" style="width:100%;height:100%;object-fit:cover;" /><div style="position:absolute;inset:0;background:linear-gradient(0deg,rgba(15,23,42,0.6),transparent);opacity:0.9;"></div><p style="position:absolute;bottom:12px;left:14px;margin:0;color:#fff;font-weight:700;font-size:13px;">Project ${n}</p></article>`).join('\n    ')}
  </div>`
  }
}

export function awardsVariantInner(variant: BlockVariantId): string {
  switch (variant) {
    case 'trophy':
      return `<h2 style="${S.h2}text-align:center;margin-bottom:32px;">Awards & recognition</h2>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px;">
    ${['Awwwards', 'FWA', 'CSSDA'].map((a) => `<div data-am-item style="padding:32px 24px;border-radius:20px;background:linear-gradient(180deg,#fffbeb,#fff);border:1px solid #fde68a;text-align:center;${S.shadow}"><span style="font-size:2rem;">🏆</span><h3 style="margin:12px 0 4px;font-size:1rem;">${a}</h3><p style="margin:0;font-size:12px;color:#92400e;">Site of the Day</p></div>`).join('\n    ')}
  </div>`
    case 'press':
      return `<p style="text-align:center;font-size:11px;font-weight:700;letter-spacing:0.12em;color:#94a3b8;margin:0 0 28px;">AS SEEN IN</p>
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:32px 40px;">
    ${['Forbes', 'TechCrunch', 'The Verge', 'Wired'].map((p) => `<div data-am-item style="text-align:center;"><p style="margin:0;font-family:Georgia,serif;font-size:1.35rem;font-weight:700;color:#cbd5e1;">${p}</p><p style="margin:6px 0 0;font-size:11px;color:#94a3b8;">Featured article</p></div>`).join('\n    ')}
  </div>`
    default:
      return `<h2 style="${S.h2}text-align:center;margin-bottom:28px;">Awards</h2>
  <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:20px;">
    ${['Winner 2025', 'Top Agency', 'Best UX'].map((a) => `<div data-am-item style="padding:16px 24px;border-radius:999px;background:#fff;border:1px solid #e2e8f0;font-size:13px;font-weight:700;color:#64748b;${S.shadow}">${a}</div>`).join('\n    ')}
  </div>`
  }
}
