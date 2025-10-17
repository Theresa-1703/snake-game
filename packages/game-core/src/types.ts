export type Point = { x: number; y: number };

export type Direction = 'up' | 'down' | 'left' | 'right';

export type GameConfig = {
  cols: number;
  rows: number;
  initialLength?: number; // starting snake length
  wrap?: boolean; // if true, snake wraps at edges
};

export type GameState = {
  snake: Point[]; // head is at index 0
  direction: Direction;
  food: Point;
  score: number;
  isGameOver: boolean;
  tick: number;
};

