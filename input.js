// input.js
// Handles all player input: keyboard (arrows + WASD), touch swipes, and the
// "action" button (Space / Enter) used to start or restart the game.
// It only records what the player asked for; game.js and snake.js decide what to do with it.

// Maps a lowercase key name to a direction.
// x: -1 = left, 1 = right | y: -1 = up, 1 = down
const KEY_DIRECTIONS = {
  arrowup:    { x: 0, y: -1 },
  w:          { x: 0, y: -1 },
  arrowdown:  { x: 0, y: 1 },
  s:          { x: 0, y: 1 },
  arrowleft:  { x: -1, y: 0 },
  a:          { x: -1, y: 0 },
  arrowright: { x: 1, y: 0 },
  d:          { x: 1, y: 0 }
}

// Keys that start / restart the game. (The Space bar's key name is a single space.)
const ACTION_KEYS = [' ', 'enter']

// How far (in pixels) a finger must move before it counts as a swipe.
const SWIPE_THRESHOLD = 30

// The direction the player has requested most recently.
// { x: 0, y: 0 } means "not moving yet" (before the first key press).
let inputDirection = { x: 0, y: 0 }

// The direction the snake actually moved on the last game tick.
// We compare against this (not inputDirection) to block 180-degree turns,
// so quickly pressing two keys in one tick can't make the snake reverse into itself.
let lastInputDirection = { x: 0, y: 0 }

// True when Space/Enter was pressed and game.js hasn't handled it yet.
let actionPressed = false

// Where the current touch started (used to measure swipes).
let touchStartX = 0
let touchStartY = 0

// Accepts a requested direction unless it would reverse the snake onto itself.
// Example: if the snake is moving horizontally, left/right requests are ignored.
function requestDirection(newDirection) {
  if (newDirection.x !== 0 && lastInputDirection.x !== 0) return
  if (newDirection.y !== 0 && lastInputDirection.y !== 0) return
  inputDirection = newDirection
}

// ---------- Keyboard ----------
window.addEventListener('keydown', e => {
  // Leave browser shortcuts (Ctrl+R, Cmd+W, etc.) alone.
  if (e.ctrlKey || e.metaKey || e.altKey) return

  const key = e.key.toLowerCase()

  const direction = KEY_DIRECTIONS[key]
  if (direction) {
    e.preventDefault() // stops the arrow keys from scrolling the page
    requestDirection(direction)
    return
  }

  if (ACTION_KEYS.includes(key)) {
    e.preventDefault() // stops Space from scrolling the page
    if (!e.repeat) actionPressed = true // ignore held-down key repeats
  }
})

// ---------- Touch (swipe) ----------
window.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].clientX
  touchStartY = e.changedTouches[0].clientY
}, { passive: true })

window.addEventListener('touchmove', e => {
  const touch = e.changedTouches[0]
  const dx = touch.clientX - touchStartX
  const dy = touch.clientY - touchStartY

  // Not far enough yet to count as a swipe.
  if (Math.max(Math.abs(dx), Math.abs(dy)) < SWIPE_THRESHOLD) return

  // The larger movement decides whether the swipe was horizontal or vertical.
  if (Math.abs(dx) > Math.abs(dy)) {
    requestDirection({ x: dx > 0 ? 1 : -1, y: 0 })
  } else {
    requestDirection({ x: 0, y: dy > 0 ? 1 : -1 })
  }

  // Start measuring a fresh swipe from here, so the player can chain turns
  // without lifting their finger.
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}, { passive: true })

// ---------- Functions used by other modules ----------

// Called once per game tick by snake.js.
// Records the direction we're about to move in, then returns it.
export function getInputDirection() {
  lastInputDirection = inputDirection
  return inputDirection
}

// True once the player has pressed a direction (used by game.js to start the game).
export function hasDirectionInput() {
  return inputDirection.x !== 0 || inputDirection.y !== 0
}

// Returns true if Space/Enter was pressed since the last call, then clears the flag.
export function consumeActionPress() {
  const wasPressed = actionPressed
  actionPressed = false
  return wasPressed
}

// Clears all saved input (used when a new game starts).
export function resetInput() {
  inputDirection = { x: 0, y: 0 }
  lastInputDirection = { x: 0, y: 0 }
  actionPressed = false
}
