import React from 'react';

interface BallProps {
  x: number;
  y: number;
  radius: number;
  color: string;
}

const Ball: React.FC<BallProps> = ({ x, y, radius, color }) => {
  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={color}
    />
  );
};

export default Ball;
