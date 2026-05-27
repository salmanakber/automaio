export type SendEmailInput = {
  to: string | string[]
  subject: string
  html: string
  from?: string
  replyTo?: string
}

export type SendEmailResult = {
  provider: 'brevo' | 'resend' | 'ses'
  messageId?: string
}

function getFromEmail() {
  return (
    process.env.EMAIL_FROM ??
    process.env.BREVO_FROM_EMAIL ??
    process.env.RESEND_FROM_EMAIL ??
    process.env.SES_FROM_EMAIL ??
    'noreply@automaio.app'
  )
}

function normalizeRecipients(to: string | string[]) {
  return Array.isArray(to) ? to : [to]
}

async function sendViaBrevo(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.BREVO_API_KEY
  if (!apiKey) throw new Error('BREVO_API_KEY not configured')

  const recipients = normalizeRecipients(input.to).map((email) => ({ email }))
  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: {
      'api-key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      sender: { email: input.from ?? getFromEmail(), name: 'Automaio' },
      to: recipients,
      subject: input.subject,
      htmlContent: input.html,
      replyTo: input.replyTo ? { email: input.replyTo } : undefined,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Brevo failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as { messageId?: string }
  return { provider: 'brevo', messageId: data.messageId }
}

async function sendViaResend(input: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error('RESEND_API_KEY not configured')

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: input.from ?? getFromEmail(),
      to: normalizeRecipients(input.to),
      subject: input.subject,
      html: input.html,
      reply_to: input.replyTo,
    }),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Resend failed (${response.status}): ${text}`)
  }

  const data = (await response.json()) as { id?: string }
  return { provider: 'resend', messageId: data.id }
}

async function sendViaSes(input: SendEmailInput): Promise<SendEmailResult> {
  const accessKey = process.env.AWS_ACCESS_KEY_ID
  const secretKey = process.env.AWS_SECRET_ACCESS_KEY
  const region = process.env.AWS_REGION ?? 'us-east-1'
  if (!accessKey || !secretKey) throw new Error('AWS credentials not configured')

  const { SESv2Client, SendEmailCommand } = await import('@aws-sdk/client-sesv2')
  const client = new SESv2Client({
    region,
    credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
  })

  const result = await client.send(
    new SendEmailCommand({
      FromEmailAddress: input.from ?? getFromEmail(),
      Destination: { ToAddresses: normalizeRecipients(input.to) },
      Content: {
        Simple: {
          Subject: { Data: input.subject, Charset: 'UTF-8' },
          Body: { Html: { Data: input.html, Charset: 'UTF-8' } },
        },
      },
      ReplyToAddresses: input.replyTo ? [input.replyTo] : undefined,
    }),
  )

  return { provider: 'ses', messageId: result.MessageId }
}

/** Try Brevo → Resend → Amazon SES until one succeeds. */
export async function sendEmailWithFallback(input: SendEmailInput): Promise<SendEmailResult> {
  const providers: Array<{ name: string; fn: () => Promise<SendEmailResult> }> = [
    { name: 'brevo', fn: () => sendViaBrevo(input) },
    { name: 'resend', fn: () => sendViaResend(input) },
    { name: 'ses', fn: () => sendViaSes(input) },
  ]

  const errors: string[] = []

  for (const provider of providers) {
    try {
      const result = await provider.fn()
      console.log(`[Email] Sent via ${result.provider}`)
      return result
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.warn(`[Email] ${provider.name} failed:`, msg)
      errors.push(`${provider.name}: ${msg}`)
    }
  }

  throw new Error(`All email providers failed: ${errors.join(' | ')}`)
}

export async function sendBulkEmail(
  recipients: string[],
  subject: string,
  html: string,
) {
  const results: Array<{ email: string; ok: boolean; error?: string }> = []

  for (const email of recipients) {
    try {
      await sendEmailWithFallback({ to: email, subject, html })
      results.push({ email, ok: true })
    } catch (err) {
      results.push({
        email,
        ok: false,
        error: err instanceof Error ? err.message : 'Send failed',
      })
    }
  }

  return results
}
