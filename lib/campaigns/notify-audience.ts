import { prisma } from '@/lib/prisma'
import { sendBulkEmail } from '@/lib/email/send-email'

export const AUDIENCE_TYPES = [
  'general',
  'newsletter',
  'lead',
  'customer',
  'vip',
  'prospect',
  'partner',
] as const

export type AudienceType = (typeof AUDIENCE_TYPES)[number]

export async function upsertLeadAsSubscriber(input: {
  organizationId: string
  email: string
  firstName?: string
  lastName?: string
  audienceType?: string
  leadFormId?: string
}) {
  const email = input.email.trim().toLowerCase()
  if (!email || !email.includes('@')) return null

  return prisma.emailSubscriber.upsert({
    where: {
      organizationId_email: {
        organizationId: input.organizationId,
        email,
      },
    },
    create: {
      organizationId: input.organizationId,
      email,
      firstName: input.firstName,
      lastName: input.lastName,
      audienceType: input.audienceType ?? 'lead',
      source: 'form',
      leadFormId: input.leadFormId,
      status: 'active',
    },
    update: {
      firstName: input.firstName ?? undefined,
      lastName: input.lastName ?? undefined,
      audienceType: input.audienceType ?? undefined,
      leadFormId: input.leadFormId ?? undefined,
      status: 'active',
    },
  })
}

export async function notifyAudienceOnPublish(input: {
  organizationId: string
  emailCampaignId: string
  audienceTypes?: string[]
  projectName?: string
  liveUrl?: string
}) {
  const campaign = await prisma.emailCampaign.findFirst({
    where: { id: input.emailCampaignId, organizationId: input.organizationId },
  })
  if (!campaign) throw new Error('Email campaign template not found')

  const types = input.audienceTypes?.length ? input.audienceTypes : ['general', 'lead', 'newsletter']

  const subscribers = await prisma.emailSubscriber.findMany({
    where: {
      organizationId: input.organizationId,
      status: 'active',
      audienceType: { in: types },
    },
  })

  if (!subscribers.length) {
    return { sent: 0, failed: 0, skipped: true, reason: 'No subscribers in selected audiences' }
  }

  let htmlBody = campaign.htmlBody
  if (input.projectName) {
    htmlBody = htmlBody.replace(/\{\{projectName\}\}/g, input.projectName)
  }
  if (input.liveUrl) {
    htmlBody = htmlBody.replace(/\{\{liveUrl\}\}/g, input.liveUrl)
    if (!htmlBody.includes(input.liveUrl)) {
      htmlBody += `<p style="margin-top:24px"><a href="${input.liveUrl}">View live page</a></p>`
    }
  }

  const results = await sendBulkEmail(
    subscribers.map((s) => s.email),
    campaign.subject.replace(/\{\{projectName\}\}/g, input.projectName ?? 'New page'),
    htmlBody,
  )

  return {
    sent: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    total: subscribers.length,
  }
}
