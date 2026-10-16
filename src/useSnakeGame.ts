import { useState, useCallback, useEffect, useRef } from 'react';

export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type Difficulty = 'easy' | 'medium' | 'hard';
export type GameState = 'idle' | 'playing' | 'paused' | 'gameover';

interface Position {
  x: number;
  y: number;
}

const GRID_SIZE = 20;

const SPEED_MAP: Record<Difficulty, number> = {
  easy: 180,
  medium: 120,
  hard: 70,
};

function randomColor(): string {
  const hue = Math.floor(Math.random() * 360);
  const saturation = 70 + Math.floor(Math.random() * 25);
  const lightness = 50 + Math.floor(Math.random() * 15);
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

function generateColors(count: number): string[] {
  return Array.from({ length: count }, () => randomColor());
}

function getRandomPosition(snake: Position[]): Position {
  let pos: Position;
  do {
    pos = {
      x: Math.floor(Math.random() * GRID_SIZE),
      y: Math.floor(Math.random() * GRID_SIZE),
    };
  } while (snake.some(s => s.x === pos.x && s.y === pos.y));
  return pos;
}

const INITIAL_SNAKE: Position[] = [
  { x: 10, y: 10 },
  { x: 9, y: 10 },
  { x: 8, y: 10 },
];

export function useSnakeGame() {
  const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
  const [snakeColors, setSnakeColors] = useState<string[]>(() => generateColors(INITIAL_SNAKE.length));
  const [food, setFood] = useState<Position>({ x: 15, y: 10 });
  const [direction, setDirection] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => {
    const saved = localStorage.getItem('snake-highscore');
    return saved ? parseInt(saved, 10) : 0;
  });
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [foodEaten, setFoodEaten] = useState(0);

  const directionRef = useRef<Direction>('RIGHT');
  const gameLoopRef = useRef<number | null>(null);
  const lastDirectionRef = useRef<Direction>('RIGHT');

  const resetGame = useCallback(() => {
    setSnake(INITIAL_SNAKE);
    setSnakeColors(generateColors(INITIAL_SNAKE.length));
    setFood(getRandomPosition(INITIAL_SNAKE));
    setDirection('RIGHT');
    directionRef.current = 'RIGHT';
    lastDirectionRef.current = 'RIGHT';
    setScore(0);
    setFoodEaten(0);
    setGameState('idle');
  }, []);

  const startGame = useCallback(() => {
    if (gameState === 'gameover' || gameState === 'idle') {
      setSnake(INITIAL_SNAKE);
      setSnakeColors(generateColors(INITIAL_SNAKE.length));
      setFood(getRandomPosition(INITIAL_SNAKE));
      setDirection('RIGHT');
      directionRef.current = 'RIGHT';
      lastDirectionRef.current = 'RIGHT';
      setScore(0);
      setFoodEaten(0);
    }
    setGameState('playing');
  }, [gameState]);

  const pauseGame = useCallback(() => {
    if (gameState === 'playing') {
      setGameState('paused');
    } else if (gameState === 'paused') {
      setGameState('playing');
    }
  }, [gameState]);

  const changeDirection = useCallback((newDir: Direction) => {
    const opposites: Record<Direction, Direction> = {
      UP: 'DOWN',
      DOWN: 'UP',
      LEFT: 'RIGHT',
      RIGHT: 'LEFT',
    };
    if (newDir !== opposites[lastDirectionRef.current]) {
      directionRef.current = newDir;
      setDirection(newDir);
    }
  }, []);

  const moveSnake = useCallback(() => {
    setSnake(prevSnake => {
      const head = { ...prevSnake[0] };
      const currentDir = directionRef.current;
      lastDirectionRef.current = currentDir;

      switch (currentDir) {
        case 'UP': head.y -= 1; break;
        case 'DOWN': head.y += 1; break;
        case 'LEFT': head.x -= 1; break;
        case 'RIGHT': head.x += 1; break;
      }

      // Check wall collision
      if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
        setGameState('gameover');
        return prevSnake;
      }

      // Check self collision
      if (prevSnake.some(s => s.x === head.x && s.y === head.y)) {
        setGameState('gameover');
        return prevSnake;
      }

      const newSnake = [head, ...prevSnake];

      // Check food
      if (head.x === food.x && head.y === food.y) {
        setScore(prev => {
          const newScore = prev + (difficulty === 'easy' ? 10 : difficulty === 'medium' ? 20 : 30);
          setHighScore(prevHigh => {
            if (newScore > prevHigh) {
              localStorage.setItem('snake-highscore', String(newScore));
              return newScore;
            }
            return prevHigh;
          });
          return newScore;
        });
        setFoodEaten(prev => prev + 1);
        setSnakeColors(prev => [...prev, randomColor()]);
        setFood(getRandomPosition(newSnake));
        return newSnake;
      }

      newSnake.pop();
      return newSnake;
    });
  }, [food, difficulty]);

  // Game loop
  useEffect(() => {
    if (gameState === 'playing') {
      const speed = SPEED_MAP[difficulty];
      gameLoopRef.current = window.setInterval(moveSnake, speed);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
    };
  }, [gameState, difficulty, moveSnake]);

  // Update high score on game over
  useEffect(() => {
    if (gameState === 'gameover') {
      setHighScore(prev => {
        if (score > prev) {
          localStorage.setItem('snake-highscore', String(score));
          return score;
        }
        return prev;
      });
    }
  }, [gameState, score]);

  return {
    snake,
    snakeColors,
    food,
    direction,
    gameState,
    score,
    highScore,
    difficulty,
    foodEaten,
    gridSize: GRID_SIZE,
    startGame,
    pauseGame,
    resetGame,
    changeDirection,
    setDifficulty,
  };
}
