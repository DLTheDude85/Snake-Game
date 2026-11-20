// snake.js
// Everything about the snake: its body, movement, growth, drawing, and collision checks.

import { getInputDirection } from "./input.js"
import { outsideGrid } from "./grid.js"

// How many times per second the snake moves (higher = faster game).
export const SNAKE_SPEED = 5

// Where the snake starts: the center cell of the 21x21 grid.
const START_POSITION = { x: 11, y: 11 }

// The snake is an array of { x, y } grid cells.
// Index 0 is the head; the last item is the tail.
const snakeBody = [{ ...START_POSITION }]

// How many segments the snake still needs to grow (added on the next update).
let newSegments = 0

// Puts the snake back to a single segment in the center (used when restarting).
export function resetSnake() {
  snakeBody.length = 0
  snakeBody.push({ ...START_POSITION })
  newSegments = 0
}

// Runs once per game tick: grows the snake if needed, then moves it one cell.
export function update() {
  addSegments()

  const inputDirection = getInputDirection()

  // Move the body: starting from the tail, each segment takes the position of the
  // segment in front of it. (Copies are used so segments don't share one object.)
  for (let i = snakeBody.length - 2; i >= 0; i--) {
    snakeBody[i + 1] = { ...snakeBody[i] }
  }

  // Finally, move the head one cell in the current direction.
  snakeBody[0].x += inputDirection.x
  snakeBody[0].y += inputDirection.y
}

// Creates one <div> per body segment and places it on the CSS grid.
export function draw(gameBoard) {
  snakeBody.forEach((segment, index) => {
    // After hitting a wall the head is off the board. CSS grid can't place it
    // there (and would stretch the board trying), so just don't draw it.
    if (outsideGrid(segment)) return

    const snakeElement = document.createElement('div')
    snakeElement.style.gridRowStart = segment.y
    snakeElement.style.gridColumnStart = segment.x
    snakeElement.classList.add('snake') // styled in index.html
    if (index === 0) snakeElement.classList.add('head') // head gets its own look
    gameBoard.appendChild(snakeElement)
  })
}

// Queue up extra segments (called by food.js when the snake eats).
// Growth is applied gradually in addSegments() on the next update.
export function expandSnake(amount) {
  newSegments += amount
}

// Returns true if the given position overlaps any part of the snake.
// Pass { ignoreHead: true } to skip the head (used for self-collision checks).
export function onSnake(position, { ignoreHead = false } = {}) {
  return snakeBody.some((segment, index) => {
    if (ignoreHead && index === 0) return false
    return equalPositions(segment, position)
  })
}

// Returns the head segment (used by game.js for wall-collision checks).
export function getSnakeHead() {
  return snakeBody[0]
}

// Returns true if the head is touching any other part of the snake body.
export function snakeIntersection() {
  return onSnake(snakeBody[0], { ignoreHead: true })
}

// Returns true if two { x, y } positions are the same cell.
function equalPositions(pos1, pos2) {
  return pos1.x === pos2.x && pos1.y === pos2.y
}

// Adds any queued segments to the end of the snake.
// New segments start on top of the current tail, then spread out as the snake moves.
function addSegments() {
  for (let i = 0; i < newSegments; i++) {
    snakeBody.push({ ...snakeBody[snakeBody.length - 1] })
  }

  newSegments = 0
}
