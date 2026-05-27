'use client'

import { Loader2, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

const STEPS = [
  'Analyzing your brief…',
  'Writing marketing copy…',
  'Applying to template…',
  'Polishing content…',
]

type AiProgressOverlayProps = {
  open: boolean
  label?: string
  step?: number
}

export function AiProgressOverlay({ open, label = 'AI is generating content', step = 0 }: AiProgressOverlayProps) {
  if (!open) return null

  const currentStep = STEPS[Math.min(step, STEPS.length - 1)]

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md mx-4 rounded-2xl border border-zinc-700 bg-[#0c0c0e] p-8 shadow-2xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="relative mb-6">
            <div className="h-16 w-16 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Sparkles className="h-8 w-8 text-blue-400 animate-pulse" />
            </div>
            <Loader2 className="h-20 w-20 text-blue-500/30 animate-spin absolute inset-0 -m-2" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">{label}</h3>
          <p className="text-sm text-zinc-400 mb-6">{currentStep}</p>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full"
              initial={{ width: '5%' }}
              animate={{ width: `${Math.min(95, 20 + step * 22)}%` }}
              transition={{ duration: 0.6 }}
            />
          </div>
          <p className="text-[10px] text-zinc-600 mt-4 uppercase tracking-widest">This may take 30–60 seconds</p>
        </div>
      </motion.div>
    </div>
  )
}
