// grid.js
// Helpers for the game board's grid (position generation and boundary checks).

// The board is a square grid of GRID_SIZE x GRID_SIZE cells.
// NOTE: this must match the "repeat(21, 1fr)" values in index.html's CSS.
const GRID_SIZE = 21

// Returns a random { x, y } cell on the board.
// CSS grid lines start at 1 (not 0), so we add 1 to get a range of 1..GRID_SIZE.
export function randomGridPosition() {
  return {
    x: Math.floor(Math.random() * GRID_SIZE) + 1,
    y: Math.floor(Math.random() * GRID_SIZE) + 1
  }
}

// Returns true if the given { x, y } position is off the board.
// Used to detect when the snake has hit a wall.
export function outsideGrid(position) {
  return (
    position.x < 1 || position.x > GRID_SIZE ||
    position.y < 1 || position.y > GRID_SIZE
  )
}
