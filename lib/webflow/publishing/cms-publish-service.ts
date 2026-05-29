import type { CollectionField } from '@/lib/webflow/field-mapper'
import type { PublishHtmlMode } from '@/lib/webflow/field-mapper'
import type { AutomaioContentPayload, BuildFieldPlanOptions } from '@/lib/webflow/field-mapper'
import { buildWebflowFieldPlan } from '@/lib/webflow/field-mapper'
import { configTypeForHtmlMode } from '@/lib/webflow/delivery-config-type'
import { applyHtmlModeFieldCleanup, preserveClearsAfterSanitize } from '@/lib/webflow/html-mode-field-cleanup'
import { sanitizeFieldDataForCollection } from '@/lib/webflow/field-mapper'
import { buildSplitCmsPayload } from '@/lib/webflow/publishing/split-payload-builder'
import {
  isDirectRenderMode,
  mapSplitPayloadToCmsFields,
  resolveDeliveryConfigType,
} from '@/lib/webflow/publishing/config-router'
import type { AssembledLandingPage } from '@/lib/webflow/landing-page-assembler'

export type CmsPublishPlanInput = {
  payload: AutomaioContentPayload
  collectionFields: CollectionField[]
  cmsFieldMapping?: unknown
  collectionId: string
  htmlMode: PublishHtmlMode
  builderHtml: string
  scopeId: string
  pageSchema?: BuildFieldPlanOptions['pageSchema']
}

export type CmsPublishPlan = {
  fieldData: Record<string, unknown>
  htmlMode: PublishHtmlMode
  configType: ReturnType<typeof configTypeForHtmlMode>
  needsEmbedSync: boolean
  usesEmbed: boolean
  embedFieldSlug: string | null
  assembledLanding?: AssembledLandingPage
}

/**
 * Builds sanitized CMS fieldData with config-driven routing:
 * - remote_runtime → page-id + runtime-config
 * - split_method → generated-html + generated-css (SEO, no JS in embed)
 */
export function buildCmsPublishPlan(input: CmsPublishPlanInput): CmsPublishPlan {
  const configType = resolveDeliveryConfigType(input.htmlMode)

  let assembledLanding: AssembledLandingPage | undefined
  if (isDirectRenderMode(configType) && input.builderHtml.trim()) {
    const splitPayload = buildSplitCmsPayload(input.builderHtml, {
      scopeId: input.scopeId,
      includeJs: false,
    })
    assembledLanding = {
      scopeClass: `ai-template-${input.scopeId.slice(0, 24)}`,
      htmlContent: splitPayload.generatedHtml,
      cssContent: splitPayload.generatedCss,
      jsContent: '',
      stylesheetUrls: [],
    }
  }

  const plan = buildWebflowFieldPlan(
    input.payload,
    input.collectionFields,
    input.cmsFieldMapping,
    input.collectionId,
    {
      htmlMode: input.htmlMode,
      assembledLanding,
      pageSchema: input.pageSchema,
    },
  )

  const cleaned = applyHtmlModeFieldCleanup(plan.fieldData, plan.htmlMode, input.collectionFields)
  const fieldData = preserveClearsAfterSanitize(
    sanitizeFieldDataForCollection(cleaned, input.collectionFields),
    cleaned,
  )

  if (isDirectRenderMode(configType) && assembledLanding) {
    const splitPayload = buildSplitCmsPayload(input.builderHtml, {
      scopeId: input.scopeId,
      includeJs: false,
    })
    Object.assign(fieldData, mapSplitPayloadToCmsFields(splitPayload, input.collectionFields))
  }

  return {
    fieldData,
    htmlMode: plan.htmlMode,
    configType,
    needsEmbedSync: isDirectRenderMode(configType),
    usesEmbed: plan.usesEmbed,
    embedFieldSlug: plan.embedFieldSlug,
    assembledLanding,
  }
}
