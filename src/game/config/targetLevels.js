/**
 * Target Challenge Levels
 * "Get exactly X using these blocks" — critical thinking puzzles
 */

export const TARGET_LEVELS = [
  {
    id: 1,
    name: 'Warm Up',
    description: 'Make exactly 10',
    initialBlocks: [
      { value: 3 }, { value: 2 }, { value: 5 }, { value: 4 },
    ],
    goal: 10,
    blockCount: 4,
  },
  {
    id: 2,
    name: 'Think Twice',
    description: 'Make exactly 15',
    initialBlocks: [
      { value: 6 }, { value: 3 }, { value: 4 }, { value: 2 }, { value: 5 },
    ],
    goal: 15,
    blockCount: 5,
  },
  {
    id: 3,
    name: 'Pick Wisely',
    description: 'Make exactly 20',
    initialBlocks: [
      { value: 7 }, { value: 5 }, { value: 3 }, { value: 8 }, { value: 2 },
    ],
    goal: 20,
    blockCount: 5,
  },
  {
    id: 4,
    name: 'The Classic 24',
    description: 'Make exactly 24',
    initialBlocks: [
      { value: 8 }, { value: 6 }, { value: 4 }, { value: 3 }, { value: 5 }, { value: 2 },
    ],
    goal: 24,
    blockCount: 6,
  },
  {
    id: 5,
    name: 'Thirty',
    description: 'Make exactly 30',
    initialBlocks: [
      { value: 9 }, { value: 7 }, { value: 5 }, { value: 6 }, { value: 3 }, { value: 4 },
    ],
    goal: 30,
    blockCount: 6,
  },
  {
    id: 6,
    name: 'Tricky Target',
    description: 'Make exactly 36',
    initialBlocks: [
      { value: 9 }, { value: 8 }, { value: 7 }, { value: 6 }, { value: 4 }, { value: 5 }, { value: 3 },
    ],
    goal: 36,
    blockCount: 7,
  },
  {
    id: 7,
    name: 'Sneaky Sums',
    description: 'Make exactly 42',
    initialBlocks: [
      { value: 9 }, { value: 8 }, { value: 7 }, { value: 6 }, { value: 5 }, { value: 4 }, { value: 3 },
    ],
    goal: 42,
    blockCount: 7,
  },
  {
    id: 8,
    name: 'Grand Target',
    description: 'Make exactly 50',
    initialBlocks: [
      { value: 9 }, { value: 9 }, { value: 8 }, { value: 7 }, { value: 6 }, { value: 5 }, { value: 4 }, { value: 2 },
    ],
    goal: 50,
    blockCount: 8,
  },
];

export function getTargetLevel(id) {
  return TARGET_LEVELS.find((l) => l.id === id) || null;
}

export function getTotalTargetLevels() {
  return TARGET_LEVELS.length;
}
