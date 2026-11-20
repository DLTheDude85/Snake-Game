// game.js
// Entry point and main game loop. Ties together the snake, food, input, and grid modules,
// and manages the game's state (start screen -> playing -> game over), score, and high score.

import { update as updateSnake, draw as drawSnake, resetSnake, SNAKE_SPEED, getSnakeHead, snakeIntersection } from './snake.js'
import { update as updateFood, draw as drawFood, resetFood } from './food.js'
import { outsideGrid } from './grid.js'
import { hasDirectionInput, consumeActionPress, resetInput } from './input.js'
import { playEat, playNewBest, playGameOver, playStart, isMuted, toggleMuted } from './sound.js'

// ---------- Settings ----------
const SCORE_PER_FOOD = 10              // points earned for each piece of food
const RESTART_DELAY_MS = 600           // after dying, ignore restart input briefly so a
                                       // frantic key press doesn't skip the game over screen
const HIGH_SCORE_KEY = 'snake-high-score' // name used to save the high score in the browser

// ---------- Game state ----------
// The game is always in exactly one of these three states.
const STATE = { READY: 'ready', PLAYING: 'playing', OVER: 'over' }
let state = STATE.READY

let lastRenderTime = 0  // timestamp (ms) of the last time the game actually updated
let gameOverTime = 0    // timestamp (ms) of when the player died
let score = 0
let highScore = loadHighScore()

// The high score as it was when this game began. We compare against this to know
// whether the player has beaten their old record (highScore itself rises during play).
let bestAtStart = highScore

// True once the "new best" celebration has played during this game.
let celebratedThisGame = false

// ---------- Page elements (defined in index.html) ----------
const gameBoard = document.getElementById('game-board')
const scoreElement = document.getElementById('score')
const highScoreElement = document.getElementById('high-score')
const overlay = document.getElementById('overlay')
const overlayTitle = document.getElementById('overlay-title')
const overlayDetail = document.getElementById('overlay-detail')
const overlayPrompt = document.getElementById('overlay-prompt')
const soundButton = document.getElementById('sound-button')
const celebrationElement = document.getElementById('celebration')

// True on phones/tablets (touch screens), so on-screen text can say "tap/swipe" instead of keys.
const isTouchDevice = window.matchMedia('(pointer: coarse)').matches

// Tapping/clicking the overlay does the same thing as pressing Space (start / play again).
overlay.addEventListener('click', handleAction)

// The sound button turns sound effects on/off.
soundButton.addEventListener('click', () => {
  toggleMuted()
  updateSoundButton()
  soundButton.blur() // so pressing Space afterwards doesn't re-trigger the button
})

// ---------- Main loop ----------
// The browser calls this before every screen repaint (~60x/sec) with the current time in ms.
function main(currentTime) {
  // Schedule the next frame so the loop keeps running.
  window.requestAnimationFrame(main)

  // Space / Enter: start the game, or play again after a game over.
  if (consumeActionPress()) handleAction()

  // On the start screen, pressing any direction (arrows, WASD, swipe) starts the game.
  if (state === STATE.READY && hasDirectionInput()) startGame(currentTime)

  // Nothing else to do unless a game is in progress.
  if (state !== STATE.PLAYING) return

  // The screen repaints much faster than the snake should move, so skip this
  // frame unless enough time has passed (1 / SNAKE_SPEED seconds per move).
  const secondsSinceLastRender = (currentTime - lastRenderTime) / 1000
  if (secondsSinceLastRender < 1 / SNAKE_SPEED) return

  lastRenderTime = currentTime

  // One game "tick": update the game state, then redraw it.
  update()
  draw()
}

// Initial setup: show the starting board and score, then kick off the loop.
updateScoreDisplay()
updateSoundButton()
showOverlay(
  'SNAKE',
  isTouchDevice ? 'Swipe to steer' : 'Arrow keys, WASD or swipe to steer',
  isTouchDevice ? 'Swipe or tap to start' : 'Press a direction to start'
)
draw()
window.requestAnimationFrame(main)

// ---------- Game flow ----------

// Update all game state for one tick.
function update() {
  updateSnake()                              // move the snake
  if (updateFood()) {                        // check if food was eaten
    const brokeRecord = addScore(SCORE_PER_FOOD)
    // Beating the high score plays its own fanfare instead of the normal eat sound.
    if (brokeRecord) playNewBest()
    else playEat()
  }
  if (checkDeath()) endGame()                // check for wall or self collision
}

// Clear the board and redraw everything from the current game state.
function draw() {
  gameBoard.innerHTML = ''
  drawSnake(gameBoard)
  drawFood(gameBoard)
}

// The player loses by hitting a wall or running into their own body.
function checkDeath() {
  return outsideGrid(getSnakeHead()) || snakeIntersection()
}

// Handles Space / Enter / tap, depending on the current state.
function handleAction() {
  if (state === STATE.READY) {
    startGame(performance.now())
  } else if (state === STATE.OVER && performance.now() - gameOverTime >= RESTART_DELAY_MS) {
    resetGame()
    startGame(performance.now())
  }
}

// Begin play: hide the overlay and start the tick timer.
function startGame(currentTime) {
  state = STATE.PLAYING
  lastRenderTime = currentTime
  bestAtStart = highScore          // remember the record to beat this game
  celebratedThisGame = false
  hideOverlay()
  playStart()
}

// Put everything back to a fresh game (used when restarting after a game over).
// This replaces the old "reload the page" restart, so it works wherever the game is hosted.
function resetGame() {
  resetSnake()
  resetFood()
  resetInput()
  score = 0
  updateScoreDisplay()
  gameBoard.classList.remove('game-over')
  celebrationElement.classList.remove('active')
  highScoreElement.classList.remove('pulse')
  draw()
}

// The player died: save the high score and show the game over screen.
function endGame() {
  state = STATE.OVER
  gameOverTime = performance.now()
  gameBoard.classList.add('game-over')
  playGameOver()

  // The high score itself was already updated (and saved) the moment it was beaten.
  const isNewBest = score > bestAtStart

  overlay.classList.add('over') // makes the title red (see index.html)
  showOverlay(
    'GAME OVER',
    isNewBest ? `New best: ${score}!` : `Score: ${score}   Best: ${highScore}`,
    isTouchDevice ? 'Tap to play again' : 'Press Space or tap to play again'
  )
}

// ---------- Score ----------

// Adds points. If this pushes the score past the high score, the high score rises with it.
// Returns true if the player just beat a previous record (so the caller can play the fanfare).
function addScore(points) {
  score += points

  let brokeRecord = false
  if (score > highScore) {
    highScore = score
    saveHighScore(highScore)

    // bestAtStart > 0 skips the celebration on a player's very first game,
    // when every single point would otherwise count as a "new record".
    if (bestAtStart > 0) {
      brokeRecord = true
      // The screen flash and banner only play the first time the record is passed.
      if (!celebratedThisGame) {
        celebratedThisGame = true
        celebrateNewBest()
      }
    }
  }

  updateScoreDisplay()
  return brokeRecord
}

// Flashes the screen gold, shows a "NEW BEST!" banner, and pulses the BEST number.
function celebrateNewBest() {
  restartAnimation(celebrationElement, 'active')
  restartAnimation(highScoreElement, 'pulse')
}

// Adds a CSS class that triggers an animation, restarting it if it's already running.
// (Reading offsetWidth forces the browser to notice the class was removed first.)
function restartAnimation(element, className) {
  element.classList.remove(className)
  void element.offsetWidth
  element.classList.add(className)
}

// Shows scores padded to 4 digits, arcade style (e.g. 0030).
function updateScoreDisplay() {
  scoreElement.textContent = String(score).padStart(4, '0')
  highScoreElement.textContent = String(highScore).padStart(4, '0')
}

// The high score is saved in the browser so it survives page reloads.
// try/catch because storage can be unavailable (e.g. private browsing modes).
function loadHighScore() {
  try {
    return Number(localStorage.getItem(HIGH_SCORE_KEY)) || 0
  } catch {
    return 0
  }
}

function saveHighScore(value) {
  try {
    localStorage.setItem(HIGH_SCORE_KEY, String(value))
  } catch {
    // Not being able to save is fine; the high score just lasts for this visit.
  }
}

// ---------- Sound button ----------

// Updates the button's label to match whether sound is on or off.
function updateSoundButton() {
  const muted = isMuted()
  soundButton.textContent = muted ? 'SOUND: OFF' : 'SOUND: ON'
  soundButton.setAttribute('aria-pressed', String(!muted)) // for screen readers
}

// ---------- Overlay (start / game over screen) ----------

function showOverlay(title, detail, prompt) {
  overlayTitle.textContent = title
  overlayDetail.textContent = detail
  overlayPrompt.textContent = prompt
  overlay.hidden = false
}

function hideOverlay() {
  overlay.hidden = true
  overlay.classList.remove('over')
}
