import Phaser from 'phaser';
import MainScene from './scenes/MainScene';
import DropScene from './scenes/DropScene';

// Use a fixed high resolution for sharp rendering on all devices.
// FIT mode scales the canvas to fill the container while preserving aspect ratio.
const GAME_WIDTH = 1080;
const GAME_HEIGHT = 1920;

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  scene: [MainScene, DropScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
  },
  render: {
    antialias: true,
    roundPixels: true,
    powerPreference: 'high-performance',
  },
};

export default config;
