/** Subtle UI tones for visual editor actions (Web Audio API). */
let ctx: AudioContext | null = null

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  try {
    ctx = ctx ?? new AudioContext()
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  } catch {
    return null
  }
}

export type EditorSound = 'select' | 'insert' | 'delete' | 'change'

const FREQ: Record<EditorSound, number> = {
  select: 540,
  insert: 720,
  delete: 280,
  change: 420,
}

export function playEditorSound(sound: EditorSound) {
  const ac = getCtx()
  if (!ac) return
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = sound === 'delete' ? 'sawtooth' : 'sine'
  osc.frequency.value = FREQ[sound]
  gain.gain.value = 0.055
  osc.connect(gain)
  gain.connect(ac.destination)
  const t = ac.currentTime
  osc.start(t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14)
  osc.stop(t + 0.14)
}
