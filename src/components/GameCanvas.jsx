import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import gameConfig from '../game/config';
import * as gameStore from '../store/gameStore';
import '../styles/GameContainer.css';

export default function GameCanvas() {
  const gameInstanceRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Initialize Phaser game instance
    if (!gameInstanceRef.current && containerRef.current) {
      const game = new Phaser.Game({
        ...gameConfig,
        parent: containerRef.current,
      });
      gameInstanceRef.current = game;

      // Start the correct scene based on game mode
      const state = gameStore.getState();
      if (state.gameMode === 'drop') {
        game.scene.start('DropScene');
        game.scene.stop('MainScene');
      }
    }

    // Cleanup function to destroy Phaser instance on unmount
    return () => {
      if (gameInstanceRef.current) {
        gameInstanceRef.current.destroy(true);
        gameInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="game-container"
      style={{
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        position: 'relative',
      }}
    />
  );
}
