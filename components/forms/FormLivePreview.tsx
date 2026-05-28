'use client'

import type { FormField } from '@/app/api/forms/route'

type FormLivePreviewProps = {
  name: string
  fields: FormField[]
  successMessage?: string
  primaryColor?: string
}

const DEFAULT_CSS = `
.automaio-form{font-family:system-ui,-apple-system,sans-serif;max-width:520px;margin:0 auto;padding:8px}
.automaio-form-title{font-size:1.125rem;font-weight:600;margin:0 0 16px;color:#0f172a}
.automaio-form label{display:block;font-size:13px;font-weight:500;margin-bottom:4px;color:#111}
.automaio-form input,.automaio-form textarea,.automaio-form select{width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:14px;margin-bottom:12px;box-sizing:border-box;background:#fff}
.automaio-form button{background:var(--form-primary,#0f172a);color:#fff;border:0;padding:12px 20px;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;width:100%}
.automaio-form .field-row{margin-bottom:4px}
.automaio-form .checkbox-row{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.automaio-form .checkbox-row input{width:auto;margin:0}
`

export function FormLivePreview({
  name,
  fields,
  successMessage = 'Thank you!',
  primaryColor = '#0f172a',
}: FormLivePreviewProps) {
  if (!fields.length) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
        Add fields to see the live preview
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <style>{DEFAULT_CSS}</style>
      <form
        className="automaio-form"
        style={{ ['--form-primary' as string]: primaryColor }}
        onSubmit={(e) => e.preventDefault()}
      >
        {name ? <h3 className="automaio-form-title">{name}</h3> : null}
        {fields.map((field) => (
          <div key={field.id} className="field-row">
            {field.type === 'checkbox' ? (
              <label className="checkbox-row">
                <input type="checkbox" disabled />
                <span>
                  {field.label}
                  {field.required ? ' *' : ''}
                </span>
              </label>
            ) : (
              <>
                <label>
                  {field.label}
                  {field.required ? ' *' : ''}
                </label>
                {field.type === 'textarea' ? (
                  <textarea placeholder={field.placeholder} rows={4} readOnly />
                ) : field.type === 'select' ? (
                  <select disabled defaultValue="">
                    <option value="" disabled>
                      {field.placeholder || 'Select…'}
                    </option>
                    {(field.options ?? []).map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={
                      field.type === 'email'
                        ? 'email'
                        : field.type === 'phone'
                          ? 'tel'
                          : field.type === 'number'
                            ? 'number'
                            : field.type === 'date'
                              ? 'date'
                              : field.type === 'url'
                                ? 'url'
                                : 'text'
                    }
                    placeholder={field.placeholder}
                    readOnly
                  />
                )}
              </>
            )}
          </div>
        ))}
        <button type="button">Submit</button>
      </form>
      <p className="text-[10px] text-muted-foreground mt-3 text-center">
        Matches Webflow runtime embed · success: &ldquo;{successMessage}&rdquo;
      </p>
    </div>
  )
}
