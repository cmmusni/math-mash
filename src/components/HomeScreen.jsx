import { useState, useCallback } from 'react';
import { getAllModes, GAME_MODES, OPERATION_LABELS } from '../game/config/gameModes';
import * as gameStore from '../store/gameStore';
import '../styles/HomeScreen.css';

export default function HomeScreen() {
  const [showOperations, setShowOperations] = useState(false);
  const [continueMode, setContinueMode] = useState(null);
  const modes = getAllModes();

  const handleModeSelect = useCallback((mode) => {
    if (mode.id === 'operation') {
      // For operation mode, check save before showing sub-menu
      if (gameStore.hasSavedGame('operation')) {
        setContinueMode(mode);
        return;
      }
      setShowOperations(true);
      return;
    }
    if (gameStore.hasSavedGame(mode.id)) {
      setContinueMode(mode);
      return;
    }
    gameStore.setGameMode(mode.id, mode.operation || 'add');
  }, []);

  const handleContinue = useCallback(() => {
    if (!continueMode) return;
    const save = gameStore.loadGameState(continueMode.id);
    const op = save ? save.operation : (continueMode.operation || 'add');
    setContinueMode(null);
    gameStore.setGameMode(continueMode.id, op);
  }, [continueMode]);

  const handleNewGame = useCallback(() => {
    if (!continueMode) return;
    gameStore.clearGameState(continueMode.id);
    setContinueMode(null);
    if (continueMode.id === 'operation') {
      setShowOperations(true);
      return;
    }
    gameStore.setGameMode(continueMode.id, continueMode.operation || 'add');
  }, [continueMode]);

  const handleOperationSelect = useCallback((op) => {
    setShowOperations(false);
    gameStore.setGameMode('operation', op);
  }, []);

  const handleBackFromOps = useCallback(() => {
    setShowOperations(false);
  }, []);

  const continueModeDef = continueMode ? GAME_MODES[continueMode.id] : null;

  if (showOperations) {
    return (
      <div className="home-screen">
        <div className="home-header">
          <h1 className="home-title">✖️ Operation Mode</h1>
          <p className="home-subtitle">Choose your operation</p>
        </div>
        <div className="mode-grid">
          {Object.entries(OPERATION_LABELS).map(([key, op]) => (
            <button
              key={key}
              className="mode-card"
              style={{ '--mode-color': '#f5576c' }}
              onClick={() => handleOperationSelect(key)}
            >
              <span className="mode-icon">{op.icon}</span>
              <span className="mode-name">{op.name}</span>
              <span className="mode-desc">Merge using {op.symbol}</span>
            </button>
          ))}
        </div>
        <button className="back-button" onClick={handleBackFromOps}>
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="home-screen">
      <div className="home-header">
        <img src="/math-mash-logo.png" alt="Math Mash" className="home-logo" />
        <h1 className="home-title">🎮 Math Mash</h1>
        <p className="home-subtitle">Choose a Game Mode</p>
      </div>
      <div className="mode-grid">
        {modes.map((mode) => (
          <button
            key={mode.id}
            className="mode-card"
            style={{ '--mode-color': mode.color }}
            onClick={() => handleModeSelect(mode)}
          >
            <span className="mode-icon">{mode.icon}</span>
            <span className="mode-name">{mode.name}</span>
            <span className="mode-desc">{mode.description}</span>
            {gameStore.hasSavedGame(mode.id) && (
              <span className="mode-saved-badge">Saved</span>
            )}
          </button>
        ))}
      </div>

      {continueMode && continueModeDef && (
        <div className="continue-overlay" onClick={() => setContinueMode(null)}>
          <div className="continue-modal" onClick={(e) => e.stopPropagation()}>
            <p className="continue-title">{continueModeDef.icon} {continueModeDef.name}</p>
            <p className="continue-text">You have a saved game. Continue where you left off?</p>
            <div className="continue-actions">
              <button className="continue-btn" onClick={handleContinue}>
                ▶ Continue
              </button>
              <button className="new-game-btn" onClick={handleNewGame}>
                🔄 New Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
