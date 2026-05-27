import { prisma } from '@/lib/prisma'
import {
  ASSET_PROMPT_TYPES,
  DEFAULT_ASSET_PROMPTS,
  DEFAULT_SYSTEM_PROMPT,
  PROMPT_TYPES,
  getDefaultIndustryPrompt,
} from '@/lib/prompts/defaults'
import { getPlatformOrganizationId } from '@/lib/prompts/platform-org'
import { normalizeIndustry } from '@/lib/industries'

export type PromptRecord = {
  id: string
  promptContent: string
  promptType: string
  industry: string | null
  version: number
  isActive: boolean
  updatedAt: Date
  createdAt: Date
}

export type PromptVariables = {
  industry: string
  targetAudience: string
  goals: string[]
  tone?: string
  style?: string
  primaryGoal?: string
}

function interpolate(template: string, vars: PromptVariables): string {
  const goals = vars.goals.join(', ')
  const primaryGoal = vars.primaryGoal ?? vars.goals[0] ?? 'engagement'

  return template
    .replaceAll('{{industry}}', vars.industry)
    .replaceAll('{{targetAudience}}', vars.targetAudience)
    .replaceAll('{{goals}}', goals)
    .replaceAll('{{primaryGoal}}', primaryGoal)
    .replaceAll('{{tone}}', vars.tone ?? 'professional and engaging')
    .replaceAll('{{style}}', vars.style ?? 'modern and contemporary')
}

async function getActivePrompt(
  organizationId: string,
  promptType: string,
  industry?: string | null,
): Promise<PromptRecord | null> {
  const row = await prisma.promptIntelligence.findFirst({
    where: {
      organizationId,
      promptType,
      industry: industry ?? null,
      isActive: true,
    },
    orderBy: { version: 'desc' },
  })

  return row
}

export async function ensurePlatformPromptsSeeded() {
  const organizationId = await getPlatformOrganizationId()

  const count = await prisma.promptIntelligence.count({
    where: { organizationId, isActive: true },
  })

  if (count > 0) return { seeded: false, organizationId }

  const { buildDefaultPromptSeeds } = await import('@/lib/prompts/defaults')
  const seeds = buildDefaultPromptSeeds(organizationId)

  await prisma.promptIntelligence.createMany({ data: seeds })
  return { seeded: true, organizationId }
}

export async function listActivePlatformPrompts() {
  const organizationId = await getPlatformOrganizationId()
  await ensurePlatformPromptsSeeded()

  return prisma.promptIntelligence.findMany({
    where: { organizationId, isActive: true },
    orderBy: [{ promptType: 'asc' }, { industry: 'asc' }],
  })
}

export async function listPromptVersions(promptType: string, industry: string | null) {
  const organizationId = await getPlatformOrganizationId()

  return prisma.promptIntelligence.findMany({
    where: {
      organizationId,
      promptType,
      industry,
    },
    orderBy: { version: 'desc' },
    take: 20,
  })
}

export async function upsertPlatformPrompt(input: {
  promptType: string
  industry?: string | null
  promptContent: string
}) {
  const organizationId = await getPlatformOrganizationId()
  const industry = input.industry ?? null

  const existing = await prisma.promptIntelligence.findFirst({
    where: {
      organizationId,
      promptType: input.promptType,
      industry,
      isActive: true,
    },
  })

  if (existing) {
    await prisma.promptIntelligence.update({
      where: { id: existing.id },
      data: { isActive: false },
    })

    return prisma.promptIntelligence.create({
      data: {
        organizationId,
        promptType: input.promptType,
        industry,
        promptContent: input.promptContent,
        version: existing.version + 1,
        isActive: true,
        lastUsedAt: new Date(),
      },
    })
  }

  return prisma.promptIntelligence.create({
    data: {
      organizationId,
      promptType: input.promptType,
      industry,
      promptContent: input.promptContent,
      version: 1,
      isActive: true,
    },
  })
}

export async function restorePromptVersion(promptId: string) {
  const organizationId = await getPlatformOrganizationId()
  const versionRow = await prisma.promptIntelligence.findFirst({
    where: { id: promptId, organizationId },
  })

  if (!versionRow) throw new Error('Prompt version not found')

  return upsertPlatformPrompt({
    promptType: versionRow.promptType,
    industry: versionRow.industry,
    promptContent: versionRow.promptContent,
  })
}

export async function resolveSystemPrompt(organizationId?: string): Promise<string> {
  const orgId = organizationId ?? (await getPlatformOrganizationId())
  const row = await getActivePrompt(orgId, PROMPT_TYPES.system, null)
  return row?.promptContent ?? DEFAULT_SYSTEM_PROMPT
}

export async function resolveIndustryGuidance(industry: string, organizationId?: string): Promise<string> {
  const orgId = organizationId ?? (await getPlatformOrganizationId())
  const normalized = normalizeIndustry(industry)
  const row = await getActivePrompt(orgId, PROMPT_TYPES.industry, normalized)
  return row?.promptContent ?? getDefaultIndustryPrompt(normalized)
}

export async function resolveAssetPrompt(
  assetPromptType: string,
  vars: PromptVariables,
  organizationId?: string,
): Promise<string> {
  const orgId = organizationId ?? (await getPlatformOrganizationId())
  const row = await getActivePrompt(orgId, assetPromptType, null)
  const template = row?.promptContent ?? DEFAULT_ASSET_PROMPTS[assetPromptType] ?? ''
  return interpolate(template, vars)
}

export async function buildCampaignSystemPrompt(
  brief: PromptVariables & { organizationId?: string },
): Promise<string> {
  const base = await resolveSystemPrompt(brief.organizationId)
  const industryGuide = await resolveIndustryGuidance(brief.industry, brief.organizationId)

  return `${base}

Industry focus (${brief.industry}): ${industryGuide}

Campaign context:
- Target audience: ${brief.targetAudience}
- Goals: ${brief.goals.join(', ')}
- Tone: ${brief.tone ?? 'professional and engaging'}
- Style: ${brief.style ?? 'modern and contemporary'}`
}

export const ASSET_TYPE_TO_PROMPT: Record<string, string> = {
  headline: PROMPT_TYPES.assetHeadline,
  body_copy: PROMPT_TYPES.assetBodyCopy,
  cta: PROMPT_TYPES.assetCta,
  subject_line: PROMPT_TYPES.assetSubjectLine,
  visual_description: PROMPT_TYPES.assetVisual,
}

export { ASSET_PROMPT_TYPES, PROMPT_TYPES }
