/**
 * Level Configuration
 * Defines all game levels with initial blocks and goals
 */

export const LEVELS = [
  {
    id: 1,
    name: 'Getting Started',
    description: 'Learn to merge blocks',
    goal: 10,
    blockCount: 6,
  },
  {
    id: 2,
    name: 'Steady Progress',
    description: 'Combine smaller numbers',
    goal: 15,
    blockCount: 7,
  },
  {
    id: 3,
    name: 'Building Up',
    description: 'Create larger values',
    goal: 20,
    blockCount: 8,
  },
  {
    id: 4,
    name: 'Bigger Numbers',
    description: 'Reach higher targets',
    goal: 25,
    blockCount: 9,
  },
  {
    id: 5,
    name: 'Strategic Merging',
    description: 'Plan your moves carefully',
    goal: 30,
    blockCount: 10,
  },
  {
    id: 6,
    name: 'Challenge Level',
    description: 'Test your skills',
    goal: 35,
    blockCount: 10,
  },
  {
    id: 7,
    name: 'Advanced Arithmetic',
    description: 'Complex combinations',
    goal: 40,
    blockCount: 11,
  },
  {
    id: 8,
    name: 'Master Merger',
    description: 'High-value targets',
    goal: 45,
    blockCount: 11,
  },
  {
    id: 9,
    name: 'Elite Challenge',
    description: 'For experienced players',
    goal: 50,
    blockCount: 12,
  },
  {
    id: 10,
    name: 'Ultimate Test',
    description: 'The final challenge',
    goal: 54,
    blockCount: 12,
  },
];

/**
 * Generate random blocks with excess distractors.
 * A subset of blocks sums to exactly the goal (guaranteeing it's completable),
 * plus extra blocks that create wrong paths and strategic choices.
 * Values are kept in the 1-9 range for kid-friendliness.
 */
function generateRandomBlocks(goal, blockCount) {
  const maxVal = 9;
  const minVal = 1;

  // Determine how many blocks form the "solution" subset vs distractors.
  // Use roughly 60-70% of blocks for the solution, rest are distractors.
  const solutionCount = Math.max(3, Math.ceil(blockCount * 0.6));
  const extraCount = blockCount - solutionCount;

  // --- Build the solution subset (sums to exactly the goal) ---
  const solution = new Array(solutionCount).fill(minVal);
  let remaining = goal - solutionCount * minVal;

  for (let i = 0; i < remaining; i++) {
    const candidates = [];
    for (let j = 0; j < solutionCount; j++) {
      if (solution[j] < maxVal) candidates.push(j);
    }
    if (candidates.length === 0) break;
    const idx = candidates[Math.floor(Math.random() * candidates.length)];
    solution[idx]++;
  }

  // --- Build distractor blocks (random 1-6, kept small to be tempting) ---
  const distractors = [];
  for (let i = 0; i < extraCount; i++) {
    distractors.push(Math.floor(Math.random() * 6) + 1);
  }

  // Combine and shuffle everything together
  const all = [...solution, ...distractors];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }

  return all.map((value) => ({ value }));
}

/**
 * Get a specific level by ID
 * @param {number} levelId - Level ID (1-10)
 * @returns {Object|null} - Level configuration or null if not found
 */
export function getLevel(levelId) {
  const level = LEVELS.find((level) => level.id === levelId) || null;
  if (!level) return null;

  // Generate fresh random blocks each time
  return {
    ...level,
    initialBlocks: generateRandomBlocks(level.goal, level.blockCount),
  };
}

/**
 * Get total number of levels
 * @returns {number} - Total levels
 */
export function getTotalLevels() {
  return LEVELS.length;
}

/**
 * Check if level exists
 * @param {number} levelId - Level ID
 * @returns {boolean} - True if level exists
 */
export function levelExists(levelId) {
  return levelId >= 1 && levelId <= LEVELS.length;
}

/**
 * Get next level ID
 * @param {number} currentLevelId - Current level ID
 * @returns {number|null} - Next level ID or null if at last level
 */
export function getNextLevelId(currentLevelId) {
  if (currentLevelId < LEVELS.length) {
    return currentLevelId + 1;
  }
  return null;
}

export default {
  LEVELS,
  getLevel,
  getTotalLevels,
  levelExists,
  getNextLevelId,
};
