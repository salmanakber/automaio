import type { OnboardingInput } from '@/lib/ai/business-context-types'
import type { OnboardingFormData } from '@/components/projects/LandingPageOnboarding'

export type OnboardingDraft = OnboardingFormData & {
  savedAt?: string
  step?: number
}

const STORAGE_PREFIX = 'automaio-onboarding'

export function onboardingStorageKey(orgId: string, projectId?: string) {
  return projectId
    ? `${STORAGE_PREFIX}:${orgId}:project:${projectId}`
    : `${STORAGE_PREFIX}:${orgId}:wizard`
}

export function loadOnboardingDraft(key: string): OnboardingDraft | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw) as OnboardingDraft
  } catch {
    return null
  }
}

export function saveOnboardingDraft(key: string, draft: OnboardingDraft) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(
      key,
      JSON.stringify({ ...draft, savedAt: new Date().toISOString() }),
    )
  } catch {
    // quota exceeded — ignore
  }
}

export function clearOnboardingDraft(key: string) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(key)
}

export function formToOnboardingInput(form: OnboardingFormData): OnboardingInput {
  return {
    websiteUrl: form.websiteUrl || undefined,
    businessDescription: form.businessDescription || undefined,
    primaryGoal: form.primaryGoal || undefined,
    targetAudience: form.targetAudience || undefined,
    offer: form.offer || undefined,
    tonePreset: form.tonePreset,
    ctaGoal: form.ctaGoal,
  }
}

export function parseStoredBusinessContext(
  params: Record<string, unknown>,
): import('@/lib/ai/business-context-types').BusinessContext | null {
  const raw = params.businessContext
  if (!raw) return null
  if (typeof raw === 'object') return raw as import('@/lib/ai/business-context-types').BusinessContext
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as import('@/lib/ai/business-context-types').BusinessContext
    } catch {
      return null
    }
  }
  return null
}

export function parseStoredOnboardingDraft(
  params: Record<string, unknown>,
): OnboardingDraft | null {
  const raw = params.onboardingDraft
  if (!raw || typeof raw !== 'string') return null
  try {
    return JSON.parse(raw) as OnboardingDraft
  } catch {
    return null
  }
}

export type WizardDraft = {
  step: number
  projectName: string
  templateId?: string
  integrationId?: string
  collectionId?: string
  onboardingData?: OnboardingFormData
}

export function wizardStorageKey(orgId: string) {
  return `${STORAGE_PREFIX}:${orgId}:get-started`
}

export function loadWizardDraft(orgId: string): WizardDraft | null {
  return loadOnboardingDraft(wizardStorageKey(orgId)) as WizardDraft | null
}

export function saveWizardDraft(orgId: string, draft: WizardDraft) {
  saveOnboardingDraft(wizardStorageKey(orgId), draft as OnboardingDraft)
}

export function clearWizardDraft(orgId: string) {
  clearOnboardingDraft(wizardStorageKey(orgId))
}
