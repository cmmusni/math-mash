import Phaser from 'phaser';
import Block from '../objects/Block';
import MergeSystem from '../systems/MergeSystem';
import SoundManager from '../systems/SoundManager';
import { getLevel, getTotalLevels } from '../config/levels';
import { getTargetLevel, getTotalTargetLevels } from '../config/targetLevels';
import { getPuzzleLevel, getTotalPuzzleLevels } from '../config/puzzleLevels';
import { generateTimedBlocks, TIMED_CONFIG } from '../config/timedConfig';
import * as gameStore from '../../store/gameStore';

export default class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
    this.blocks = [];
    this.draggedBlock = null;
    this.mergeSystem = null;
    this.soundManager = null;
    this.currentLevel = null;
    this.levelCompleted = false;
    this.levelText = null;
    this.goalText = null;
    // Mode state
    this.gameMode = null;
    this.timerEvent = null;
    this.spawnEvent = null;
    this.timerText = null;
    this.storeUnsub = null;
  }

  preload() {
    // Load assets here
  }

  create() {
    const { width, height } = this.scale;
    
    // Initialize sound manager
    this.soundManager = new SoundManager(this);
    
    // Initialize merge system
    this.mergeSystem = new MergeSystem(this);
    
    // Add gradient background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x74b9ff, 0x74b9ff, 0xa29bfe, 0xa29bfe, 1);
    bg.fillRect(0, 0, width, height);
    
    // Add subtle grid pattern for visual depth
    const grid = this.add.graphics();
    grid.lineStyle(1, 0xffffff, 0.06);
    for (let gx = 0; gx < width; gx += 80) {
      grid.lineBetween(gx, 0, gx, height);
    }
    for (let gy = 0; gy < height; gy += 80) {
      grid.lineBetween(0, gy, width, gy);
    }

    // Add instruction text
    this.instructionText = this.add.text(
      width / 2,
      60,
      'Drag blocks together to merge!',
      {
        font: '28px Arial',
        fill: '#ffffff',
        align: 'center',
      }
    ).setOrigin(0.5, 0).setAlpha(0.7);

    // Load the first level
    this.gameMode = gameStore.getState().gameMode || 'classic';

    // Check for saved game (only for non-classic modes where fixed puzzles matter)
    const saveData = gameStore.loadGameState(this.gameMode);
    if (saveData && this.gameMode !== 'classic') {
      this.restoreSavedState(saveData);
    } else {
      gameStore.clearGameState(this.gameMode);
      this.loadLevel(1);
    }

    // Set up input for drag handling
    this.input.on('pointermove', this.handlePointerMove, this);
    this.input.on('pointerup', this.handlePointerUp, this);

    // Register save callback for Controls
    window.__mainSceneSave = () => this.saveState();
  }

  /**
   * Load a specific level
   * @param {number} levelId - Level ID to load
   */
  loadLevel(levelId) {
    // Get level config
    const level = getLevel(levelId);
    
    if (!level) {
      console.error(`Level ${levelId} not found`);
      return;
    }

    // Store level info
    this.currentLevel = level;
    this.levelCompleted = false;

    // Update game store
    gameStore.startLevel(level.id, level.goal);

    // Reset the board
    this.resetBoard();

    // Spawn blocks for this level
    this.spawnBlocksForLevel(level);

    // Update level display
    this.updateLevelDisplay();

    console.log(`Loaded Level ${level.id}: ${level.name} (Goal: ${level.goal})`);
  }

  /**
   * Reset the board by removing all blocks
   */
  resetBoard() {
    // Stop dragging
    if (this.draggedBlock) {
      this.draggedBlock.stopDrag();
      this.draggedBlock = null;
    }

    // Destroy all existing blocks and their text
    this.blocks.forEach((block) => {
      block.destroy();
    });
    this.blocks = [];
  }

  /**
   * Spawn blocks for a specific level
   * @param {Object} level - Level configuration
   */
  spawnBlocksForLevel(level) {
    const { width, height } = this.scale;
    const minX = 140;
    const maxX = width - 140;
    const minY = 150;
    const maxY = height - 200;

    level.initialBlocks.forEach((blockConfig, index) => {
      // Distribute blocks evenly across the screen
      const cols = Math.ceil(Math.sqrt(level.blockCount));
      const col = index % cols;
      const row = Math.floor(index / cols);

      const xSpacing = (maxX - minX) / (cols + 1);
      const ySpacing = (maxY - minY) / Math.ceil(level.blockCount / cols);

      const x = minX + xSpacing * (col + 1);
      const y = minY + ySpacing * (row + 1);

      // Create block
      const block = new Block(this, x, y, blockConfig.value);
      this.blocks.push(block);

      // Add text to display the number
      const text = this.add.text(x, y, blockConfig.value.toString(), {
        font: 'bold 48px Arial',
        fill: '#ffffff',
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      text.setDepth(10);

      // Store reference to text on the block
      block.setValueText(text);
    });

    // Set initial max block value
    this.updateMaxBlockValue();
  }

  /**
   * Update the max block value in the store
   */
  updateMaxBlockValue() {
    if (this.blocks.length > 0) {
      const maxValue = Math.max(...this.blocks.map((b) => b.getValue()));
      gameStore.setMaxBlockValue(maxValue);
    }
  }

  /**
   * Update level display text
   */
  updateLevelDisplay() {
    // Remove old display text if exists
    if (this.levelText) {
      this.levelText.destroy();
    }
    if (this.goalText) {
      this.goalText.destroy();
    }
    // Level and goal info is shown in the React HUD, not in the scene
  }

  /**
   * Handle pointer move for dragging
   */
  handlePointerMove(pointer) {
    // Update dragged block position
    if (this.draggedBlock && this.draggedBlock.isDragging) {
      this.draggedBlock.updateDrag(pointer);
      
      // Update text position to follow block
      if (this.draggedBlock.valueText) {
        const pos = this.draggedBlock.getPosition();
        this.draggedBlock.valueText.setPosition(pos.x, pos.y);
      }
    }
  }

  /**
   * Handle pointer up to stop dragging and check for merges
   */
  handlePointerUp() {
    if (this.draggedBlock && this.draggedBlock.isDragging) {
      const draggedBlockRef = this.draggedBlock;

      // Try to merge with overlapping block
      const mergeResult = this.mergeSystem.checkAndMerge(
        this.draggedBlock,
        this.blocks
      );

      // If a merge happened, update our blocks array
      if (mergeResult) {
        // Remove both merged blocks from the array
        this.blocks = this.blocks.filter(
          (block) =>
            block !== mergeResult.block1 && block !== mergeResult.block2
        );

        // Add the new merged block
        this.blocks.push(mergeResult.mergedBlock);

        // Update max block value in store
        this.updateMaxBlockValue();

        // Check if level is complete
        this.checkLevelComplete(mergeResult.mergedBlock);

        // Check if level is now impossible
        if (!this.levelCompleted) {
          this.checkLevelFailed();
        }
      }

      // Stop dragging
      this.draggedBlock.stopDrag();
      this.draggedBlock = null;
    }
  }

  /**
   * Check if the current level is complete
   * @param {Block} block - Block that was just created/updated
   */
  checkLevelComplete(block) {
    if (!this.currentLevel) return;

    // Level completes only when a block reaches EXACTLY the goal value
    const hasExactGoal = this.blocks.some((b) => b.getValue() === this.currentLevel.goal);

    if (hasExactGoal) {
      this.levelCompleted = true;
      this.completeLevelSuccess();
    }
  }

  /**
   * Check if the level is impossible to complete
   */
  checkLevelFailed() {
    if (!this.currentLevel) return;

    const goal = this.currentLevel.goal;

    // If any block already equals the goal, not failed
    if (this.blocks.some((b) => b.getValue() === goal)) return;

    // If only 1 block left and it's not the goal, it's failed
    if (this.blocks.length === 1) {
      this.completeLevelFailed();
      return;
    }

    // Check if it's still possible to make the exact goal value.
    // We need to find if any subset of blocks sums to exactly the goal.
    const values = this.blocks.map((b) => b.getValue());
    if (!this.canReachGoal(values, goal)) {
      this.completeLevelFailed();
    }
  }

  /**
   * Check if any subset of values can sum to exactly the target
   * @param {number[]} values - Block values
   * @param {number} target - Goal value
   * @returns {boolean}
   */
  canReachGoal(values, target) {
    const n = values.length;
    // Check all subsets of size >= 2 (need at least 2 blocks to merge)
    for (let mask = 3; mask < (1 << n); mask++) {
      // Skip single-element subsets
      if ((mask & (mask - 1)) === 0) continue;
      let sum = 0;
      for (let i = 0; i < n; i++) {
        if (mask & (1 << i)) {
          sum += values[i];
        }
      }
      if (sum === target) return true;
    }
    return false;
  }

  /**
   * Handle level failure
   */
  completeLevelFailed() {
    const { width, height } = this.scale;

    // Play failure sound
    if (this.soundManager) {
      this.soundManager.play('level_failed');
    }

    // Disable input on blocks
    this.blocks.forEach((b) => {
      if (b.rectangle) b.rectangle.disableInteractive();
    });

    // Dimming overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5);
    overlay.setDepth(999);
    overlay.setInteractive(); // block clicks through

    // Failure message
    const message = this.add.text(
      width / 2,
      height / 2 - 80,
      'Level Failed!',
      {
        font: 'bold 56px Arial',
        fill: '#ff4757',
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      }
    );
    message.setOrigin(0.5, 0.5);
    message.setDepth(1000);
    message.setScale(0);

    const subtitle = this.add.text(
      width / 2,
      height / 2,
      'Not enough blocks to reach the goal',
      {
        font: '28px Arial',
        fill: '#ffffff',
        align: 'center',
      }
    );
    subtitle.setOrigin(0.5, 0.5);
    subtitle.setDepth(1000);
    subtitle.setAlpha(0);

    // Retry button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff6b6b, 1);
    btnBg.fillRoundedRect(width / 2 - 120, height / 2 + 50, 240, 70, 35);
    btnBg.lineStyle(3, 0xffffff, 0.6);
    btnBg.strokeRoundedRect(width / 2 - 120, height / 2 + 50, 240, 70, 35);
    btnBg.setDepth(1000);
    btnBg.setAlpha(0);

    const btnText = this.add.text(
      width / 2,
      height / 2 + 85,
      '🔄  Try Again',
      {
        font: 'bold 32px Arial',
        fill: '#ffffff',
        align: 'center',
      }
    );
    btnText.setOrigin(0.5, 0.5);
    btnText.setDepth(1001);
    btnText.setAlpha(0);

    // Invisible hit area for button
    const btnHit = this.add.rectangle(width / 2, height / 2 + 85, 240, 70, 0xffffff, 0);
    btnHit.setDepth(1002);
    btnHit.setInteractive({ cursor: 'pointer' });
    btnHit.setAlpha(0);

    btnHit.on('pointerdown', () => {
      // Clean up and restart level
      overlay.destroy();
      message.destroy();
      subtitle.destroy();
      btnBg.destroy();
      btnText.destroy();
      btnHit.destroy();
      this.loadLevel(this.currentLevel.id);
    });

    // Animations
    this.tweens.add({
      targets: message,
      scale: 1,
      duration: 400,
      ease: 'Back.easeOut',
    });

    this.tweens.add({
      targets: [subtitle, btnBg, btnText, btnHit],
      alpha: 1,
      duration: 300,
      delay: 400,
    });
  }

  /**
   * Handle level completion
   */
  completeLevelSuccess() {
    // Mark level as complete in store
    gameStore.completeLevel();
    // Clear save since level is done
    gameStore.clearGameState(this.gameMode);

    // Play success sound
    if (this.soundManager) {
      this.soundManager.play('level_complete');
    }

    // Check if there are more levels
    const nextLevelId = this.currentLevel.id + 1;
    const totalLevels = getTotalLevels();

    if (nextLevelId <= totalLevels) {
      // Wait a moment then load next level
      this.time.delayedCall(1000, () => {
        this.loadLevel(nextLevelId);
      });

      // Show level complete message
      const { width, height } = this.scale;
      
      // Dimming overlay
      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.4);
      overlay.setDepth(999);
      
      const message = this.add.text(
        width / 2,
        height / 2,
        `Level ${this.currentLevel.id} Complete! 🎉`,
        {
          font: 'bold 52px Arial',
          fill: '#ffffff',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 4,
        }
      );
      message.setOrigin(0.5, 0.5);
      message.setDepth(1000);
      message.setScale(0);
      
      // Pop-in animation
      this.tweens.add({
        targets: message,
        scale: 1,
        duration: 400,
        ease: 'Back.easeOut',
      });

      // Fade out after delay
      this.tweens.add({
        targets: [message, overlay],
        alpha: 0,
        duration: 400,
        delay: 800,
        onComplete: () => {
          message.destroy();
          overlay.destroy();
        },
      });
    } else {
      // Game complete! All levels finished
      const { width, height } = this.scale;
      const message = this.add.text(
        width / 2,
        height / 2,
        `🏆 Congratulations! 🏆\nAll ${totalLevels} levels complete!`,
        {
          font: 'bold 52px Arial',
          fill: '#ffffff',
          align: 'center',
          stroke: '#000000',
          strokeThickness: 4,
        }
      );
      message.setOrigin(0.5, 0.5);
      message.setDepth(1000);
    }
  }

  /**
   * Called when a block is selected for dragging
   */
  selectBlockForDrag(block) {
    // Stop dragging previous block if any
    if (this.draggedBlock && this.draggedBlock !== block) {
      this.draggedBlock.stopDrag();
    }
    this.draggedBlock = block;
  }

  update() {
    // Update game logic here
    // Ensure text stays with blocks even when physics is applied
    this.blocks.forEach((block) => {
      if (block.valueText && !block.isDragging) {
        const pos = block.getPosition();
        block.valueText.setPosition(pos.x, pos.y);
      }
    });
  }

  /**
   * Save current game state for resume later
   */
  saveState() {
    if (this.levelCompleted || !this.currentLevel) return;

    const blocksData = this.blocks.map((b) => {
      const pos = b.getPosition();
      return { value: b.getValue(), x: pos.x, y: pos.y };
    });

    gameStore.saveGameState(this.gameMode, {
      blocks: blocksData,
      levelId: this.currentLevel.id,
    });
  }

  /**
   * Restore game state from a save
   */
  restoreSavedState(saveData) {
    const levelId = saveData.scene.levelId;
    const level = getLevel(levelId);
    if (!level) {
      this.loadLevel(1);
      return;
    }

    this.currentLevel = level;
    this.levelCompleted = false;

    gameStore.setState({
      score: saveData.score,
      level: saveData.level,
      levelGoal: saveData.levelGoal,
      maxBlockValue: saveData.maxBlockValue,
      mergeCount: saveData.mergeCount,
      isGameOver: false,
      levelComplete: false,
    });

    this.resetBoard();

    // Rebuild blocks from saved positions/values
    for (const bd of saveData.scene.blocks) {
      const block = new Block(this, bd.x, bd.y, bd.value);
      this.blocks.push(block);

      const text = this.add.text(bd.x, bd.y, bd.value.toString(), {
        font: 'bold 48px Arial',
        fill: '#ffffff',
        align: 'center',
      });
      text.setOrigin(0.5, 0.5);
      text.setDepth(10);
      block.setValueText(text);
    }

    this.updateMaxBlockValue();
    this.updateLevelDisplay();
  }

  /**
   * Clean up scene
   */
  shutdown() {
    this.input.off('pointermove', this.handlePointerMove, this);
    this.input.off('pointerup', this.handlePointerUp, this);
    window.__mainSceneSave = null;
    
    // Clean up merge system
    if (this.mergeSystem) {
      this.mergeSystem.destroy();
    }

    // Clean up sound manager
    if (this.soundManager) {
      // Sound manager cleanup if needed
    }

    // Destroy all blocks
    this.blocks.forEach((block) => {
      block.destroy();
    });
    this.blocks = [];
  }
}
