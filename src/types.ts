export enum Direction {
  North = 0,
  East = 1,
  South = 2,
  West = 3,
}

export enum CommandType {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
  JumpUp = 'JUMP_UP',
  JumpDown = 'JUMP_DOWN',
  JumpLeft = 'JUMP_LEFT',
  JumpRight = 'JUMP_RIGHT',
}

export interface Position {
  x: number;
  y: number;
}

export type ObstacleType = 'rock' | 'water' | 'mud' | 'wall' | 'fire' | 'forest';

export interface Obstacle extends Position {
  description?: string;
  type?: ObstacleType;
}

export type TutorialTrigger = 'none' | 'add_block' | 'click_run' | 'win';

export interface TutorialStep {
  message: string;
  trigger: TutorialTrigger;
  requiredBlock?: CommandType; // If trigger is add_block
  highlightElementId?: string; // ID of DOM element to highlight
}

export interface LevelConfig {
  id: number;
  name: string;
  gridSize: number;
  start: Position;
  startDirection: Direction;
  goal: Position;
  obstacles: Obstacle[];
  description: string;
  tutorialSteps?: TutorialStep[];
}

export interface CommandBlock {
  id: string; // Unique ID for the instance of the block
  type: CommandType;
}

export interface SimulationStep {
  position: Position;
  direction: Direction;
  commandIndex: number;
  status: 'running' | 'crashed' | 'goal' | 'bounds';
}

export type Language = 'km' | 'en';