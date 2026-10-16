import { useEffect, useRef, useCallback } from 'react';
import { useSnakeGame, Direction, Difficulty } from './useSnakeGame';

function App() {
  const {
    snake,
    snakeColors,
    food,
    gameState,
    score,
    highScore,
    difficulty,
    foodEaten,
    gridSize,
    startGame,
    pauseGame,
    resetGame,
    changeDirection,
    setDifficulty,
  } = useSnakeGame();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Canvas size calculation
  const getCanvasSize = useCallback(() => {
    const maxSize = Math.min(window.innerWidth - 32, window.innerHeight - 300, 500);
    return Math.max(280, maxSize);
  }, []);

  // Draw game
  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = getCanvasSize();
    canvas.width = size;
    canvas.height = size;
    const cellSize = size / gridSize;

    // Background
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, size, size);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(i * cellSize, 0);
      ctx.lineTo(i * cellSize, size);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i * cellSize);
      ctx.lineTo(size, i * cellSize);
      ctx.stroke();
    }

    // Food with glow
    const foodX = food.x * cellSize + cellSize / 2;
    const foodY = food.y * cellSize + cellSize / 2;
    const foodRadius = cellSize * 0.4;

    // Food glow
    const gradient = ctx.createRadialGradient(foodX, foodY, 0, foodX, foodY, cellSize);
    gradient.addColorStop(0, 'rgba(255, 107, 107, 0.3)');
    gradient.addColorStop(1, 'rgba(255, 107, 107, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(food.x * cellSize - cellSize / 2, food.y * cellSize - cellSize / 2, cellSize * 2, cellSize * 2);

    // Food circle
    ctx.beginPath();
    ctx.arc(foodX, foodY, foodRadius, 0, Math.PI * 2);
    ctx.fillStyle = '#ff6b6b';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(foodX - foodRadius * 0.3, foodY - foodRadius * 0.3, foodRadius * 0.2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.fill();

    // Snake
    snake.forEach((segment, index) => {
      const x = segment.x * cellSize;
      const y = segment.y * cellSize;
      const padding = 1;

      if (index === 0) {
        // Head
        ctx.fillStyle = '#00d4aa';
        ctx.shadowColor = '#00d4aa';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(x + padding, y + padding, cellSize - padding * 2, cellSize - padding * 2, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes
        const eyeSize = cellSize * 0.12;
        ctx.fillStyle = '#1a1a2e';
        let eye1X: number, eye1Y: number, eye2X: number, eye2Y: number;
        const cx = x + cellSize / 2;
        const cy = y + cellSize / 2;
        
        // Direction-based eye placement
        if (snake.length > 1) {
          const next = snake[1];
          const dx = segment.x - next.x;
          const dy = segment.y - next.y;
          if (dx > 0) { // Moving right
            eye1X = cx + cellSize * 0.2; eye1Y = cy - cellSize * 0.2;
            eye2X = cx + cellSize * 0.2; eye2Y = cy + cellSize * 0.2;
          } else if (dx < 0) { // Moving left
            eye1X = cx - cellSize * 0.2; eye1Y = cy - cellSize * 0.2;
            eye2X = cx - cellSize * 0.2; eye2Y = cy + cellSize * 0.2;
          } else if (dy > 0) { // Moving down
            eye1X = cx - cellSize * 0.2; eye1Y = cy + cellSize * 0.2;
            eye2X = cx + cellSize * 0.2; eye2Y = cy + cellSize * 0.2;
          } else { // Moving up
            eye1X = cx - cellSize * 0.2; eye1Y = cy - cellSize * 0.2;
            eye2X = cx + cellSize * 0.2; eye2Y = cy - cellSize * 0.2;
          }
        } else {
          eye1X = cx + cellSize * 0.15; eye1Y = cy - cellSize * 0.15;
          eye2X = cx + cellSize * 0.15; eye2Y = cy + cellSize * 0.15;
        }
        ctx.beginPath();
        ctx.arc(eye1X, eye1Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(eye2X, eye2Y, eyeSize, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Each segment has a random unique color
        const color = snakeColors[index] || `hsl(${(index * 37) % 360}, 80%, 55%)`;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.roundRect(x + padding + 1, y + padding + 1, cellSize - (padding + 1) * 2, cellSize - (padding + 1) * 2, 3);
        ctx.fill();

        // Subtle shine on each block
        ctx.fillStyle = `rgba(255, 255, 255, 0.18)`;
        ctx.beginPath();
        ctx.roundRect(x + padding + 2, y + padding + 2, (cellSize - (padding + 1) * 2) * 0.5, (cellSize - (padding + 1) * 2) * 0.35, 2);
        ctx.fill();
      }
    });

    // Overlay for non-playing states
    if (gameState === 'paused') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${size * 0.08}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('ПАУЗА', size / 2, size / 2 - 10);
      ctx.font = `${size * 0.04}px system-ui`;
      ctx.fillStyle = '#a29bfe';
      ctx.fillText('Нажмите для продолжения', size / 2, size / 2 + 25);
    }

    if (gameState === 'gameover') {
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
      ctx.fillRect(0, 0, size, size);
      ctx.fillStyle = '#ff6b6b';
      ctx.font = `bold ${size * 0.07}px system-ui`;
      ctx.textAlign = 'center';
      ctx.fillText('ИГРА ОКОНЧЕНА', size / 2, size / 2 - 30);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${size * 0.05}px system-ui`;
      ctx.fillText(`Счёт: ${score}`, size / 2, size / 2 + 15);
      ctx.font = `${size * 0.035}px system-ui`;
      ctx.fillStyle = '#a29bfe';
      ctx.fillText('Нажмите для перезапуска', size / 2, size / 2 + 50);
    }
  }, [snake, snakeColors, food, gameState, gridSize, score, getCanvasSize]);

  // Animation frame
  useEffect(() => {
    let animId: number;
    const animate = () => {
      drawGame();
      animId = requestAnimationFrame(animate);
    };
    animate();
    return () => cancelAnimationFrame(animId);
  }, [drawGame]);

  // Resize handler
  useEffect(() => {
    const handleResize = () => drawGame();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [drawGame]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const keyMap: Record<string, Direction> = {
        ArrowUp: 'UP',
        ArrowDown: 'DOWN',
        ArrowLeft: 'LEFT',
        ArrowRight: 'RIGHT',
        w: 'UP',
        s: 'DOWN',
        a: 'LEFT',
        d: 'RIGHT',
        W: 'UP',
        S: 'DOWN',
        A: 'LEFT',
        D: 'RIGHT',
      };

      if (keyMap[e.key]) {
        e.preventDefault();
        if (gameState === 'playing') {
          changeDirection(keyMap[e.key]);
        }
      }

      if (e.key === ' ' || e.key === 'Escape') {
        e.preventDefault();
        if (gameState === 'playing' || gameState === 'paused') {
          pauseGame();
        } else if (gameState === 'idle') {
          startGame();
        } else if (gameState === 'gameover') {
          resetGame();
          setTimeout(() => startGame(), 50);
        }
      }

      if (e.key === 'Enter') {
        e.preventDefault();
        if (gameState === 'idle' || gameState === 'gameover') {
          if (gameState === 'gameover') resetGame();
          setTimeout(() => startGame(), 50);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, changeDirection, pauseGame, startGame, resetGame]);

  // Touch/swipe controls
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.changedTouches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;
    const minSwipe = 30;

    if (Math.abs(dx) < minSwipe && Math.abs(dy) < minSwipe) {
      // Tap
      if (gameState === 'idle') {
        startGame();
      } else if (gameState === 'gameover') {
        resetGame();
        setTimeout(() => startGame(), 50);
      } else if (gameState === 'playing' || gameState === 'paused') {
        pauseGame();
      }
      touchStartRef.current = null;
      return;
    }

    if (gameState !== 'playing') {
      touchStartRef.current = null;
      return;
    }

    if (Math.abs(dx) > Math.abs(dy)) {
      changeDirection(dx > 0 ? 'RIGHT' : 'LEFT');
    } else {
      changeDirection(dy > 0 ? 'DOWN' : 'UP');
    }
    touchStartRef.current = null;
  }, [gameState, changeDirection, pauseGame, startGame, resetGame]);

  // D-pad button handler
  const handleDPad = useCallback((dir: Direction) => {
    if (gameState === 'playing') {
      changeDirection(dir);
    }
  }, [gameState, changeDirection]);

  const difficulties: { key: Difficulty; label: string; emoji: string }[] = [
    { key: 'easy', label: 'Легко', emoji: '🌱' },
    { key: 'medium', label: 'Средне', emoji: '🔥' },
    { key: 'hard', label: 'Сложно', emoji: '💀' },
  ];

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-4 gap-3 overflow-hidden">
      {/* Header */}
      <div className="w-full max-w-[540px] flex items-center justify-between animate-slide-up">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🐍</span>
          <h1 className="text-xl font-bold bg-gradient-to-r from-green-400 to-purple-400 bg-clip-text text-transparent">
            Змейка
          </h1>
        </div>
        <div className="flex gap-2">
          {gameState === 'playing' || gameState === 'paused' ? (
            <button
              onClick={pauseGame}
              className="btn-game px-3 py-1.5 rounded-lg bg-purple-600/30 border border-purple-500/40 text-sm font-medium hover:bg-purple-600/50"
            >
              {gameState === 'paused' ? '▶ Продолжить' : '⏸ Пауза'}
            </button>
          ) : null}
          {gameState !== 'idle' && (
            <button
              onClick={() => { resetGame(); }}
              className="btn-game px-3 py-1.5 rounded-lg bg-red-600/30 border border-red-500/40 text-sm font-medium hover:bg-red-600/50"
            >
              🔄 Заново
            </button>
          )}
        </div>
      </div>

      {/* Score Panel */}
      <div className="w-full max-w-[540px] flex gap-3 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="score-display flex-1 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-purple-300 opacity-80">Счёт</div>
          <div className="text-2xl font-bold text-white">{score}</div>
        </div>
        <div className="score-display flex-1 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-green-300 opacity-80">Рекорд</div>
          <div className="text-2xl font-bold text-green-400">{highScore}</div>
        </div>
        <div className="score-display flex-1 rounded-xl px-4 py-2 text-center">
          <div className="text-xs text-yellow-300 opacity-80">Еда</div>
          <div className="text-2xl font-bold text-yellow-400">{foodEaten}</div>
        </div>
      </div>

      {/* Difficulty Selector */}
      <div className="flex gap-2 animate-slide-up" style={{ animationDelay: '0.15s' }}>
        {difficulties.map(d => (
          <button
            key={d.key}
            onClick={() => {
              if (gameState !== 'playing') {
                setDifficulty(d.key);
              }
            }}
            disabled={gameState === 'playing'}
            className={`difficulty-btn px-4 py-1.5 rounded-lg text-sm font-medium border transition-all
              ${difficulty === d.key
                ? 'active border-purple-400'
                : 'border-gray-600 bg-gray-800/50 text-gray-400 hover:border-gray-500'
              }
              ${gameState === 'playing' ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            `}
          >
            {d.emoji} {d.label}
          </button>
        ))}
      </div>

      {/* Game Canvas */}
      <div
        ref={containerRef}
        className="relative animate-fade-in"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <canvas
          ref={canvasRef}
          className="game-canvas"
          style={{ width: getCanvasSize(), height: getCanvasSize() }}
        />
        
        {/* Start overlay */}
        {gameState === 'idle' && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-xl animate-fade-in">
            <div className="text-5xl mb-4">🐍</div>
            <h2 className="text-2xl font-bold text-white mb-2">Змейка</h2>
            <p className="text-purple-300 text-sm mb-4 text-center px-4">
              Управление: стрелки / WASD / свайпы
            </p>
            <button
              onClick={() => startGame()}
              className="btn-game px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-lg"
            >
              ▶ Начать игру
            </button>
            <p className="text-gray-500 text-xs mt-3">или нажмите Пробел / Enter</p>
          </div>
        )}
      </div>

      {/* Mobile D-Pad Controls */}
      <div className="md:hidden animate-slide-up" style={{ animationDelay: '0.2s' }}>
        <div className="grid grid-cols-3 gap-2 w-[200px] mx-auto">
          <div></div>
          <button
            className="touch-btn"
            onTouchStart={(e) => { e.preventDefault(); handleDPad('UP'); }}
            onClick={() => handleDPad('UP')}
          >
            ▲
          </button>
          <div></div>
          <button
            className="touch-btn"
            onTouchStart={(e) => { e.preventDefault(); handleDPad('LEFT'); }}
            onClick={() => handleDPad('LEFT')}
          >
            ◀
          </button>
          <button
            className="touch-btn"
            onTouchStart={(e) => { e.preventDefault(); pauseGame(); }}
            onClick={pauseGame}
          >
            {gameState === 'paused' ? '▶' : '⏸'}
          </button>
          <button
            className="touch-btn"
            onTouchStart={(e) => { e.preventDefault(); handleDPad('RIGHT'); }}
            onClick={() => handleDPad('RIGHT')}
          >
            ▶
          </button>
          <div></div>
          <button
            className="touch-btn"
            onTouchStart={(e) => { e.preventDefault(); handleDPad('DOWN'); }}
            onClick={() => handleDPad('DOWN')}
          >
            ▼
          </button>
          <div></div>
        </div>
      </div>

      {/* Footer hint */}
      <div className="text-center text-xs text-gray-500 hidden md:block animate-slide-up" style={{ animationDelay: '0.25s' }}>
        <span>⌨️ Стрелки/WASD — движение</span>
        <span className="mx-2">|</span>
        <span>⏸ Пробел/Esc — пауза</span>
        <span className="mx-2">|</span>
        <span>🔄 Enter — рестарт</span>
      </div>
    </div>
  );
}

export default App;
