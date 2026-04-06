/**
 * Game Mode Definitions
 * Each mode defines its own rules, merge operation, and win/fail conditions
 */

export const GAME_MODES = {
  classic: {
    id: 'classic',
    name: 'Classic Merge',
    icon: '➕',
    description: 'Combine blocks to reach the target!',
    color: '#4ecb71',
    operation: 'add',
  },
  operation: {
    id: 'operation',
    name: 'Operation Mode',
    icon: '✖️',
    description: 'Choose your math operation!',
    color: '#f5576c',
    operation: null, // chosen by player
    operations: ['add', 'subtract', 'multiply', 'divide'],
  },
  target: {
    id: 'target',
    name: 'Target Challenge',
    icon: '🎯',
    description: 'Hit the exact target number!',
    color: '#ffa502',
    operation: 'add',
  },
  timed: {
    id: 'timed',
    name: 'Timed Mode',
    icon: '⏱',
    description: 'Merge as much as you can in 60 seconds!',
    color: '#1e90ff',
    operation: 'add',
    timeLimit: 60,
  },
  puzzle: {
    id: 'puzzle',
    name: 'Puzzle Levels',
    icon: '🧩',
    description: 'Limited moves, think carefully!',
    color: '#a55eea',
    operation: 'add',
  },
  drop: {
    id: 'drop',
    name: 'Number Drop',
    icon: '⬇️',
    description: 'Tap columns to drop & match numbers!',
    color: '#ff6348',
    operation: 'add',
  },
};

export const OPERATION_LABELS = {
  add: { symbol: '+', name: 'Addition', icon: '➕' },
  subtract: { symbol: '−', name: 'Subtraction', icon: '➖' },
  multiply: { symbol: '×', name: 'Multiplication', icon: '✖️' },
  divide: { symbol: '÷', name: 'Division', icon: '➗' },
};

export function getGameMode(modeId) {
  return GAME_MODES[modeId] || null;
}

export function getAllModes() {
  return Object.values(GAME_MODES);
}
