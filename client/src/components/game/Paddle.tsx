import React from 'react';

interface PaddleProps {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

const Paddle: React.FC<PaddleProps> = ({ x, y, width, height, color }) => {
  return (
    <rect
      x={x - width / 2}
      y={y}
      width={width}
      height={height}
      fill={color}
      rx={8}
      ry={8}
    />
  );
};

export default Paddle;
