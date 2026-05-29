'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buildCollectionTemplateBodySnippet } from '@/lib/webflow/collection-template-shell'
import { Check, Copy, Hammer, Loader2 } from 'lucide-react'

export function TemplateShellInstaller() {
  const [installing, setInstalling] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'info' | 'success' | 'error'>('info')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const data = event.data as { type?: string; result?: { ok?: boolean; error?: string } }
      if (data?.type !== 'automaio-install-template-shell-result') return
      setInstalling(false)
      if (data.result?.ok) {
        setMessageType('success')
        setMessage(
          'Template shell installed in Webflow. Turn ON Publish settings for this CMS template, then publish the site.',
        )
      } else {
        setMessageType('error')
        setMessage(
          data.result?.error
            ? `Install failed: ${data.result.error}. Select Body in the Navigator and try again, or paste the canvas snippet.`
            : 'Install failed. Select Body in the Navigator and try again, or paste the canvas snippet.',
        )
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const installViaDesigner = async () => {
    setInstalling(true)
    setMessage('')
    setMessageType('info')
    window.parent.postMessage({ type: 'automaio-install-template-shell' }, '*')
    setMessage('Installing template shell in Webflow Designer…')
  }

  const copySnippet = async () => {
    await navigator.clipboard.writeText(buildCollectionTemplateBodySnippet())
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 space-y-3">
      <div>
        <p className="text-xs font-semibold text-amber-200">Collection template shell required</p>
        <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">
          Blank collection templates return 404 for CMS item URLs. Install the SEO shell once — it uses
          Webflow {'{{wf}}'} bindings so split HTML/CSS is in the page source (good for SEO). Then publish
          the site in Webflow Designer.
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" className="h-8 text-[11px]" disabled={installing} onClick={() => void installViaDesigner()}>
          {installing ? <Loader2 className="size-3.5 animate-spin mr-1" /> : <Hammer className="size-3.5 mr-1" />}
          Install template shell
        </Button>
        <Button size="sm" variant="outline" className="h-8 text-[11px]" onClick={() => void copySnippet()}>
          {copied ? <Check className="size-3.5 mr-1" /> : <Copy className="size-3.5 mr-1" />}
          Copy canvas snippet
        </Button>
      </div>
      {message && (
        <Alert
          className={
            messageType === 'error'
              ? 'border-destructive/30 bg-destructive/5 py-2'
              : messageType === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/5 py-2'
                : 'border-primary/20 bg-primary/5 py-2'
          }
        >
          <AlertTitle className="text-xs">Designer</AlertTitle>
          <AlertDescription className="text-[11px]">{message}</AlertDescription>
        </Alert>
      )}
      <p className="text-[10px] text-muted-foreground">
        Open Pages → your CMS collection template → Settings → Publish settings ON, then publish the
        site. Republish from Automaio afterward with site publish enabled.
      </p>
    </div>
  )
}
