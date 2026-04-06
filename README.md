# Math Mash - Math Game for Kids

A math game built with React (Vite) and Phaser 3 game engine. Designed to be fun and educational for kids.

## Features

- Built with React for UI and Phaser 3 for game logic
- Mobile-first responsive design
- Clean separation between React components and Phaser game scenes
- Custom React hooks for game state management
- HUD (Heads-Up Display) for score and level tracking

## Project Structure

```
src/
├── game/                 # Phaser game logic
│   ├── scenes/          # Phaser scene classes
│   │   └── MainScene.js
│   ├── objects/         # Custom Phaser game objects (placeholder)
│   ├── systems/         # Custom Phaser systems (placeholder)
│   └── config.js        # Phaser configuration
├── components/          # React UI components
│   ├── GameCanvas.jsx   # Phaser instance wrapper
│   └── HUD.jsx         # Game heads-up display
├── hooks/              # Custom React hooks
│   └── useGameState.js # Game state management
├── styles/             # CSS styling
│   ├── App.css
│   └── HUD.css
├── App.jsx            # Main React application
└── main.jsx           # React entry point
```

## Installation

```bash
npm install
```

## Development

Run the development server:

```bash
npm run dev
```

The game will be available at `http://localhost:5173`

## Building for Production

```bash
npm run build
```

The production build will be in the `dist/` directory.

## Preview Production Build

```bash
npm run preview
```

## Technologies Used

- **React** - UI components and state management
- **Vite** - Fast build tool and development server
- **Phaser 3** - Game engine
- **CSS** - Styling (no CSS framework)

## Getting Started with Development

1. The game canvas is initialized in `GameCanvas.jsx`
2. Add game objects and logic in `src/game/scenes/MainScene.js`
3. Update game state using the `useGameState` hook
4. Customize the HUD in `HUD.jsx`

## Notes

- Mobile-first layout approach
- No TypeScript - using standard JavaScript
- No Tailwind CSS - vanilla CSS for styling
- Phaser games scenes are properly cleaned up on component unmount
- Responsive to window resizing
