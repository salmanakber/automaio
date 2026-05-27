import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'
import { STARTER_TEMPLATES } from '../lib/templates/starter-templates'
import {
  buildCampaignTemplateData,
  getTemplateHtml,
  renderTemplateHtml,
} from '../lib/webflow/template-renderer'
import { buildDefaultPromptSeeds } from '../lib/prompts/defaults'

const prisma = new PrismaClient()

const SALT_ROUNDS = 10

const SEED_USER = {
  email: 'test@automaio.dev',
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
}

const SEED_ORG = {
  name: 'Automaio Demo',
  slug: 'automaio-demo',
  description: 'Seed organization for local backend testing',
}

const SEED_CAMPAIGN = {
  name: 'Webflow Launch Campaign',
  description: 'Sample draft campaign for API testing',
  industry: 'SaaS',
  targetAudience: 'Webflow agencies and no-code marketers',
  goals: ['brand_awareness', 'lead_generation'],
  status: 'draft',
  aiModel: 'gpt-4o-mini',
}

async function main() {
  const hashedPassword = await hash(SEED_USER.password, SALT_ROUNDS)

  const user = await prisma.user.upsert({
    where: { email: SEED_USER.email },
    update: {
      password: hashedPassword,
      firstName: SEED_USER.firstName,
      lastName: SEED_USER.lastName,
    },
    create: {
      email: SEED_USER.email,
      password: hashedPassword,
      firstName: SEED_USER.firstName,
      lastName: SEED_USER.lastName,
    },
  })

  const organization = await prisma.organization.upsert({
    where: { slug: SEED_ORG.slug },
    update: {
      name: SEED_ORG.name,
      description: SEED_ORG.description,
      ownerId: user.id,
    },
    create: {
      name: SEED_ORG.name,
      slug: SEED_ORG.slug,
      description: SEED_ORG.description,
      ownerId: user.id,
    },
  })

  await prisma.teamMember.upsert({
    where: {
      organizationId_userId: {
        organizationId: organization.id,
        userId: user.id,
      },
    },
    update: { role: 'owner' },
    create: {
      organizationId: organization.id,
      userId: user.id,
      role: 'owner',
    },
  })

  const existingCampaign = await prisma.campaign.findFirst({
    where: {
      organizationId: organization.id,
      name: SEED_CAMPAIGN.name,
    },
  })

  const saasTemplate = await prisma.campaignTemplate.findFirst({
    where: { name: 'SaaS Product Launch', organizationId: null },
  })

  let campaign =
    existingCampaign ??
    (await prisma.campaign.create({
      data: {
        ...SEED_CAMPAIGN,
        organizationId: organization.id,
        createdById: user.id,
        templateId: saasTemplate?.id ?? null,
      },
    }))

  if (saasTemplate && !campaign.renderedHtml) {
    const html = renderTemplateHtml(
      getTemplateHtml(saasTemplate.templateStructure),
      buildCampaignTemplateData(SEED_CAMPAIGN),
    )
    campaign = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { renderedHtml: html },
    })
  }

  console.log('Database seeded successfully.\n')
  console.log('Test user credentials:')
  console.log(`  Email:    ${SEED_USER.email}`)
  console.log(`  Password: ${SEED_USER.password}`)
  console.log('\nSeeded records:')
  console.log(`  User ID:          ${user.id}`)
  console.log(`  Organization ID:  ${organization.id} (slug: ${organization.slug})`)
  console.log(`  Campaign ID:      ${campaign.id}`)

  for (const starter of STARTER_TEMPLATES) {
    const existing = await prisma.campaignTemplate.findFirst({
      where: { name: starter.name, organizationId: null },
    })
    if (!existing) {
      await prisma.campaignTemplate.create({
        data: {
          name: starter.name,
          industry: starter.industry,
          description: starter.description,
          templateStructure: starter.templateStructure,
          bestPractices: starter.bestPractices,
          organizationId: null,
        },
      })
    }
  }

  const modelSeeds = [
    { modelName: 'gemini-3-flash-preview', fallbackOrder: 1 },
    { modelName: 'gemini-2.0-flash', fallbackOrder: 2 },
    { modelName: 'gemini-2.0-flash-lite', fallbackOrder: 3 },
    { modelName: 'llama-3.1-8b-instant', fallbackOrder: 4 },
    { modelName: 'deepseek-chat', fallbackOrder: 5 },
    { modelName: 'gpt-4o-mini', fallbackOrder: 6 },
    { modelName: 'gpt-4o', fallbackOrder: 7 },
    { modelName: 'claude-3-5-haiku', fallbackOrder: 8 },
  ]
  for (const m of modelSeeds) {
    const existing = await prisma.aIModelConfig.findFirst({
      where: { modelName: m.modelName, organizationId: null },
    })
    if (!existing) {
      await prisma.aIModelConfig.create({
        data: {
          modelName: m.modelName,
          isActive: true,
          maxTokens: 2000,
          temperature: 0.7,
          fallbackOrder: m.fallbackOrder,
        },
      })
    }
  }

  const promptCount = await prisma.promptIntelligence.count({
    where: { organizationId: organization.id, isActive: true },
  })
  if (promptCount === 0) {
    const seeds = buildDefaultPromptSeeds(organization.id)
    await prisma.promptIntelligence.createMany({ data: seeds })
    console.log(`  Platform prompts: ${seeds.length} (all industries + assets)`)
  }

  console.log('\nLogin: POST /api/auth/login')
  console.log('Then use organizationId in campaign and org API calls.')
}

main()
  .catch((error) => {
    console.error('Seed failed:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
