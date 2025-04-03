import { useState, useEffect, useCallback, useRef } from 'react';
import { useGameState } from '@/lib/stores/useGameState';
import { BrickType } from '@/components/game/Brick';
import { useAudio } from '@/lib/stores/useAudio';

// Game dimensions and constants
const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;
const PADDLE_WIDTH = 100;
const PADDLE_HEIGHT = 15;
const BALL_RADIUS = 8;
const BRICK_ROWS = 5;
const BRICK_COLS = 10;
const BRICK_HEIGHT = 25;
const BRICK_GAP = 5;
const BALL_SPEED_INITIAL = 5;
const BALL_SPEED_INCREMENT = 0.5;

// Calculate brick width based on game width, columns and gaps
const BRICK_WIDTH = (GAME_WIDTH - (BRICK_COLS + 1) * BRICK_GAP) / BRICK_COLS;

// Paddle starting position
const PADDLE_START_Y = GAME_HEIGHT - 30;

// Ball starting position (centered above paddle)
const BALL_START_X = GAME_WIDTH / 2;
const BALL_START_Y = PADDLE_START_Y - BALL_RADIUS - 5;

// Brick colors based on row
const BRICK_COLORS = [
  '#FF5252', // Red
  '#FF9800', // Orange
  '#FFEB3B', // Yellow
  '#4CAF50', // Green
  '#2196F3', // Blue
];

// Brick point values based on row (top rows worth more)
const BRICK_POINTS = [50, 40, 30, 20, 10];

interface Position {
  x: number;
  y: number;
}

interface Velocity {
  dx: number;
  dy: number;
}

interface GameDimensions {
  width: number;
  height: number;
  paddleWidth: number;
  paddleHeight: number;
}

const useGameLogic = () => {
  // Get game state management functions
  const { 
    updateScore, 
    decrementLives, 
    endGame, 
    winGame, 
    gameState,
    advanceLevel,
    level
  } = useGameState();

  // Get audio functions
  const { playHit, playSuccess } = useAudio();

  // Game objects state
  const [paddle, setPaddle] = useState({
    x: GAME_WIDTH / 2,
    y: PADDLE_START_Y,
    color: '#FFFFFF',
  });

  const [ball, setBall] = useState({
    x: BALL_START_X,
    y: BALL_START_Y,
    radius: BALL_RADIUS,
    color: '#FFFFFF',
  });

  const [ballVelocity, setBallVelocity] = useState<Velocity>({
    dx: 0,
    dy: 0,
  });

  // Generate bricks based on level
  const generateBricks = useCallback(() => {
    const bricks: BrickType[] = [];
    let id = 0;

    // Adjust difficulty based on level
    const rows = Math.min(BRICK_ROWS + Math.floor(level / 2), 8);

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < BRICK_COLS; col++) {
        bricks.push({
          id: id++,
          x: col * (BRICK_WIDTH + BRICK_GAP) + BRICK_GAP,
          y: row * (BRICK_HEIGHT + BRICK_GAP) + BRICK_GAP + 50, // Start 50px from top
          width: BRICK_WIDTH,
          height: BRICK_HEIGHT,
          color: BRICK_COLORS[row % BRICK_COLORS.length],
          broken: false,
          points: BRICK_POINTS[row % BRICK_POINTS.length],
        });
      }
    }
    return bricks;
  }, [level]);

  const [bricks, setBricks] = useState<BrickType[]>([]);
  const [dimensions] = useState<GameDimensions>({
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    paddleWidth: PADDLE_WIDTH,
    paddleHeight: PADDLE_HEIGHT,
  });

  const [isPaused, setIsPaused] = useState(false);
  const lastTimeRef = useRef<number | null>(null);
  const animationFrameIdRef = useRef<number>(0);

  // Initialize bricks when level changes
  useEffect(() => {
    if (gameState === 'playing') {
      setBricks(generateBricks());
      
      // Reset ball position and initial velocity
      setBall({
        x: BALL_START_X,
        y: BALL_START_Y,
        radius: BALL_RADIUS,
        color: '#FFFFFF',
      });

      // Set initial ball velocity with increased speed for higher levels
      const speed = BALL_SPEED_INITIAL + (level - 1) * BALL_SPEED_INCREMENT;
      const angle = Math.PI / 4 + (Math.random() * Math.PI / 2); // Random launch angle between 45° and 135°
      setBallVelocity({
        dx: speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1), // Randomize left/right
        dy: -speed, // Always go up initially
      });
    }
  }, [gameState, level, generateBricks]);

  // Update paddle position (used by keyboard/mouse controls)
  const updatePaddlePosition = useCallback((newX: number | ((prev: number) => number)) => {
    setPaddle(prev => {
      const updatedX = typeof newX === 'function' ? newX(prev.x) : newX;
      return { ...prev, x: updatedX };
    });
  }, []);

  // Toggle pause state
  const togglePause = useCallback(() => {
    setIsPaused(prev => !prev);
  }, []);

  // Check for collisions between ball and other game objects
  const checkCollisions = useCallback((ballPos: Position, ballVel: Velocity) => {
    const { x, y } = ballPos;
    let { dx, dy } = ballVel;
    let collided = false;

    // Wall collisions
    if (x - BALL_RADIUS <= 0 || x + BALL_RADIUS >= dimensions.width) {
      dx = -dx; // Reverse horizontal direction
      collided = true;
    }

    // Ceiling collision
    if (y - BALL_RADIUS <= 0) {
      dy = -dy; // Reverse vertical direction
      collided = true;
    }

    // Paddle collision
    if (
      y + BALL_RADIUS >= paddle.y &&
      y - BALL_RADIUS <= paddle.y + dimensions.paddleHeight &&
      x >= paddle.x - dimensions.paddleWidth / 2 &&
      x <= paddle.x + dimensions.paddleWidth / 2
    ) {
      // Calculate ball position relative to paddle center (-1 to 1)
      const hitPosition = (x - paddle.x) / (dimensions.paddleWidth / 2);
      
      // Change angle based on where ball hits the paddle
      // Center hits bounce straight up, edges bounce at angles
      const bounceAngle = hitPosition * (Math.PI / 3); // Up to 60 degrees
      
      // Calculate speed from current velocity
      const speed = Math.sqrt(dx * dx + dy * dy);
      
      // Apply new direction
      dx = speed * Math.sin(bounceAngle);
      dy = -speed * Math.cos(bounceAngle); // Always bounce upward
      
      collided = true;
    }

    // Check if ball falls below paddle (lose life)
    if (y + BALL_RADIUS >= dimensions.height) {
      decrementLives();
      
      // Reset ball and paddle
      setBall({
        x: BALL_START_X,
        y: BALL_START_Y,
        radius: BALL_RADIUS,
        color: '#FFFFFF',
      });
      
      setPaddle(prev => ({
        ...prev,
        x: GAME_WIDTH / 2,
      }));
      
      // New ball velocity
      const speed = BALL_SPEED_INITIAL + (level - 1) * BALL_SPEED_INCREMENT;
      const angle = Math.PI / 4 + (Math.random() * Math.PI / 2);
      
      return {
        dx: speed * Math.cos(angle) * (Math.random() > 0.5 ? 1 : -1),
        dy: -speed,
        collided: true
      };
    }

    // Brick collisions
    let brickHit = false;
    let updatedBricks = [...bricks];
    
    for (let i = 0; i < updatedBricks.length; i++) {
      const brick = updatedBricks[i];
      
      if (!brick.broken && 
          x + BALL_RADIUS >= brick.x && 
          x - BALL_RADIUS <= brick.x + brick.width && 
          y + BALL_RADIUS >= brick.y && 
          y - BALL_RADIUS <= brick.y + brick.height) {
        
        // Determine collision side (top/bottom or left/right)
        const centerX = brick.x + brick.width / 2;
        const centerY = brick.y + brick.height / 2;
        
        // Check if collision is more horizontal or vertical
        // by comparing the differences in positions
        const dx = Math.abs(x - centerX) / (brick.width / 2);
        const dy = Math.abs(y - centerY) / (brick.height / 2);
        
        if (dx > dy) {
          // Horizontal collision (sides)
          ballVel.dx = -ballVel.dx;
        } else {
          // Vertical collision (top/bottom)
          ballVel.dy = -ballVel.dy;
        }
        
        // Mark brick as broken
        updatedBricks[i] = { ...brick, broken: true };
        
        // Update score
        updateScore(brick.points);
        
        // Play hit sound
        playHit();
        
        brickHit = true;
        collided = true;
        break; // Only hit one brick per frame
      }
    }
    
    if (brickHit) {
      setBricks(updatedBricks);
      
      // Check if all bricks are broken (win level)
      const allBricksBroken = updatedBricks.every(brick => brick.broken);
      if (allBricksBroken) {
        playSuccess();
        advanceLevel();
      }
    }

    if (collided) {
      playHit();
    }

    return { dx, dy, collided };
  }, [bricks, paddle, dimensions, updateScore, decrementLives, playHit, playSuccess, advanceLevel, level]);

  // Game update loop
  useEffect(() => {
    if (gameState !== 'playing' || isPaused) {
      // Cancel animation if not playing or paused
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      lastTimeRef.current = null;
      return;
    }

    const updateGame = (time: number) => {
      if (lastTimeRef.current === null) {
        lastTimeRef.current = time;
        animationFrameIdRef.current = requestAnimationFrame(updateGame);
        return;
      }

      const deltaTime = time - lastTimeRef.current;
      lastTimeRef.current = time;

      // Update ball position based on velocity
      setBall(prevBall => {
        const newX = prevBall.x + ballVelocity.dx;
        const newY = prevBall.y + ballVelocity.dy;
        
        // Check collisions with new position
        const { dx, dy, collided } = checkCollisions(
          { x: newX, y: newY },
          { dx: ballVelocity.dx, dy: ballVelocity.dy }
        );
        
        // Update velocity if collision occurred
        if (collided) {
          setBallVelocity({ dx, dy });
        }
        
        return {
          ...prevBall,
          x: newX,
          y: newY,
        };
      });

      animationFrameIdRef.current = requestAnimationFrame(updateGame);
    };

    // Start the animation loop
    animationFrameIdRef.current = requestAnimationFrame(updateGame);

    // Clean up on component unmount
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [gameState, ballVelocity, checkCollisions, isPaused]);

  return {
    paddle,
    ball,
    bricks,
    dimensions,
    updatePaddlePosition,
    isPaused,
    togglePause,
  };
};

export default useGameLogic;
