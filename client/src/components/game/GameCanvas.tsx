import React, { useRef, useEffect } from 'react';
import Ball from './Ball';
import Paddle from './Paddle';
import Brick from './Brick';
import { useGameState } from '@/lib/stores/useGameState';
import useGameLogic from '@/hooks/useGameLogic';

const GameCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const {
    paddle,
    ball,
    bricks,
    dimensions,
    updatePaddlePosition,
    isPaused,
    togglePause
  } = useGameLogic();

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        updatePaddlePosition((prev) => Math.max(prev - 25, dimensions.paddleWidth / 2));
      } else if (e.key === 'ArrowRight') {
        updatePaddlePosition((prev) => 
          Math.min(prev + 25, dimensions.width - dimensions.paddleWidth / 2)
        );
      } else if (e.key === 'p' || e.key === 'P') {
        togglePause();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [dimensions.width, dimensions.paddleWidth, updatePaddlePosition, togglePause]);

  // Handle mouse movement
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (canvasRef.current) {
        const canvasBounds = canvasRef.current.getBoundingClientRect();
        const relativeX = e.clientX - canvasBounds.left;
        const paddleX = Math.max(
          dimensions.paddleWidth / 2,
          Math.min(relativeX, dimensions.width - dimensions.paddleWidth / 2)
        );
        updatePaddlePosition(paddleX);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
    };
  }, [dimensions.width, dimensions.paddleWidth, updatePaddlePosition]);

  const { gameState } = useGameState();

  // Don't render if not in playing state
  if (gameState !== 'playing') return null;

  return (
    <div 
      ref={canvasRef}
      className="relative bg-gray-900 rounded-md overflow-hidden"
      style={{ 
        width: `${dimensions.width}px`, 
        height: `${dimensions.height}px`,
        margin: '0 auto'
      }}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      >
        {/* Render bricks */}
        {bricks.map((brick) => (
          <Brick key={brick.id} brick={brick} />
        ))}

        {/* Render paddle */}
        <Paddle
          x={paddle.x}
          y={paddle.y}
          width={dimensions.paddleWidth}
          height={dimensions.paddleHeight}
          color={paddle.color}
        />

        {/* Render ball */}
        <Ball
          x={ball.x}
          y={ball.y}
          radius={ball.radius}
          color={ball.color}
        />
      </svg>

      {/* Pause overlay */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
          <div className="text-white text-2xl font-bold">PAUSED</div>
          <div className="text-white text-sm mt-2">Press 'P' to resume</div>
        </div>
      )}
    </div>
  );
};

export default GameCanvas;
