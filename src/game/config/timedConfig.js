/**
 * Timed Mode Configuration
 * Generates random blocks for timed sessions
 */

/**
 * Generate random blocks for a timed mode session
 * @param {number} count - Number of blocks to spawn
 * @returns {{ initialBlocks: Array, goal: number }}
 */
export function generateTimedBlocks(count = 6) {
  const blocks = [];
  for (let i = 0; i < count; i++) {
    blocks.push({ value: Math.floor(Math.random() * 9) + 1 });
  }
  return blocks;
}

/**
 * Timed mode defaults
 */
export const TIMED_CONFIG = {
  timeLimit: 60,
  initialBlockCount: 6,
  spawnInterval: 8,   // spawn new block every 8 seconds
  maxBlocks: 12,      // max blocks on screen
};
