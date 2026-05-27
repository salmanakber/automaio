import { z } from 'zod'

// Auth Validators
export const signUpSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationName: z.string().min(2, 'Organization name is required'),
})

export const signInSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Campaign Validators
export const createCampaignSchema = z.object({
  name: z.string().min(3, 'Campaign name must be at least 3 characters'),
  description: z.string().optional(),
  industry: z.string().min(2, 'Industry is required'),
  targetAudience: z.string().min(3, 'Target audience is required'),
  goals: z.array(z.string()).optional(),
  aiModel: z.enum(['gpt-4o-mini', 'claude-3-sonnet', 'groq-mixtral']).optional(),
})

export const updateCampaignSchema = createCampaignSchema.partial()

// Content Generation Validators
export const generateContentSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  assetType: z.enum(['headline', 'body_copy', 'cta', 'subject_line', 'visual_description']),
  industry: z.string(),
  targetAudience: z.string(),
  tone: z.enum(['professional', 'casual', 'technical', 'humorous']).optional(),
})

// Schedule Validators
export const scheduleSchema = z.object({
  campaignId: z.string().uuid('Invalid campaign ID'),
  scheduledFor: z.string().datetime('Invalid date format'),
  channel: z.enum(['email', 'social', 'webflow', 'multi']),
})

// Organization Validators
export const createOrganizationSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  slug: z.string().min(2, 'Organization slug is required').regex(/^[a-z0-9-]+$/),
  description: z.string().optional(),
})

// Template Validators
export const createTemplateSchema = z.object({
  name: z.string().min(3, 'Template name is required'),
  industry: z.string().min(2, 'Industry is required'),
  description: z.string().optional(),
  templateStructure: z.object({
    sections: z.array(z.object({
      name: z.string(),
      content: z.string(),
    })),
  }),
})

// Webflow Integration Validators
export const connectWebflowSchema = z.object({
  siteId: z.string().min(1, 'Site ID is required'),
  apiKey: z.string().min(1, 'API key is required'),
  siteName: z.string().optional(),
})

// Automation Rule Validators
export const automationRuleSchema = z.object({
  ruleName: z.string().min(3, 'Rule name is required'),
  triggerCondition: z.object({
    field: z.string(),
    operator: z.enum(['equals', 'contains', 'greaterThan', 'lessThan']),
    value: z.any(),
  }),
  actionType: z.enum(['use_template', 'switch_model', 'regenerate_content', 'schedule_campaign']),
  actionConfig: z.record(z.any()).optional(),
})

// Compliance Rule Validators
export const complianceRuleSchema = z.object({
  ruleName: z.string().min(3, 'Rule name is required'),
  ruleType: z.enum(['policy_enforcement', 'tone_check', 'regional_compliance', 'claim_validation']),
  blockUnsafeClaims: z.boolean().optional(),
  brandToneRules: z.object({}).optional(),
})

// Experiment Validators
export const experimentSchema = z.object({
  experimentName: z.string().min(3, 'Experiment name is required'),
  experimentType: z.enum(['a_b_test', 'multivariate', 'hook_test', 'cta_test']),
  controlVariant: z.object({}).optional(),
  testVariants: z.array(z.object({})).optional(),
})

// Helper function for validation
export function validateData<T>(schema: z.ZodSchema, data: unknown): { success: boolean; data?: T; error?: string } {
  try {
    const validatedData = schema.parse(data)
    return { success: true, data: validatedData as T }
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessage = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
      return { success: false, error: errorMessage }
    }
    return { success: false, error: 'Validation failed' }
  }
}
