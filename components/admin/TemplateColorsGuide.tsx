import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Palette } from 'lucide-react'

export function TemplateColorsGuide() {
  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Palette className="size-4" />
      <AlertTitle>How brand colors work in templates</AlertTitle>
      <AlertDescription className="space-y-2 text-sm">
        <p>
          Colors you set below are saved on the theme and injected into HTML when publishing to
          Webflow. You do not set these inside Webflow Designer first.
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Built-in layouts</strong> — use classes <code className="text-xs">.cta</code>,{' '}
            <code className="text-xs">.badge</code>, <code className="text-xs">.card</code>; colors
            apply automatically.
          </li>
          <li>
            <strong>Your own HTML</strong> — in CSS use{' '}
            <code className="text-xs">var(--automaio-primary)</code>,{' '}
            <code className="text-xs">var(--automaio-primary-text)</code>,{' '}
            <code className="text-xs">var(--automaio-bg)</code>,{' '}
            <code className="text-xs">var(--automaio-text)</code>,{' '}
            <code className="text-xs">var(--automaio-muted)</code>.
          </li>
          <li>
            Example:{' '}
            <code className="text-xs block mt-1 p-2 bg-muted rounded">
              {`.my-button { background: var(--automaio-primary); color: var(--automaio-primary-text); }`}
            </code>
          </li>
        </ul>
        <p className="text-muted-foreground">
          Campaign copy is written by AI from the user&apos;s launch brief — you only define layout
          + colors here, not <code className="text-xs">{'{{placeholders}}'}</code>.
        </p>
      </AlertDescription>
    </Alert>
  )
}
