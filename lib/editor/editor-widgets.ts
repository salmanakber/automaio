/** Widget snippets inserted by the visual editor. */
export type EditorWidgetType =
  | 'heading'
  | 'paragraph'
  | 'button'
  | 'image'
  | 'divider'
  | 'spacer'
  | 'section'
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

export type EditorWidget = {
  type: EditorWidgetType
  label: string
  icon: string
  category: 'text' | 'media' | 'layout' | 'blocks'
}

export const EDITOR_WIDGETS: EditorWidget[] = [
  { type: 'heading', label: 'Heading', icon: 'H', category: 'text' },
  { type: 'paragraph', label: 'Paragraph', icon: '¶', category: 'text' },
  { type: 'button', label: 'Button', icon: 'Btn', category: 'text' },
  { type: 'badge', label: 'Badge', icon: 'Tag', category: 'text' },
  { type: 'list', label: 'List', icon: 'List', category: 'text' },
  { type: 'quote', label: 'Quote', icon: '❝', category: 'text' },
  { type: 'image', label: 'Image', icon: 'Img', category: 'media' },
  { type: 'video', label: 'Video', icon: 'Vid', category: 'media' },
  { type: 'icon', label: 'Icon', icon: '★', category: 'media' },
  { type: 'section', label: 'Section', icon: 'Sec', category: 'layout' },
  { type: 'columns', label: '2 Columns', icon: 'Col', category: 'layout' },
  { type: 'divider', label: 'Divider', icon: '—', category: 'layout' },
  { type: 'spacer', label: 'Spacer', icon: 'Sp', category: 'layout' },
  { type: 'card', label: 'Card', icon: 'Card', category: 'blocks' },
  { type: 'hero', label: 'Hero', icon: 'Hero', category: 'blocks' },
  { type: 'cta', label: 'CTA Block', icon: 'CTA', category: 'blocks' },
  { type: 'testimonials', label: 'Testimonials', icon: 'T', category: 'blocks' },
  { type: 'pricing', label: 'Pricing', icon: '$', category: 'blocks' },
  { type: 'faq', label: 'FAQ', icon: '?', category: 'blocks' },
]

export function buildWidgetHtml(type: EditorWidgetType): string {
  const map: Record<EditorWidgetType, string> = {
    heading: '<h2 data-am-widget="heading">New heading</h2>',
    paragraph: '<p data-am-widget="paragraph">Add your paragraph text here.</p>',
    button:
      '<a href="#" class="cta" data-am-widget="button" style="display:inline-block;padding:12px 24px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Get started</a>',
    image:
      '<img src="https://placehold.co/800x400/e2e8f0/64748b?text=Image" alt="Image" data-am-widget="image" style="max-width:100%;height:auto;border-radius:8px;" />',
    divider: '<hr data-am-widget="divider" style="border:0;border-top:1px solid #e2e8f0;margin:32px 0;" />',
    spacer: '<div data-am-widget="spacer" style="height:48px;" aria-hidden="true"></div>',
    section:
      '<section data-am-widget="section" style="padding:48px 24px;"><h2>Section title</h2><p>Section content goes here.</p></section>',
    columns:
      '<div data-am-widget="columns" style="display:grid;grid-template-columns:1fr 1fr;gap:24px;"><div><h3>Column 1</h3><p>Content</p></div><div><h3>Column 2</h3><p>Content</p></div></div>',
    list: '<ul data-am-widget="list"><li>First item</li><li>Second item</li><li>Third item</li></ul>',
    quote:
      '<blockquote data-am-widget="quote" style="border-left:4px solid #6366f1;padding-left:16px;margin:24px 0;font-style:italic;color:#475569;">Inspiring quote goes here.</blockquote>',
    video:
      '<div data-am-widget="video" style="aspect-ratio:16/9;background:#0f172a;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#94a3b8;">Video embed</div>',
    icon: '<span data-am-widget="icon" style="font-size:2rem;">★</span>',
    badge:
      '<span class="badge" data-am-widget="badge" style="display:inline-block;padding:6px 12px;border-radius:999px;font-size:12px;font-weight:600;background:#e0e7ff;color:#3730a3;">New</span>',
    card:
      '<div class="card" data-am-widget="card" style="padding:24px;border:1px solid #e2e8f0;border-radius:12px;"><h3>Card title</h3><p>Card description text.</p></div>',
    hero:
      '<section data-am-widget="hero" style="padding:64px 24px;text-align:center;"><span class="badge" style="display:inline-block;padding:6px 12px;border-radius:999px;font-size:12px;background:#e0e7ff;color:#3730a3;margin-bottom:16px;">Featured</span><h1>Hero headline</h1><p class="lead" style="font-size:1.125rem;color:#64748b;max-width:48ch;margin:16px auto;">Supporting subheadline for your offer.</p><a href="#" class="cta" style="display:inline-block;margin-top:24px;padding:14px 28px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px;">Call to action</a></section>',
    cta:
      '<section data-am-widget="cta" style="padding:48px 24px;text-align:center;background:#f8fafc;border-radius:16px;"><h2>Ready to get started?</h2><p style="color:#64748b;margin:12px 0 24px;">Join thousands of happy customers today.</p><a href="#" class="cta" style="display:inline-block;padding:14px 28px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:10px;font-weight:600;">Start now</a></section>',
    testimonials:
      '<section data-am-widget="testimonials" style="padding:48px 24px;"><h2 style="text-align:center;margin-bottom:32px;">What customers say</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px;"><blockquote style="padding:20px;border:1px solid #e2e8f0;border-radius:12px;margin:0;"><p>&ldquo;This product changed how we work.&rdquo;</p><footer style="margin-top:12px;font-size:13px;color:#64748b;">— Alex M.</footer></blockquote><blockquote style="padding:20px;border:1px solid #e2e8f0;border-radius:12px;margin:0;"><p>&ldquo;Simple, fast, and reliable.&rdquo;</p><footer style="margin-top:12px;font-size:13px;color:#64748b;">— Jordan K.</footer></blockquote></div></section>',
    pricing:
      '<section data-am-widget="pricing" style="padding:48px 24px;"><h2 style="text-align:center;margin-bottom:32px;">Pricing</h2><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;max-width:900px;margin:0 auto;"><div class="card" style="padding:24px;border:1px solid #e2e8f0;border-radius:12px;text-align:center;"><h3>Starter</h3><p style="font-size:2rem;font-weight:700;margin:12px 0;">$29</p><p style="color:#64748b;font-size:14px;">Per month</p><a href="#" class="cta" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#0f172a;color:#fff;text-decoration:none;border-radius:8px;">Choose plan</a></div><div class="card" style="padding:24px;border:2px solid #4f46e5;border-radius:12px;text-align:center;"><h3>Pro</h3><p style="font-size:2rem;font-weight:700;margin:12px 0;">$79</p><p style="color:#64748b;font-size:14px;">Per month</p><a href="#" class="cta" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#4f46e5;color:#fff;text-decoration:none;border-radius:8px;">Choose plan</a></div></div></section>',
    faq:
      '<section data-am-widget="faq" style="padding:48px 24px;max-width:720px;margin:0 auto;"><h2 style="margin-bottom:24px;">FAQ</h2><details style="margin-bottom:12px;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><summary style="font-weight:600;cursor:pointer;">How does it work?</summary><p style="margin:12px 0 0;color:#64748b;font-size:14px;">Add your answer here.</p></details><details style="margin-bottom:12px;border:1px solid #e2e8f0;border-radius:8px;padding:12px 16px;"><summary style="font-weight:600;cursor:pointer;">Can I cancel anytime?</summary><p style="margin:12px 0 0;color:#64748b;font-size:14px;">Add your answer here.</p></details></section>',
  }
  return map[type] ?? map.paragraph
}
