'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { buildCollectionTemplateBodySnippet } from '@/lib/webflow/collection-template-shell'
import { Check, Copy, Hammer, Loader2 } from 'lucide-react'

export function TemplateShellInstaller() {
  const [installing, setInstalling] = useState(false)
  const [message, setMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const installViaDesigner = async () => {
    setInstalling(true)
    setMessage('')
    try {
      window.parent.postMessage({ type: 'automaio-install-template-shell' }, '*')
      setMessage(
        'Install request sent to Webflow Designer. If nothing happens, select the Body element on your collection template and try again.',
      )
    } finally {
      setInstalling(false)
    }
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
          Blank collection templates return 404 for CMS item URLs. Webflow needs at least one element
          on the canvas. Install the Automaio shell once, then publish the site in Webflow Designer.
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
        <Alert className="border-primary/20 bg-primary/5 py-2">
          <AlertTitle className="text-xs">Designer</AlertTitle>
          <AlertDescription className="text-[11px]">{message}</AlertDescription>
        </Alert>
      )}
      <p className="text-[10px] text-muted-foreground">
        Also check Pages → CMS template → Settings → Publish settings is ON, then publish the site.
      </p>
    </div>
  )
}
