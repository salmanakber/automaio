'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IndustrySelect } from '@/components/ui/industry-select'

interface CampaignBuilderProps {
  onSubmit: (data: Record<string, unknown>) => void
  loading?: boolean
}

export function CampaignBuilder({ onSubmit, loading }: CampaignBuilderProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    launchBrief: '',
    industry: '',
    targetAudience: '',
    goals: [] as string[],
    tone: 'professional',
    style: 'modern',
  })
  const [goalInput, setGoalInput] = useState('')

  const handleAddGoal = () => {
    if (goalInput.trim()) {
      setFormData({
        ...formData,
        goals: [...formData.goals, goalInput.trim()],
      })
      setGoalInput('')
    }
  }

  const handleRemoveGoal = (index: number) => {
    setFormData({
      ...formData,
      goals: formData.goals.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = () => {
    if (
      formData.name &&
      formData.industry &&
      formData.targetAudience &&
      formData.goals.length > 0 &&
      formData.launchBrief.trim()
    ) {
      onSubmit({
        ...formData,
        description: formData.launchBrief.trim(),
      })
    }
  }

  const totalSteps = 3

  return (
    <div className="bg-card rounded-lg border p-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">New campaign</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Describe your launch — AI generates the landing page. Use Email templates separately for email content.
        </p>
        <div className="flex gap-2">
          {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
            <div
              key={s}
              className={`h-2 flex-1 rounded-full ${step >= s ? 'bg-primary' : 'bg-muted'}`}
            />
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <h3 className="font-semibold">1. Launch brief</h3>
          <div>
            <Label htmlFor="campaign-name">Campaign name</Label>
            <Input
              id="campaign-name"
              className="mt-1"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., Q2 product launch"
            />
          </div>
          <div>
            <Label htmlFor="launch-brief">What are you launching?</Label>
            <Textarea
              id="launch-brief"
              className="mt-1 min-h-32"
              value={formData.launchBrief}
              onChange={(e) => setFormData({ ...formData, launchBrief: e.target.value })}
              placeholder="Product name, offer, key benefits, who it's for, tone, deadlines…"
            />
          </div>
          <Button
            onClick={() => setStep(2)}
            disabled={!formData.name || !formData.launchBrief.trim()}
            className="w-full"
          >
            Continue
          </Button>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <h3 className="font-semibold">2. Audience</h3>
          <div>
            <Label>Industry</Label>
            <IndustrySelect
              allowEmpty
              className="mt-1"
              value={formData.industry}
              onChange={(industry) => setFormData({ ...formData, industry })}
            />
          </div>
          <div>
            <Label>Target audience</Label>
            <Input
              className="mt-1"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="e.g., Webflow freelancers, SMB marketers"
            />
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={() => setStep(3)}
              disabled={!formData.industry || !formData.targetAudience}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <h3 className="font-semibold">3. Goals</h3>
          <div>
            <Label>Campaign goals</Label>
            <div className="flex gap-2 mb-3 mt-1">
              <Input
                value={goalInput}
                onChange={(e) => setGoalInput(e.target.value)}
                placeholder="Add a goal…"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddGoal()
                  }
                }}
              />
              <Button onClick={handleAddGoal} type="button" variant="outline">
                Add
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.goals.map((goal, index) => (
                <div
                  key={index}
                  className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm flex items-center gap-2"
                >
                  {goal}
                  <button
                    type="button"
                    onClick={() => handleRemoveGoal(index)}
                    className="hover:opacity-70"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading || formData.goals.length === 0}
              className="flex-1"
            >
              {loading ? 'Creating…' : 'Create & generate page'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
