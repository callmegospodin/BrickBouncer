import { create } from 'zustand';

export type GameState = 'menu' | 'playing' | 'gameOver' | 'win';

interface GameStateStore {
  gameState: GameState;
  score: number;
  lives: number;
  level: number;
  
  // Actions
  startGame: () => void;
  restartGame: () => void;
  endGame: () => void;
  winGame: () => void;
  updateScore: (points: number) => void;
  decrementLives: () => void;
  advanceLevel: () => void;
}

export const useGameState = create<GameStateStore>((set) => ({
  gameState: 'menu',
  score: 0,
  lives: 3,
  level: 1,
  
  startGame: () => {
    set({ 
      gameState: 'playing',
      score: 0,
      lives: 3,
      level: 1
    });
  },
  
  restartGame: () => {
    set({ 
      gameState: 'playing',
      score: 0,
      lives: 3,
      level: 1
    });
  },
  
  endGame: () => {
    set({ gameState: 'gameOver' });
  },
  
  winGame: () => {
    set({ gameState: 'win' });
  },
  
  updateScore: (points) => {
    set((state) => ({ 
      score: state.score + points 
    }));
  },
  
  decrementLives: () => {
    set((state) => {
      const newLives = state.lives - 1;
      
      // If no lives left, game over
      if (newLives <= 0) {
        return {
          lives: 0,
          gameState: 'gameOver'
        };
      }
      
      return { lives: newLives };
    });
  },
  
  advanceLevel: () => {
    set((state) => {
      const newLevel = state.level + 1;
      
      // Win the game after completing level 5
      if (newLevel > 5) {
        return {
          level: 5,
          gameState: 'win'
        };
      }
      
      return { 
        level: newLevel
      };
    });
  }
}));
