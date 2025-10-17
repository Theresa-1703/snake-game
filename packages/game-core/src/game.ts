import { Direction, GameConfig, GameState, Point } from './types';

const opposite: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

export function createInitialState(config: GameConfig): GameState {
  const length = Math.max(3, config.initialLength ?? 4);
  const startX = Math.floor(config.cols / 2);
  const startY = Math.floor(config.rows / 2);
  const snake: Point[] = Array.from({ length }, (_, i) => ({ x: startX - i, y: startY }));

  const state: GameState = {
    snake,
    direction: 'right',
    food: { x: 0, y: 0 },
    score: 0,
    isGameOver: false,
    tick: 0,
  };
  state.food = spawnFood(config, state.snake);
  return state;
}

export function changeDirection(state: GameState, dir: Direction) {
  if (opposite[state.direction] === dir) return; // ignore 180° turns
  state.direction = dir;
}

export function step(config: GameConfig, state: GameState): GameState {
  if (state.isGameOver) return state;

  const head = state.snake[0];
  let nx = head.x;
  let ny = head.y;
  switch (state.direction) {
    case 'up': ny -= 1; break;
    case 'down': ny += 1; break;
    case 'left': nx -= 1; break;
    case 'right': nx += 1; break;
  }

  if (config.wrap) {
    nx = (nx + config.cols) % config.cols;
    ny = (ny + config.rows) % config.rows;
  }

  // Check wall collision when not wrapping
  if (!config.wrap && (nx < 0 || ny < 0 || nx >= config.cols || ny >= config.rows)) {
    return { ...state, isGameOver: true };
  }

  // Check self-collision (exclude last tail cell if we will move without eating)
  const newHead: Point = { x: nx, y: ny };
  const willEat = nx === state.food.x && ny === state.food.y;
  const bodyToCheck = willEat ? state.snake : state.snake.slice(0, -1);
  if (bodyToCheck.some(p => p.x === newHead.x && p.y === newHead.y)) {
    return { ...state, isGameOver: true };
  }

  const newSnake = [newHead, ...state.snake];
  if (!willEat) newSnake.pop();

  let newFood = state.food;
  let newScore = state.score;
  if (willEat) {
    newScore += 10;
    newFood = spawnFood(config, newSnake);
  }

  return {
    ...state,
    snake: newSnake,
    food: newFood,
    score: newScore,
    tick: state.tick + 1,
  };
}

export function spawnFood(config: GameConfig, snake: Point[]): Point {
  const occupied = new Set(snake.map(p => `${p.x},${p.y}`));
  const freeCells: Point[] = [];
  for (let y = 0; y < config.rows; y++) {
    for (let x = 0; x < config.cols; x++) {
      const key = `${x},${y}`;
      if (!occupied.has(key)) freeCells.push({ x, y });
    }
  }
  if (freeCells.length === 0) {
    // No space left – treat as win
    return { x: -1, y: -1 };
  }
  const idx = Math.floor(Math.random() * freeCells.length);
  return freeCells[idx];
}

