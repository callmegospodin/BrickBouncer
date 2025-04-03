import React from 'react';

export interface BrickType {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  broken: boolean;
  points: number;
}

interface BrickProps {
  brick: BrickType;
}

const Brick: React.FC<BrickProps> = ({ brick }) => {
  // Don't render broken bricks
  if (brick.broken) return null;

  return (
    <rect
      x={brick.x}
      y={brick.y}
      width={brick.width}
      height={brick.height}
      fill={brick.color}
      stroke="#000"
      strokeWidth={1}
      rx={2}
      ry={2}
    />
  );
};

export default Brick;
