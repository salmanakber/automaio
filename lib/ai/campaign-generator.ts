import { aiOrchestrator } from './orchestrator'
import { prisma } from '@/lib/prisma'
import {
  ASSET_TYPE_TO_PROMPT,
  buildCampaignSystemPrompt,
  resolveAssetPrompt,
} from '@/lib/prompts/prompt-service'

interface CampaignBrief {
  name: string
  industry: string
  targetAudience: string
  goals: string[]
  organizationId: string
  tone?: string
  style?: string
}

export async function generateCampaignContent(brief: CampaignBrief) {
  const template = await prisma.campaignTemplate.findFirst({
    where: { industry: brief.industry },
  })

  const promptVars = {
    industry: brief.industry,
    targetAudience: brief.targetAudience,
    goals: brief.goals,
    tone: brief.tone,
    style: brief.style,
    primaryGoal: brief.goals[0],
    organizationId: brief.organizationId,
  }

  let systemPrompt = await buildCampaignSystemPrompt(promptVars)

  if (template?.bestPractices?.length) {
    systemPrompt += `\n\nTemplate best practices: ${template.bestPractices.join('; ')}`
  }

  const assetTypes = Object.keys(ASSET_TYPE_TO_PROMPT) as Array<keyof typeof ASSET_TYPE_TO_PROMPT>

  const generatedAssets = await Promise.all(
    assetTypes.map(async (assetType) => {
      const promptType = ASSET_TYPE_TO_PROMPT[assetType]
      const userPrompt = await resolveAssetPrompt(promptType, promptVars, brief.organizationId)

      const response = await aiOrchestrator.generate({
        prompt: userPrompt,
        systemPrompt,
        organizationId: brief.organizationId,
        maxTokens: 500,
        temperature: 0.8,
      })

      return {
        assetType,
        content: response.content,
        model: response.model,
      }
    }),
  )

  return generatedAssets
}

export async function optimizeCampaignForAudience(
  campaignId: string,
  audienceSegments: string[]
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) throw new Error('Campaign not found')

  const optimizationPrompt = `You are a conversion rate optimization expert.
Analyze this campaign and suggest specific optimizations for these audience segments: ${audienceSegments.join(', ')}.

Campaign Details:
- Industry: ${campaign.industry}
- Target Audience: ${campaign.targetAudience}
- Goals: ${campaign.goals.join(', ')}

Provide specific, actionable recommendations for each audience segment including:
1. Message angle adjustments
2. Timing considerations
3. Channel preferences
4. Visual style suggestions
5. Expected performance improvements`

  const response = await aiOrchestrator.generate({
    prompt: optimizationPrompt,
    organizationId: campaign.organizationId,
  })

  return {
    optimizations: response.content,
    model: response.model,
  }
}

export async function generateABTestVariants(
  campaignId: string,
  assetType: string,
  numberOfVariants: number = 3
) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    include: {
      contentAssets: {
        where: { assetType },
        take: 1,
      },
    },
  })

  if (!campaign) throw new Error('Campaign not found')
  if (!campaign.contentAssets.length) throw new Error('Original asset not found')

  const originalContent = campaign.contentAssets[0].content

  const variants = await Promise.all(
    Array.from({ length: numberOfVariants }).map(async (_, index) => {
      const approach = ['urgency-driven', 'benefit-focused', 'curiosity-based'][index] || `variant-${index}`
      
      const prompt = `Create a variation of this ${assetType} using a ${approach} approach:
Original: "${originalContent}"

Requirements:
- Maintain the core message
- Different emotional trigger
- Keep similar length
- Make it compelling for ${campaign.targetAudience}
- Goal: ${campaign.goals[0] || 'increase engagement'}`

      const response = await aiOrchestrator.generate({
        prompt,
        organizationId: campaign.organizationId,
      })

      return {
        variant: approach,
        content: response.content,
      }
    })
  )

  return variants
}

export async function generateCampaignScheduleRecommendations(campaignId: string) {
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
  })

  if (!campaign) throw new Error('Campaign not found')

  const prompt = `As a marketing timing expert, recommend the optimal campaign schedule for:
Industry: ${campaign.industry}
Target Audience: ${campaign.targetAudience}
Goals: ${campaign.goals.join(', ')}

Provide:
1. Best days of week to send
2. Best times of day
3. Frequency recommendations
4. Seasonal considerations
5. Time zone strategies
6. Warm-up email strategy if applicable

Format as JSON with actionable timeline.`

  const response = await aiOrchestrator.generate({
    prompt,
    organizationId: campaign.organizationId,
  })

  return {
    recommendations: response.content,
    model: response.model,
  }
}
