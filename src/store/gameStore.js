/**
 * Global Game Store
 * Centralized state that can be accessed from both Phaser and React
 * Uses a simple subscription pattern for updates
 */

const initialState = {
  score: 0,
  level: 1,
  levelGoal: 5,
  maxBlockValue: 0,
  isPaused: false,
  isGameOver: false,
  levelComplete: false,
  correctAnswers: 0,
  totalQuestions: 0,
  // Game mode state
  gameMode: null,       // 'classic' | 'operation' | 'target' | 'timed' | 'puzzle'
  operation: 'add',     // 'add' | 'subtract' | 'multiply' | 'divide'
  showHome: true,       // show home screen
  timeRemaining: 0,     // seconds left (timed mode)
  movesRemaining: -1,   // moves left (puzzle mode, -1 = unlimited)
  mergeCount: 0,        // total merges this session
};

let gameState = { ...initialState };
let subscribers = [];

/**
 * Subscribe to game state changes
 * @param {Function} callback - Called with new state on updates
 * @returns {Function} - Unsubscribe function
 */
export function subscribe(callback) {
  subscribers.push(callback);
  
  return () => {
    subscribers = subscribers.filter(cb => cb !== callback);
  };
}

/**
 * Get current game state
 * @returns {Object} - Current game state
 */
export function getState() {
  return { ...gameState };
}

/**
 * Update game state
 * @param {Object} updates - Partial state updates
 */
export function setState(updates) {
  gameState = { ...gameState, ...updates };
  
  // Notify all subscribers
  subscribers.forEach(callback => callback({ ...gameState }));
}

/**
 * Add points to score
 * @param {number} points - Points to add
 */
export function addScore(points = 10) {
  setState({ score: gameState.score + points });
}

/**
 * Reset game state
 */
export function resetState() {
  gameState = { ...initialState };
  subscribers.forEach(callback => callback({ ...gameState }));
}

/**
 * Get score
 * @returns {number} - Current score
 */
export function getScore() {
  return gameState.score;
}

/**
 * Set level goal
 * @param {number} goal - Goal value
 */
export function setLevelGoal(goal) {
  setState({ levelGoal: goal });
}

/**
 * Advance to next level
 */
export function advanceLevel() {
  setState({
    level: gameState.level + 1,
    score: 0,
    levelComplete: false,
  });
}

/**
 * Mark level as complete
 */
export function completeLevel() {
  setState({ levelComplete: true });
}

/**
 * Start a specific level
 * @param {number} levelId - Level ID
 * @param {number} goal - Goal value
 */
export function startLevel(levelId, goal) {
  setState({
    level: levelId,
    levelGoal: goal,
    score: 0,
    maxBlockValue: 0,
    levelComplete: false,
    isPaused: false,
  });
}

/**
 * Update the max block value on the board
 * @param {number} value - Current highest block value
 */
export function setMaxBlockValue(value) {
  setState({ maxBlockValue: value });
}

/**
 * Set the active game mode
 */
export function setGameMode(mode, operation = 'add') {
  setState({
    gameMode: mode,
    operation,
    showHome: false,
    score: 0,
    mergeCount: 0,
    levelComplete: false,
    isGameOver: false,
  });
}

/**
 * Show the home screen
 */
export function showHome() {
  setState({
    showHome: true,
    gameMode: null,
    isPaused: false,
    isGameOver: false,
    levelComplete: false,
  });
}

/**
 * Set operation for operation mode
 */
export function setOperation(op) {
  setState({ operation: op });
}

/**
 * Set time remaining (timed mode)
 */
export function setTimeRemaining(seconds) {
  setState({ timeRemaining: seconds });
}

/**
 * Set moves remaining (puzzle mode)
 */
export function setMovesRemaining(moves) {
  setState({ movesRemaining: moves });
}

/**
 * Use one move (puzzle mode)
 */
export function useMove() {
  if (gameState.movesRemaining > 0) {
    setState({ movesRemaining: gameState.movesRemaining - 1 });
  }
}

/**
 * Increment merge count
 */
export function incrementMergeCount() {
  setState({ mergeCount: gameState.mergeCount + 1 });
}

/**
 * Save drop mode game state to localStorage
 */
const SAVE_KEY = 'mathmash_save';

export function saveGameState(mode, sceneData) {
  const saveData = {
    mode,
    score: gameState.score,
    mergeCount: gameState.mergeCount,
    maxBlockValue: gameState.maxBlockValue,
    operation: gameState.operation,
    level: gameState.level,
    levelGoal: gameState.levelGoal,
    timeRemaining: gameState.timeRemaining,
    movesRemaining: gameState.movesRemaining,
    scene: sceneData,
    timestamp: Date.now(),
  };
  try {
    const allSaves = loadAllSaves();
    allSaves[mode] = saveData;
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaves));
  } catch (e) {
    // storage full or unavailable
  }
}

function loadAllSaves() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

export function loadGameState(mode) {
  const allSaves = loadAllSaves();
  return allSaves[mode] || null;
}

export function clearGameState(mode) {
  try {
    const allSaves = loadAllSaves();
    delete allSaves[mode];
    localStorage.setItem(SAVE_KEY, JSON.stringify(allSaves));
  } catch (e) {
    // ignore
  }
}

export function hasSavedGame(mode) {
  return !!loadGameState(mode);
}

export function getModesWithSaves() {
  const allSaves = loadAllSaves();
  return Object.keys(allSaves);
}

export default {
  subscribe,
  getState,
  setState,
  addScore,
  resetState,
  getScore,
  setLevelGoal,
  setMaxBlockValue,
  advanceLevel,
  completeLevel,
  startLevel,
  setGameMode,
  showHome,
  setOperation,
  setTimeRemaining,
  setMovesRemaining,
  useMove,
  incrementMergeCount,
  saveGameState,
  loadGameState,
  clearGameState,
  hasSavedGame,
  getModesWithSaves,
};
