# Math Mash - React Vite + Phaser 3 Project

This is a math game for kids built with React (Vite) and Phaser 3 as the game engine.

## Project Structure

- **src/game/** - Phaser game logic
  - scenes/ - Phaser scene classes
  - objects/ - Custom Phaser game objects
  - systems/ - Custom Phaser systems
  - config.js - Phaser configuration
- **src/components/** - React UI components
  - GameCanvas.jsx - Wrapper for Phaser instance
  - HUD.jsx - Heads-up display
- **src/hooks/** - Custom React hooks
  - useGameState.js - Game state management
- **src/App.jsx** - Main React application

## Development

- Uses React functional components
- No TypeScript
- No Tailwind CSS
- Mobile-first layout approach
- Phaser 3 game engine for game logic

## To Run

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```
