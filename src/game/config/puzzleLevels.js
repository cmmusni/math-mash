/**
 * Puzzle Levels
 * Fixed blocks with limited moves — structured learning
 */

export const PUZZLE_LEVELS = [
  {
    id: 1,
    name: 'Baby Steps',
    description: '2 moves to reach 6',
    initialBlocks: [
      { value: 1 }, { value: 2 }, { value: 3 },
    ],
    goal: 6,
    moves: 2,
    blockCount: 3,
  },
  {
    id: 2,
    name: 'Simple Path',
    description: '2 moves to reach 10',
    initialBlocks: [
      { value: 3 }, { value: 3 }, { value: 4 },
    ],
    goal: 10,
    moves: 2,
    blockCount: 3,
  },
  {
    id: 3,
    name: 'Three Steps',
    description: '3 moves to reach 15',
    initialBlocks: [
      { value: 2 }, { value: 3 }, { value: 4 }, { value: 6 },
    ],
    goal: 15,
    moves: 3,
    blockCount: 4,
  },
  {
    id: 4,
    name: 'Choose Wisely',
    description: '3 moves to reach 18',
    initialBlocks: [
      { value: 5 }, { value: 4 }, { value: 3 }, { value: 6 },
    ],
    goal: 18,
    moves: 3,
    blockCount: 4,
  },
  {
    id: 5,
    name: 'Fork in Road',
    description: '3 moves to reach 20',
    initialBlocks: [
      { value: 5 }, { value: 5 }, { value: 4 }, { value: 6 },
    ],
    goal: 20,
    moves: 3,
    blockCount: 4,
  },
  {
    id: 6,
    name: 'Precise Moves',
    description: '4 moves to reach 25',
    initialBlocks: [
      { value: 3 }, { value: 4 }, { value: 5 }, { value: 6 }, { value: 7 },
    ],
    goal: 25,
    moves: 4,
    blockCount: 5,
  },
  {
    id: 7,
    name: 'Tight Squeeze',
    description: '4 moves to reach 30',
    initialBlocks: [
      { value: 4 }, { value: 5 }, { value: 6 }, { value: 7 }, { value: 8 },
    ],
    goal: 30,
    moves: 4,
    blockCount: 5,
  },
  {
    id: 8,
    name: 'Master Puzzle',
    description: '5 moves to reach 40',
    initialBlocks: [
      { value: 5 }, { value: 6 }, { value: 7 }, { value: 8 }, { value: 5 }, { value: 9 },
    ],
    goal: 40,
    moves: 5,
    blockCount: 6,
  },
];

export function getPuzzleLevel(id) {
  return PUZZLE_LEVELS.find((l) => l.id === id) || null;
}

export function getTotalPuzzleLevels() {
  return PUZZLE_LEVELS.length;
}
