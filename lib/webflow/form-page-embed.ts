import { getAppBaseUrl } from '@/lib/app-url'
import { WebflowClient } from '@/lib/integrations/webflow-client'
import { prisma } from '@/lib/prisma'

const FORM_SCRIPT_VERSION = '1.0.0'
const FORM_SCRIPT_NAME = 'Automaio Lead Form'

export function buildFormEmbedScriptTag(formToken: string, apiUrl?: string) {
  const base = (apiUrl ?? getAppBaseUrl()).replace(/\/$/, '')
  return `<script src="${base}/webflow/form-embed.js" data-form-token="${formToken}" async></script>`
}

export function buildFormEmbedInlineScript(formToken: string, apiUrl?: string) {
  const base = (apiUrl ?? getAppBaseUrl()).replace(/\/$/, '')
  return `(function(){var s=document.createElement("script");s.src="${base}/webflow/form-embed.js";s.setAttribute("data-form-token","${formToken}");s.async=true;(document.body||document.documentElement).appendChild(s);})();`
}

type FormSettings = {
  successMessage?: string
  redirectUrl?: string
  notifyEmail?: string
  webflowIntegrationId?: string
  webflowPageId?: string
  webflowPageTitle?: string
}

export async function assignFormToWebflowPage(
  formId: string,
  options: { integrationId: string; pageId: string; pageTitle?: string; publishSite?: boolean },
) {
  const form = await prisma.leadForm.findUnique({ where: { id: formId } })
  if (!form) throw new Error('Form not found')

  const integration = await prisma.webflowIntegration.findUnique({
    where: { id: options.integrationId },
  })
  if (!integration) throw new Error('Webflow integration not found')

  const client = new WebflowClient(integration.webflowApiKey)
  const appUrl = getAppBaseUrl()
  const sourceCode = buildFormEmbedInlineScript(form.embedToken, appUrl)

  const registered = await client.registerInlineScript(integration.webflowSiteId, {
    sourceCode,
    displayName: `${FORM_SCRIPT_NAME} — ${form.name}`,
    version: FORM_SCRIPT_VERSION,
    canCopy: false,
  })

  const current = await client.getPageCustomCode(options.pageId)
  const scripts = (current.scripts ?? []).filter((s) => s.id !== registered.id)
  scripts.push({ id: registered.id, location: 'footer', version: FORM_SCRIPT_VERSION })
  await client.upsertPageCustomCode(options.pageId, scripts)

  const prevSettings = (form.settings as FormSettings | null) ?? {}
  await prisma.leadForm.update({
    where: { id: formId },
    data: {
      settings: {
        ...prevSettings,
        webflowIntegrationId: options.integrationId,
        webflowPageId: options.pageId,
        webflowPageTitle: options.pageTitle ?? prevSettings.webflowPageTitle,
      },
    },
  })

  if (options.publishSite) {
    await client.publishSite(integration.webflowSiteId)
  }

  return { scriptId: registered.id, pageId: options.pageId }
}
