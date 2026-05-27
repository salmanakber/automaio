'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function Home() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b bg-card/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">Automaio</h1>
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline">Sign In</Button>
            </Link>
            <Link href="/auth/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className="max-w-7xl mx-auto px-6 py-24 text-center">
        <p className="text-sm font-medium text-primary mb-4">Built for Webflow</p>
        <h2 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          Schedule & publish
          <br />
          <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Webflow content automatically
          </span>
        </h2>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Pick a template, publish to your CMS, and go live — no code, no copy-paste.
          Works with your existing Webflow collections.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Link href="/auth/signup">
            <Button size="lg" className="text-base">
              Publish your first page free
            </Button>
          </Link>
          <Link href="#how-it-works">
            <Button size="lg" variant="outline" className="text-base">
              See how it works
            </Button>
          </Link>
        </div>
        <p className="text-xs text-muted-foreground mt-4">First live publish in under 5 minutes</p>
      </section>

      <section id="how-it-works" className="max-w-7xl mx-auto px-6 py-16">
        <h3 className="text-2xl font-bold text-center mb-12">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { step: '1', title: 'Connect Webflow', desc: 'One-click OAuth. Works with your existing CMS collections.' },
            { step: '2', title: 'Pick a template', desc: 'Choose from prebuilt designs. Customize headline and copy.' },
            { step: '3', title: 'Publish live', desc: 'Automaio saves to CMS, installs embed, and publishes your site.' },
          ].map((item) => (
            <div key={item.step} className="text-center p-6 rounded-xl border bg-card">
              <div className="size-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center mx-auto mb-4">
                {item.step}
              </div>
              <h4 className="font-semibold mb-2">{item.title}</h4>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="features" className="max-w-7xl mx-auto px-6 py-24">
        <h3 className="text-3xl font-bold text-center mb-4">Everything you need</h3>
        <p className="text-center text-muted-foreground mb-16 max-w-xl mx-auto">
          One dashboard for CMS content, email, lead forms, and scheduling.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[
            {
              icon: '🚀',
              title: 'One-click Webflow publish',
              description: 'Templates go live automatically. No manual embed code required.',
            },
            {
              icon: '📅',
              title: 'Smart scheduling',
              description: 'Schedule blog posts, CMS entries, and emails — daily, weekly, or custom.',
            },
            {
              icon: '🎨',
              title: 'Template gallery',
              description: 'Prebuilt landing pages for SaaS, ecommerce, agencies, and more.',
            },
            {
              icon: '📝',
              title: 'Lead forms',
              description: 'Build dynamic forms and embed them on any Webflow page.',
            },
            {
              icon: '🔗',
              title: 'Works with your CMS',
              description: 'Auto-maps to your existing Webflow fields. No rebuild required.',
            },
            {
              icon: '⚡',
              title: 'Designer extension',
              description: 'Manage content from inside Webflow Designer.',
            },
          ].map((feature, i) => (
            <div key={i} className="bg-card rounded-lg border p-6 hover:border-primary/50 transition-colors">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h4 className="text-lg font-semibold mb-2">{feature.title}</h4>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="bg-gradient-to-r from-primary/20 to-primary/5 rounded-2xl border border-primary/20 p-12 text-center">
          <h3 className="text-3xl font-bold mb-4">Ready to go live on Webflow?</h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            Connect your site and publish your first template in minutes. No credit card required.
          </p>
          <Link href="/auth/signup">
            <Button size="lg" className="text-base">
              Start free
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t bg-card/50 py-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Automaio. Built for Webflow.</p>
        </div>
      </footer>
    </div>
  )
}
