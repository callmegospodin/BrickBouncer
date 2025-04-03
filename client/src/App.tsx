import { useEffect } from "react";
import { useAudio } from "./lib/stores/useAudio";
import GameCanvas from "./components/game/GameCanvas";
import { useGameState } from "./lib/stores/useGameState";
import { Button } from "./components/ui/button";
import { Card } from "./components/ui/card";
import "@fontsource/inter";
import "./index.css";

function App() {
  const { 
    gameState, 
    score, 
    lives, 
    level,
    startGame, 
    restartGame
  } = useGameState();
  
  const { 
    setBackgroundMusic, 
    setHitSound, 
    setSuccessSound, 
    toggleMute, 
    isMuted 
  } = useAudio();

  // Load audio assets
  useEffect(() => {
    // Create audio elements
    const bgMusic = new Audio("/sounds/background.mp3");
    bgMusic.loop = true;
    bgMusic.volume = 0.3;

    const hitSfx = new Audio("/sounds/hit.mp3");
    hitSfx.volume = 0.5;

    const successSfx = new Audio("/sounds/success.mp3");
    successSfx.volume = 0.5;

    // Set audio in the store
    setBackgroundMusic(bgMusic);
    setHitSound(hitSfx);
    setSuccessSound(successSfx);

    return () => {
      // Clean up if needed
      bgMusic.pause();
      hitSfx.pause();
      successSfx.pause();
    };
  }, [setBackgroundMusic, setHitSound, setSuccessSound]);

  // Render the appropriate UI based on game state
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-indigo-900 to-blue-900 text-white p-4">
      <div className="w-full max-w-2xl">
        {/* Game header with score and controls */}
        <div className="flex justify-between items-center mb-4">
          <div className="text-2xl font-bold">Score: {score}</div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={toggleMute}
              className="text-white border-white hover:bg-white/20"
            >
              {isMuted ? "🔇 Unmute" : "🔊 Mute"}
            </Button>
            <div className="flex items-center gap-2">
              <span>❤️ {lives}</span>
              <span>Level: {level}</span>
            </div>
          </div>
        </div>

        {/* Game Canvas or Start/Game Over screens */}
        {gameState === "menu" && (
          <Card className="p-8 text-center bg-black/50 backdrop-blur-sm">
            <h1 className="text-4xl font-bold mb-6">BREAKOUT</h1>
            <p className="mb-6">Break all the bricks with the ball to win!</p>
            <p className="mb-6">Use the left and right arrow keys or mouse to move the paddle.</p>
            <Button 
              onClick={startGame}
              size="lg" 
              className="bg-green-600 hover:bg-green-700"
            >
              Start Game
            </Button>
          </Card>
        )}

        {gameState === "playing" && <GameCanvas />}

        {gameState === "gameOver" && (
          <Card className="p-8 text-center bg-black/50 backdrop-blur-sm">
            <h1 className="text-4xl font-bold mb-6">Game Over</h1>
            <p className="text-2xl mb-6">Final Score: {score}</p>
            <Button 
              onClick={restartGame} 
              size="lg"
              className="bg-blue-600 hover:bg-blue-700"
            >
              Play Again
            </Button>
          </Card>
        )}

        {gameState === "win" && (
          <Card className="p-8 text-center bg-black/50 backdrop-blur-sm">
            <h1 className="text-4xl font-bold mb-6">You Win!</h1>
            <p className="text-2xl mb-6">Final Score: {score}</p>
            <Button 
              onClick={restartGame} 
              size="lg"
              className="bg-purple-600 hover:bg-purple-700"
            >
              Play Again
            </Button>
          </Card>
        )}

        {/* Game instructions */}
        {gameState !== "playing" && (
          <div className="mt-8 text-center text-white/70">
            <p>Controls: Move paddle with mouse or arrow keys</p>
            <p>Break all bricks to win the level!</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
