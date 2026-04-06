import { useState, useCallback, useEffect } from 'react';
import * as gameStore from '../store/gameStore';

export default function useGameState() {
  const [gameState, setGameState] = useState(gameStore.getState());

  // Subscribe to global store changes
  useEffect(() => {
    const unsubscribe = gameStore.subscribe((newState) => {
      setGameState(newState);
    });

    return unsubscribe;
  }, []);

  // Update game state
  const updateGameState = useCallback((updates) => {
    gameStore.setState(updates);
  }, []);

  // Add points to score
  const addScore = useCallback((points = 10) => {
    gameStore.addScore(points);
  }, []);

  // Increment level
  const advanceLevel = useCallback(() => {
    updateGameState({
      level: gameState.level + 1,
    });
  }, [updateGameState, gameState.level]);

  // Toggle pause state
  const togglePause = useCallback(() => {
    updateGameState({
      isPaused: !gameState.isPaused,
    });
  }, [updateGameState, gameState.isPaused]);

  // Track correct answer
  const recordCorrectAnswer = useCallback(() => {
    updateGameState({
      correctAnswers: gameState.correctAnswers + 1,
      totalQuestions: gameState.totalQuestions + 1,
    });
  }, [updateGameState, gameState.correctAnswers, gameState.totalQuestions]);

  // Track incorrect answer
  const recordIncorrectAnswer = useCallback(() => {
    updateGameState({
      totalQuestions: gameState.totalQuestions + 1,
    });
  }, [updateGameState, gameState.totalQuestions]);

  // Reset game state
  const resetGame = useCallback(() => {
    gameStore.resetState();
  }, []);

  // End game
  const endGame = useCallback(() => {
    updateGameState({
      isGameOver: true,
      isPaused: true,
    });
  }, [updateGameState]);

  // Get accuracy percentage
  const getAccuracy = useCallback(() => {
    if (gameState.totalQuestions === 0) return 0;
    return Math.round(
      (gameState.correctAnswers / gameState.totalQuestions) * 100
    );
  }, [gameState.correctAnswers, gameState.totalQuestions]);

  return {
    gameState,
    updateGameState,
    addScore,
    advanceLevel,
    togglePause,
    recordCorrectAnswer,
    recordIncorrectAnswer,
    resetGame,
    endGame,
    getAccuracy,
  };
}
