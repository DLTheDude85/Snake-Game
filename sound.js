// sound.js
// Sound effects, generated in the browser with the Web Audio API (no audio files needed).
// Also remembers whether the player has muted the game.

const MUTE_KEY = 'snake-muted' // name used to save the mute setting in the browser
const VOLUME = 0.12            // overall loudness (0 to 1). Kept low so it isn't harsh.

let audioContext = null
let muted = loadMuted()

// Browsers only allow audio after the player interacts with the page (tap, click, key press).
// We create/resume the audio engine on the first interaction so later sounds can play.
function unlockAudio() {
  if (!audioContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext // webkit = older Safari
    if (!AudioContextClass) return // browser has no audio support; the game still works silently
    audioContext = new AudioContextClass()
  }
  if (audioContext.state === 'suspended') audioContext.resume()
}

window.addEventListener('keydown', unlockAudio)
window.addEventListener('pointerdown', unlockAudio)
window.addEventListener('touchend', unlockAudio, { passive: true })

// Plays one beep.
//   frequency: pitch in Hz (higher = higher pitch)
//   startOffset: seconds from now before the beep begins
//   duration: how long the beep lasts, in seconds
//   type: wave shape ('square' = chiptune, 'sawtooth' = buzzy, 'triangle' = soft)
//   endFrequency: optional pitch to slide to during the beep
function playTone(frequency, startOffset, duration, type = 'square', endFrequency = frequency) {
  if (muted || !audioContext || audioContext.state !== 'running') return

  const start = audioContext.currentTime + startOffset
  const oscillator = audioContext.createOscillator()
  const gain = audioContext.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, start)
  oscillator.frequency.linearRampToValueAtTime(endFrequency, start + duration)

  // Fade the volume out so each beep ends smoothly instead of clicking.
  gain.gain.setValueAtTime(VOLUME, start)
  gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

  oscillator.connect(gain)
  gain.connect(audioContext.destination)
  oscillator.start(start)
  oscillator.stop(start + duration)
}

// ---------- Sound effects ----------

// Short rising "blip" when the snake eats.
export function playEat() {
  playTone(520, 0, 0.07)
  playTone(780, 0.07, 0.1)
}

// Bright rising fanfare when the player beats their high score.
export function playNewBest() {
  playTone(523, 0, 0.08, 'square')     // C
  playTone(659, 0.08, 0.08, 'square')  // E
  playTone(784, 0.16, 0.08, 'square')  // G
  playTone(1047, 0.24, 0.25, 'square') // high C
}

// Descending buzz when the player dies.
export function playGameOver() {
  playTone(330, 0, 0.18, 'sawtooth')
  playTone(247, 0.18, 0.18, 'sawtooth')
  playTone(165, 0.36, 0.4, 'sawtooth', 110)
}

// Quick upward chirp when a game starts.
export function playStart() {
  playTone(392, 0, 0.08, 'triangle')
  playTone(587, 0.08, 0.12, 'triangle')
}

// ---------- Mute control ----------

export function isMuted() {
  return muted
}

// Flips mute on/off, saves the choice, and returns the new state.
export function toggleMuted() {
  muted = !muted
  saveMuted(muted)
  unlockAudio()
  if (!muted) playTone(660, 0, 0.1) // small confirmation beep when sound is turned back on
  return muted
}

// The mute choice is saved in the browser so it's remembered next visit.
// try/catch because storage can be unavailable (e.g. some private browsing modes).
function loadMuted() {
  try {
    return localStorage.getItem(MUTE_KEY) === 'true'
  } catch {
    return false
  }
}

function saveMuted(value) {
  try {
    localStorage.setItem(MUTE_KEY, String(value))
  } catch {
    // Not being able to save is fine; the setting just lasts for this visit.
  }
}
