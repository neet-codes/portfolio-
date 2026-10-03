/**
 * Web Audio Ambient Soundscape Engine
 * Self-contained luxury synthesizer pad with distance-modulated filter.
 */
class AmbientAudioEngine {
  constructor() {
    this.ctx = null
    this.osc1 = null
    this.osc2 = null
    this.osc3 = null
    this.filter = null
    this.mainGain = null
    this.isPlaying = false
  }

  init() {
    if (this.ctx) return
    const AudioContext = window.AudioContext || window.webkitAudioContext
    this.ctx = new AudioContext()

    this.mainGain = this.ctx.createGain()
    this.mainGain.gain.setValueAtTime(0, this.ctx.currentTime)

    // Biquad filter for smooth acoustic depth
    this.filter = this.ctx.createBiquadFilter()
    this.filter.type = 'lowpass'
    this.filter.frequency.setValueAtTime(320, this.ctx.currentTime)
    this.filter.Q.setValueAtTime(3, this.ctx.currentTime)

    // 3 rich analog-modeled oscillators (F1, C2, G2 chord)
    this.osc1 = this.ctx.createOscillator()
    this.osc1.type = 'sine'
    this.osc1.frequency.setValueAtTime(87.31, this.ctx.currentTime) // F2

    this.osc2 = this.ctx.createOscillator()
    this.osc2.type = 'triangle'
    this.osc2.frequency.setValueAtTime(130.81, this.ctx.currentTime) // C3

    this.osc3 = this.ctx.createOscillator()
    this.osc3.type = 'sine'
    this.osc3.frequency.setValueAtTime(196.00, this.ctx.currentTime) // G3

    // Connect oscillators -> filter -> gain -> destination
    this.osc1.connect(this.filter)
    this.osc2.connect(this.filter)
    this.osc3.connect(this.filter)

    this.filter.connect(this.mainGain)
    this.mainGain.connect(this.ctx.destination)

    this.osc1.start()
    this.osc2.start()
    this.osc3.start()
  }

  toggle() {
    if (!this.ctx) {
      this.init()
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume()
    }

    const now = this.ctx.currentTime
    if (!this.isPlaying) {
      this.mainGain.gain.cancelScheduledValues(now)
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now)
      this.mainGain.gain.linearRampToValueAtTime(0.18, now + 1.2) // gentle fade-in
      this.isPlaying = true
    } else {
      this.mainGain.gain.cancelScheduledValues(now)
      this.mainGain.gain.setValueAtTime(this.mainGain.gain.value, now)
      this.mainGain.gain.linearRampToValueAtTime(0.0001, now + 0.8) // smooth fade-out
      this.isPlaying = false
    }

    return this.isPlaying
  }

  modulateWithDistance(distance, isEyeContact) {
    if (!this.isPlaying || !this.filter || !this.ctx) return
    const now = this.ctx.currentTime

    // When eye contact engages, filter blooms with warm resonance
    const targetFreq = isEyeContact ? 880 : Math.max(260, 600 - distance * 0.4)
    this.filter.frequency.setTargetAtTime(targetFreq, now, 0.1)
  }
}

export const audioEngine = new AmbientAudioEngine()
