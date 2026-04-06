import { useEffect } from 'react';
import GameCanvas from './components/GameCanvas';
import HUD from './components/HUD';
import Controls from './components/Controls';
import HomeScreen from './components/HomeScreen';
import useGameState from './hooks/useGameState';
import './App.css';

function App() {
  const { gameState } = useGameState();

  useEffect(() => {
    // Try to lock orientation to portrait on supported devices
    try {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock('portrait').catch(() => {});
      }
    } catch (e) {
      // Not supported — fallback CSS overlay will handle it
    }
  }, []);

  if (gameState.showHome) {
    return (
      <>
        <HomeScreen />
        <div className="landscape-overlay">
          <div className="landscape-message">
            <span className="landscape-icon">📱</span>
            <p>Please rotate your device to portrait mode</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="app">
      <div className="app-header">
        <HUD />
      </div>
      
      <div className="app-main">
        <GameCanvas key={gameState.gameMode} />
      </div>

      <Controls />

      <div className="landscape-overlay">
        <div className="landscape-message">
          <span className="landscape-icon">📱</span>
          <p>Please rotate your device to portrait mode</p>
        </div>
      </div>
    </div>
  );
}

export default App;
