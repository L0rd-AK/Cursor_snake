import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const GRID_SIZE = 20;
const CELL_SIZE = 20;
const INITIAL_SNAKE_LENGTH = 5;
const SPACING = 10; // number of frames delay between segments

const App = () => {
  // Game states: countdown (null = not started, >0 = countdown, 0 = playing)
  const [countdown, setCountdown] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const [target, setTarget] = useState(null);
  const [snakeLength, setSnakeLength] = useState(INITIAL_SNAKE_LENGTH);
  const [food, setFood] = useState({
    x: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
    y: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
  });
  // Path of the head positions; the snake segments will follow this path.
  const [path, setPath] = useState([]);
  const gameBoardRef = useRef(null);
  const animationRef = useRef(null);

  // Update target on mouse move (only when game is active)
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!gameBoardRef.current || gameOver || countdown !== 0) return;
      const rect = gameBoardRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      setTarget({ x: mouseX, y: mouseY });
      // If this is the first move, initialize the path with the cursor position.
      if (path.length === 0) {
        setPath([{ x: mouseX, y: mouseY }]);
      }
    };

    const board = gameBoardRef.current;
    if (board) {
      board.addEventListener('mousemove', handleMouseMove);
    }
    return () => {
      if (board) board.removeEventListener('mousemove', handleMouseMove);
    };
  }, [gameOver, countdown, path]);

  // Countdown effect before starting the game
  useEffect(() => {
    if (countdown === null) return;
    if (countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Main update loop: update the head's position by appending to the path.
  const updateSnake = () => {
    if (gameOver) return;
    if (countdown !== 0) {
      animationRef.current = requestAnimationFrame(updateSnake);
      return;
    }
    if (!target) {
      animationRef.current = requestAnimationFrame(updateSnake);
      return;
    }

    setPath(prevPath => {
      let newHead;
      if (prevPath.length === 0) {
        newHead = target;
      } else {
        const head = prevPath[prevPath.length - 1];
        const dx = target.x - head.x;
        const dy = target.y - head.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const speed = 5; // pixels per frame
        if (distance > speed) {
          newHead = { 
            x: head.x + (dx / distance) * speed, 
            y: head.y + (dy / distance) * speed 
          };
        } else {
          newHead = target;
        }
      }

      // Boundary collision check
      if (
        newHead.x < 0 ||
        newHead.x > GRID_SIZE * CELL_SIZE ||
        newHead.y < 0 ||
        newHead.y > GRID_SIZE * CELL_SIZE
      ) {
        setGameOver(true);
        return prevPath;
      }

      // Append the new head position to the path
      return [...prevPath, newHead];
    });
    animationRef.current = requestAnimationFrame(updateSnake);
  };

  useEffect(() => {
    animationRef.current = requestAnimationFrame(updateSnake);
    return () => cancelAnimationFrame(animationRef.current);
  }, [target, countdown, gameOver]);

  // Compute snake segment positions by sampling the path with a delay.
  const snakeSegments = [];
  for (let i = 0; i < snakeLength; i++) {
    // Use a delay based on the segment index
    const index = Math.max(path.length - 1 - i * SPACING, 0);
    const pos = path[index] || { x: 0, y: 0 };
    snakeSegments.push(pos);
  }

  // Check for food collision: if the head is close enough, grow the snake and reposition food
  useEffect(() => {
    if (path.length === 0) return;
    const head = path[path.length - 1];
    if (Math.abs(head.x - food.x) < CELL_SIZE && Math.abs(head.y - food.y) < CELL_SIZE) {
      setSnakeLength(prev => prev + 1);
      setFood({
        x: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
        y: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
      });
    }
  }, [path, food]);

  // Start game: reset states and begin countdown
  const startGame = () => {
    setGameOver(false);
    setCountdown(3);
    setSnakeLength(INITIAL_SNAKE_LENGTH);
    setPath([]);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
      y: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
    });
    setTarget(null);
  };

  // Reset game to initial state
  const resetGame = () => {
    setGameOver(false);
    setCountdown(null);
    setSnakeLength(INITIAL_SNAKE_LENGTH);
    setPath([]);
    setFood({
      x: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
      y: Math.floor(Math.random() * GRID_SIZE) * CELL_SIZE,
    });
    setTarget(null);
  };

  // Calculate score as snake length minus the initial snake length.
  const score = snakeLength - INITIAL_SNAKE_LENGTH;

  return (
    <div className="App">
      <h1>Snake Game</h1>
      {/* Score display */}
      <div style={{ fontSize: '1.5rem', marginBottom: '10px' }}>Score: {score}</div>
      <div
        ref={gameBoardRef}
        className="game-board"
        style={{
          width: GRID_SIZE * CELL_SIZE,
          height: GRID_SIZE * CELL_SIZE,
          position: 'relative',
          overflow: 'hidden',
          border: '1px solid black',
          margin: '0 auto',
          backgroundColor: '#222'
        }}
      >
        {snakeSegments.map((segment, index) => (
          <div
            key={index}
            className="snake-segment"
            style={{
              position: 'absolute',
              left: segment.x,
              top: segment.y,
              width: CELL_SIZE,
              height: CELL_SIZE,
              backgroundColor: index === 0 ? 'green' : 'lightgreen',
              borderRadius: '50%',
              transition: 'left 0.1s linear, top 0.1s linear',
            }}
          />
        ))}
        <div
          className="food"
          style={{
            position: 'absolute',
            left: food.x,
            top: food.y,
            width: CELL_SIZE,
            height: CELL_SIZE,
            backgroundColor: 'red',
            borderRadius: '50%',
          }}
        />
        {/* Countdown overlay */}
        {countdown !== null && countdown > 0 && (
          <div
            className="countdown"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '5rem',
              color: 'white'
            }}
          >
            {countdown}
          </div>
        )}
        {/* Start overlay (shown before the game begins) */}
        {countdown === null && !gameOver && (
          <div
            className="start-overlay"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.5)',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              flexDirection: 'column',
              color: 'white',
              fontSize: '2rem',
            }}
          >
            <p>Click "Start Game" to begin</p>
            <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '1.5rem' }}>
              Start Game
            </button>
          </div>
        )}
        {/* Game Over overlay */}
        {gameOver && (
          <div
            className="game-over"
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.7)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              color: 'white'
            }}
          >
            <h2>Game Over!</h2>
            <button onClick={resetGame} style={{ padding: '10px 20px', fontSize: '1.5rem' }}>
              Play Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
