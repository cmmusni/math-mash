import { useCallback, useState, useEffect } from 'react';
import useGameState from '../hooks/useGameState';
import { GAME_MODES } from '../game/config/gameModes';
import '../styles/HUD.css';

export default function HUD() {
  const { gameState, togglePause } = useGameState();
  const [scoreAnimating, setScoreAnimating] = useState(false);

  const score = gameState.score || 0;
  const levelGoal = gameState.levelGoal || 5;
  const maxBlockValue = gameState.maxBlockValue || 0;
  const level = gameState.level || 1;
  const isPaused = gameState.isPaused || false;
  const levelComplete = gameState.levelComplete || false;
  const gameMode = gameState.gameMode || 'classic';
  const mergeCount = gameState.mergeCount || 0;
  const isDropMode = gameMode === 'drop';

  const modeDef = GAME_MODES[gameMode];
  const modeLabel = modeDef ? `${modeDef.icon} ${modeDef.name}` : 'Classic';

  // Trigger animation when score changes
  useEffect(() => {
    setScoreAnimating(true);
    const timer = setTimeout(() => setScoreAnimating(false), 300);
    return () => clearTimeout(timer);
  }, [score]);

  const handlePause = useCallback(() => {
    togglePause();
  }, [togglePause]);

  // Progress is based on max block value vs goal
  const progressPercent = Math.min((maxBlockValue / levelGoal) * 100, 100);

  if (isDropMode) {
    return (
      <div className="hud-container">
        <div className="hud-section hud-left">
          <div className="hud-item">
            <span className="hud-label">Score</span>
            <span className={`hud-value hud-value-big ${scoreAnimating ? 'score-pulse' : ''}`}>{score}</span>
          </div>
        </div>

        <div className="hud-section hud-center">
          <div className="hud-item">
            <span className="hud-label">Mode</span>
            <span className="hud-value hud-value-small">{modeLabel}</span>
          </div>
        </div>

        <div className="hud-section hud-right">
          <div className="hud-item">
            <span className="hud-label">Best Block</span>
            <span className="hud-value">{maxBlockValue}</span>
          </div>
          <button
            className="hud-button"
            onClick={handlePause}
            title={isPaused ? 'Resume Game' : 'Pause Game'}
          >
            {isPaused ? '▶' : '⏸'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hud-container">
      <div className="hud-section hud-left">
        <div className="hud-item">
          <span className="hud-label">Level</span>
          <span className="hud-value">{level}</span>
        </div>
      </div>

      <div className="hud-section hud-center">
        <div className="goal-progress">
          <span className="goal-label">Goal</span>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progressPercent}%` }}
            />
            <span className="progress-text">
              Best Block: {maxBlockValue} / {levelGoal}
            </span>
          </div>
          {levelComplete && <span className="level-complete">✓</span>}
        </div>
      </div>

      <div className="hud-section hud-right">
        <div className={`hud-item ${scoreAnimating ? 'score-pulse' : ''}`}>
          <span className="hud-label">Score</span>
          <span className="hud-value">{score}</span>
        </div>
        <button
          className="hud-button"
          onClick={handlePause}
          title={isPaused ? 'Resume Game' : 'Pause Game'}
        >
          {isPaused ? '▶' : '⏸'}
        </button>
      </div>
    </div>
  );
}
