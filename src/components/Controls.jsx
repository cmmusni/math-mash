import { useCallback } from 'react';
import useGameState from '../hooks/useGameState';
import * as gameStore from '../store/gameStore';
import '../styles/Controls.css';

export default function Controls() {
  const { gameState, resetGame } = useGameState();

  const handleRestart = useCallback(() => {
    if (window.confirm('Restart the current level?')) {
      const mode = gameState.gameMode;
      const op = gameState.operation;
      gameStore.clearGameState(mode);
      resetGame();
      // Re-enter the same mode (triggers remount via key change)
      gameStore.setGameMode(mode, op);
    }
  }, [resetGame, gameState.gameMode, gameState.operation]);

  const handleHome = useCallback(() => {
    const mode = gameState.gameMode;
    if (!gameState.isGameOver && !gameState.levelComplete) {
      // Auto-save game when leaving
      gameStore.setState({ isPaused: true });
      if (mode === 'drop' && window.__dropSceneSave) {
        window.__dropSceneSave();
      } else if (window.__mainSceneSave) {
        window.__mainSceneSave();
      }
    }
    gameStore.showHome();
  }, [gameState.gameMode, gameState.isGameOver, gameState.levelComplete]);

  return (
    <div className="controls-container">
      <button
        className="control-button restart-button"
        onClick={handleRestart}
        title="Start this level over"
      >
        <span className="button-icon">🔄</span>
        <span className="button-text">Restart</span>
      </button>

      <button
        className="control-button home-button"
        onClick={handleHome}
        title="Back to home"
      >
        <span className="button-icon">🏠</span>
        <span className="button-text">Home</span>
      </button>
    </div>
  );
}
