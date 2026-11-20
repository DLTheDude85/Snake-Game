// food.js
// Handles the food: where it spawns, what happens when it's eaten, and drawing it.

import { onSnake, expandSnake } from './snake.js'
import { randomGridPosition } from './grid.js'

// Current food position as { x, y }. Starts at a random open cell.
let food = getRandomFoodPosition()

// How many segments the snake grows by each time it eats.
const EXPANSION_RATE = 5

// Moves the food to a new random open cell (used when restarting).
export function resetFood() {
  food = getRandomFoodPosition()
}

// Runs once per game tick: if the snake is on the food, grow and respawn the food.
// Returns true if the food was eaten this tick (game.js uses this to add score).
export function update() {
  if (onSnake(food)) {
    expandSnake(EXPANSION_RATE)
    food = getRandomFoodPosition()
    return true
  }
  return false
}

// Creates the food <div> and places it on the CSS grid.
export function draw(gameBoard) {
  const foodElement = document.createElement('div')
  foodElement.style.gridRowStart = food.y
  foodElement.style.gridColumnStart = food.x
  foodElement.classList.add('food') // styled in index.html
  gameBoard.appendChild(foodElement)
}

// Picks random cells until it finds one the snake isn't occupying,
// so food never spawns underneath the snake.
function getRandomFoodPosition() {
  let newFoodPosition
  while (newFoodPosition == null || onSnake(newFoodPosition)) {
    newFoodPosition = randomGridPosition()
  }
  return newFoodPosition
}
