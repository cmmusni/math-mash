import Phaser from 'phaser';
import SoundManager from '../systems/SoundManager';
import * as gameStore from '../../store/gameStore';

/**
 * DropScene - Kid-friendly falling number blocks
 * Blocks fall slowly. Tap a column to move the block there.
 * If it lands on the same number, they merge (sum).
 * Speed increases gently at score milestones.
 * Numbers are biased toward what's already on the board for frequent merges.
 */

const COLS = 5;
const BLOCK_SIZE = 140;
const GAP = 12;
const MAX_VALUE = 5;        // only numbers 1-5 for easy matching

// Score-based speed tiers (pixels per frame)
const SPEED_TIERS = [
  { score: 0,   speed: 1.2 },  // very slow start
  { score: 50,  speed: 1.8 },
  { score: 120, speed: 2.5 },
  { score: 250, speed: 3.2 },
  { score: 400, speed: 4.0 },
  { score: 600, speed: 5.0 },
];

export default class DropScene extends Phaser.Scene {
  constructor() {
    super('DropScene');
    this.grid = [];
    this.fallingBlock = null;
    this.soundManager = null;
    this.isGameOver = false;
    this.score = 0;
    this.gridLeft = 0;
    this.gridTop = 0;
    this.maxRows = 0;
    this.currentSpeed = SPEED_TIERS[0].speed;
    this.nextValue = 0;
    this.nextPreview = null;
    this.columnHighlights = [];
    this.arrowIndicators = [];
    this.isPlacing = false;   // true while merge chain is resolving
  }

  create() {
    const { width, height } = this.scale;

    this.soundManager = new SoundManager(this);
    this.isGameOver = false;
    this.isPlacing = false;
    this.score = 0;
    this.currentSpeed = SPEED_TIERS[0].speed;

    // Calculate grid dimensions
    const totalGridWidth = COLS * BLOCK_SIZE + (COLS - 1) * GAP;
    this.gridLeft = Math.floor((width - totalGridWidth) / 2);
    this.gridTop = 240;
    this.maxRows = Math.floor((height - this.gridTop - 120) / (BLOCK_SIZE + GAP));

    // Background
    const bg = this.add.graphics();
    bg.fillGradientStyle(0x2c3e50, 0x2c3e50, 0x34495e, 0x34495e, 1);
    bg.fillRect(0, 0, width, height);

    // Grid area
    const gridBg = this.add.graphics();
    gridBg.fillStyle(0x000000, 0.2);
    const gridHeight = this.maxRows * (BLOCK_SIZE + GAP) - GAP;
    gridBg.fillRoundedRect(
      this.gridLeft - GAP,
      this.gridTop - GAP,
      totalGridWidth + GAP * 2,
      gridHeight + GAP * 2,
      16
    );

    // Column separators
    const lines = this.add.graphics();
    lines.lineStyle(1, 0xffffff, 0.08);
    for (let c = 1; c < COLS; c++) {
      const x = this.gridLeft + c * (BLOCK_SIZE + GAP) - GAP / 2;
      lines.lineBetween(x, this.gridTop, x, this.gridTop + gridHeight);
    }

    // Column highlight overlays
    this.columnHighlights = [];
    for (let c = 0; c < COLS; c++) {
      const cx = this.gridLeft + c * (BLOCK_SIZE + GAP);
      const highlight = this.add.graphics();
      highlight.fillStyle(0xffffff, 0.08);
      highlight.fillRoundedRect(cx - 2, this.gridTop, BLOCK_SIZE + 4, gridHeight, 8);
      highlight.setAlpha(0);
      highlight.setDepth(0);
      this.columnHighlights.push(highlight);
    }

    // Column arrow indicators
    this.arrowIndicators = [];
    for (let c = 0; c < COLS; c++) {
      const x = this.colCenterX(c);
      const arrow = this.add.text(x, this.gridTop - 50, '▼', {
        font: 'bold 36px Arial',
        fill: '#ffffff',
      }).setOrigin(0.5).setAlpha(0.25);
      this.arrowIndicators.push(arrow);
    }

    // Top line
    const topLine = this.add.graphics();
    topLine.lineStyle(3, 0xffd32a, 0.5);
    topLine.lineBetween(
      this.gridLeft - GAP,
      this.gridTop,
      this.gridLeft + totalGridWidth + GAP,
      this.gridTop
    );

    // Instruction
    this.add.text(width / 2, this.gridTop - 20, '⬇️ Tap a column to guide the block!', {
      font: 'bold 24px Arial',
      fill: '#ffd32a',
    }).setOrigin(0.5).setAlpha(0.8);

    // "Next" label
    this.add.text(width / 2 + 70, 95, 'Next', {
      font: 'bold 22px Arial',
      fill: 'rgba(255,255,255,0.5)',
    }).setOrigin(0.5);

    // Initialize grid
    this.grid = [];
    for (let c = 0; c < COLS; c++) {
      this.grid[c] = [];
    }

    // Init store
    gameStore.setState({
      score: 0,
      isGameOver: false,
      levelComplete: false,
      maxBlockValue: 0,
    });

    // Check for saved game to restore
    const saveData = gameStore.loadGameState('drop');
    if (saveData) {
      this.restoreState(saveData);
    } else {
      // Generate next value and spawn first block
      this.nextValue = this.randomValue();
      this.showNextPreview();
      this.spawnFallingBlock();
    }

    // Input
    this.input.on('pointerdown', this.handlePointerDown, this);

    // Register save callback for Controls to call when going home
    window.__dropSceneSave = () => this.saveState();
  }

  /**
   * Generate a random value biased toward numbers already on the board tops.
   * 60% chance of picking a value that matches a column top, 40% pure random.
   * This makes merges happen much more often.
   */
  randomValue() {
    // Collect values at the top of each column
    const topValues = [];
    for (let c = 0; c < COLS; c++) {
      const stack = this.grid[c];
      if (stack.length > 0) {
        topValues.push(stack[stack.length - 1].value);
      }
    }

    // 60% chance to match a top value if any exist
    if (topValues.length > 0 && Math.random() < 0.6) {
      return topValues[Math.floor(Math.random() * topValues.length)];
    }

    return Math.floor(Math.random() * MAX_VALUE) + 1;
  }

  /**
   * Update the next-block preview (small, to the right)
   */
  showNextPreview() {
    const { width } = this.scale;

    if (this.nextPreview) {
      this.nextPreview.graphics.destroy();
      this.nextPreview.text.destroy();
      this.nextPreview.shadow.destroy();
      this.nextPreview = null;
    }

    const nx = width / 2 + 70;
    const ny = 140;
    this.nextPreview = this.createBlockVisual(nx, ny, this.nextValue, 0.55);
    this.nextPreview.graphics.setAlpha(0.6);
    this.nextPreview.text.setAlpha(0.6);
    this.nextPreview.shadow.setAlpha(0.1);
  }

  /**
   * Spawn a new falling block at a smart column
   */
  spawnFallingBlock() {
    if (this.isGameOver) return;

    const value = this.nextValue;
    this.nextValue = this.randomValue();
    this.showNextPreview();

    // Pick a starting column — prefer a column whose top matches this value
    let col = Math.floor(Math.random() * COLS);
    for (let c = 0; c < COLS; c++) {
      const stack = this.grid[c];
      if (stack.length > 0 && stack[stack.length - 1].value === value && this.getLandingRow(c) >= 0) {
        col = c;
        break;
      }
    }
    // Ensure column isn't full
    if (this.getLandingRow(col) < 0) {
      // Find any non-full column
      for (let c = 0; c < COLS; c++) {
        if (this.getLandingRow(c) >= 0) { col = c; break; }
      }
    }
    if (this.getLandingRow(col) < 0) {
      this.gameOver();
      return;
    }

    const x = this.colCenterX(col);
    const y = this.gridTop - BLOCK_SIZE;

    const blockObj = this.createBlockVisual(x, y, value);
    this.fallingBlock = {
      col,
      value,
      x,
      y,
      ...blockObj,
    };

    this.highlightColumn(col);
  }

  /**
   * Get center X position for a column
   */
  colCenterX(col) {
    return this.gridLeft + col * (BLOCK_SIZE + GAP) + BLOCK_SIZE / 2;
  }

  /**
   * Get Y position for a grid row (0 = top)
   */
  rowY(row) {
    return this.gridTop + row * (BLOCK_SIZE + GAP) + BLOCK_SIZE / 2;
  }

  /**
   * Get the landing row for a block in a column
   */
  getLandingRow(col) {
    const colStack = this.grid[col];
    return this.maxRows - 1 - colStack.length;
  }

  /**
   * Create the visual components for a block (optionally scaled)
   */
  createBlockVisual(x, y, value, scale = 1) {
    const color = this.getColorFromValue(value);
    const w = BLOCK_SIZE * scale;
    const h = BLOCK_SIZE * scale;
    const r = 20 * scale;

    // Shadow
    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 6, w, h, r);
    shadow.setDepth(0);

    // Main block
    const graphics = this.add.graphics();
    graphics.fillStyle(color, 1);
    graphics.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    // Highlight
    graphics.fillStyle(0xffffff, 0.25);
    graphics.fillRoundedRect(
      x - w / 2 + 6 * scale, y - h / 2 + 4 * scale,
      w - 12 * scale, h * 0.4,
      { tl: r - 4 * scale, tr: r - 4 * scale, bl: 0, br: 0 }
    );
    // Border
    graphics.lineStyle(3, 0xffffff, 0.5);
    graphics.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);
    graphics.setDepth(1);

    // Value text
    const fontSize = Math.round(52 * scale);
    const text = this.add.text(x, y, value.toString(), {
      font: `bold ${fontSize}px Arial`,
      fill: '#ffffff',
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    return { graphics, text, shadow, value, x, y };
  }

  /**
   * Redraw a block visual at a new position
   */
  redrawBlockAt(blockObj, x, y) {
    const color = this.getColorFromValue(blockObj.value);
    const w = BLOCK_SIZE;
    const h = BLOCK_SIZE;
    const r = 20;

    blockObj.shadow.clear();
    blockObj.shadow.fillStyle(0x000000, 0.2);
    blockObj.shadow.fillRoundedRect(x - w / 2 + 4, y - h / 2 + 6, w, h, r);

    blockObj.graphics.clear();
    blockObj.graphics.fillStyle(color, 1);
    blockObj.graphics.fillRoundedRect(x - w / 2, y - h / 2, w, h, r);
    blockObj.graphics.fillStyle(0xffffff, 0.25);
    blockObj.graphics.fillRoundedRect(
      x - w / 2 + 6, y - h / 2 + 4,
      w - 12, h * 0.4,
      { tl: r - 4, tr: r - 4, bl: 0, br: 0 }
    );
    blockObj.graphics.lineStyle(3, 0xffffff, 0.5);
    blockObj.graphics.strokeRoundedRect(x - w / 2, y - h / 2, w, h, r);

    blockObj.text.setPosition(x, y);
    blockObj.x = x;
    blockObj.y = y;
  }

  /**
   * Highlight the active column arrow
   */
  highlightColumn(col) {
    this.arrowIndicators.forEach((arrow, i) => {
      arrow.setAlpha(i === col ? 0.9 : 0.25);
    });
  }

  /**
   * Handle pointer — tap a column to move the falling block there
   */
  handlePointerDown(pointer) {
    if (this.isGameOver || !this.fallingBlock || this.isPlacing) return;
    if (gameStore.getState().isPaused) return;

    const tapX = pointer.x;

    let targetCol = -1;
    for (let c = 0; c < COLS; c++) {
      const cx = this.colCenterX(c);
      if (Math.abs(tapX - cx) < (BLOCK_SIZE + GAP) / 2) {
        targetCol = c;
        break;
      }
    }

    if (targetCol < 0) return;

    // Check if column is full
    if (this.getLandingRow(targetCol) < 0) {
      this.flashColumn(targetCol, 0xff4757);
      return;
    }

    if (targetCol === this.fallingBlock.col) {
      // Same column — hard drop instantly
      const landingRow = this.getLandingRow(targetCol);
      const targetY = this.rowY(landingRow);
      this.fallingBlock.y = targetY;
      this.redrawBlockAt(this.fallingBlock, this.colCenterX(targetCol), targetY);
      this.placeBlock();
    } else {
      this.fallingBlock.col = targetCol;
      const newX = this.colCenterX(targetCol);
      this.redrawBlockAt(this.fallingBlock, newX, this.fallingBlock.y);
      this.highlightColumn(targetCol);

      if (this.soundManager) {
        this.soundManager.play('drag_start');
      }
    }
  }

  /**
   * Flash a column highlight briefly
   */
  flashColumn(col, color) {
    const highlight = this.columnHighlights[col];
    if (!highlight) return;
    highlight.clear();
    highlight.fillStyle(color, 0.2);
    const cx = this.gridLeft + col * (BLOCK_SIZE + GAP);
    const gridHeight = this.maxRows * (BLOCK_SIZE + GAP) - GAP;
    highlight.fillRoundedRect(cx - 2, this.gridTop, BLOCK_SIZE + 4, gridHeight, 8);
    highlight.setAlpha(1);
    this.tweens.add({
      targets: highlight,
      alpha: 0,
      duration: 400,
      ease: 'Quad.easeOut',
    });
  }

  /**
   * Place the falling block in the grid and check for merges
   */
  placeBlock() {
    if (!this.fallingBlock) return;
    this.isPlacing = true;

    const { col, value } = this.fallingBlock;
    const x = this.colCenterX(col);
    const colStack = this.grid[col];

    // Merge if top of stack matches
    if (colStack.length > 0 && colStack[colStack.length - 1].value === value) {
      const topBlock = colStack[colStack.length - 1];
      const newValue = topBlock.value + value;

      topBlock.graphics.destroy();
      topBlock.text.destroy();
      topBlock.shadow.destroy();

      this.fallingBlock.graphics.destroy();
      this.fallingBlock.text.destroy();
      this.fallingBlock.shadow.destroy();

      const mergedY = this.rowY(this.maxRows - 1 - (colStack.length - 1));
      const mergedVisual = this.createBlockVisual(x, mergedY, newValue);

      colStack[colStack.length - 1] = { value: newValue, ...mergedVisual };

      this.tweens.add({
        targets: mergedVisual.graphics,
        scaleX: { from: 0.5, to: 1 },
        scaleY: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Back.easeOut',
      });
      this.tweens.add({
        targets: mergedVisual.text,
        scale: { from: 0.5, to: 1 },
        duration: 200,
        ease: 'Back.easeOut',
      });

      this.createMergeParticles(x, mergedY, newValue);

      if (this.soundManager) {
        this.soundManager.play('merge');
        this.soundManager.play('merge_pop');
      }

      this.score += value;
      gameStore.addScore(value);
      gameStore.incrementMergeCount();
      this.updateMaxBlock();
      this.updateSpeed();

      this.fallingBlock = null;

      this.checkChainMerge(col, () => {
        this.isPlacing = false;
        this.time.delayedCall(250, () => this.spawnFallingBlock());
      });
      return;
    }

    // No merge — stack it
    const landingRow = this.getLandingRow(col);
    const landingY = this.rowY(landingRow);
    this.redrawBlockAt(this.fallingBlock, x, landingY);

    colStack.push({
      value,
      graphics: this.fallingBlock.graphics,
      text: this.fallingBlock.text,
      shadow: this.fallingBlock.shadow,
    });

    if (this.soundManager) {
      this.soundManager.play('drag_release');
    }

    this.fallingBlock = null;
    this.isPlacing = false;
    this.time.delayedCall(250, () => this.spawnFallingBlock());
  }

  /**
   * Update speed based on current score
   */
  updateSpeed() {
    for (let i = SPEED_TIERS.length - 1; i >= 0; i--) {
      if (this.score >= SPEED_TIERS[i].score) {
        this.currentSpeed = SPEED_TIERS[i].speed;
        return;
      }
    }
  }

  /**
   * Check if a chain merge is possible after an initial merge
   */
  checkChainMerge(col, onDone) {
    const colStack = this.grid[col];
    if (colStack.length < 2) {
      if (onDone) onDone();
      return;
    }

    const top = colStack[colStack.length - 1];
    const below = colStack[colStack.length - 2];

    if (top.value === below.value) {
      // Chain merge!
      this.time.delayedCall(300, () => {
        const newValue = top.value + below.value;
        const x = this.colCenterX(col);
        const mergedRow = this.maxRows - 1 - (colStack.length - 2);
        const mergedY = this.rowY(mergedRow);

        // Destroy both
        top.graphics.destroy();
        top.text.destroy();
        top.shadow.destroy();
        below.graphics.destroy();
        below.text.destroy();
        below.shadow.destroy();

        // Remove both from stack
        colStack.splice(colStack.length - 2, 2);

        // Create merged
        const mergedVisual = this.createBlockVisual(x, mergedY, newValue);
        colStack.push({
          value: newValue,
          ...mergedVisual,
        });

        this.tweens.add({
          targets: mergedVisual.text,
          scale: { from: 0, to: 1 },
          duration: 250,
          ease: 'Back.easeOut',
        });

        this.createMergeParticles(x, mergedY, newValue);

        if (this.soundManager) {
          this.soundManager.play('merge');
        }

        this.score += top.value;
        gameStore.addScore(top.value);
        this.updateMaxBlock();

        // Recurse
        this.checkChainMerge(col, onDone);
      });
    } else {
      if (onDone) onDone();
    }
  }

  /**
   * Update the maximum block value in the store
   */
  updateMaxBlock() {
    let max = 0;
    for (let c = 0; c < COLS; c++) {
      for (const cell of this.grid[c]) {
        if (cell.value > max) max = cell.value;
      }
    }
    gameStore.setMaxBlockValue(max);
  }

  /**
   * Game Over
   */
  gameOver() {
    this.isGameOver = true;
    this.isPlacing = true;
    gameStore.setState({ isGameOver: true });
    gameStore.clearGameState('drop');

    if (this.soundManager) {
      this.soundManager.play('level_failed');
      const phrases = ['Game over! Nice try!', 'Good game! Play again?', 'So close! Try again!', 'Great effort! One more time!'];
      const phrase = phrases[Math.floor(Math.random() * phrases.length)];
      this.time.delayedCall(600, () => this.soundManager.speak(phrase));
    }

    // Destroy falling block
    if (this.fallingBlock) {
      this.fallingBlock.graphics.destroy();
      this.fallingBlock.text.destroy();
      this.fallingBlock.shadow.destroy();
      this.fallingBlock = null;
    }
    if (this.nextPreview) {
      this.nextPreview.graphics.destroy();
      this.nextPreview.text.destroy();
      this.nextPreview.shadow.destroy();
      this.nextPreview = null;
    }

    const { width, height } = this.scale;

    // Overlay
    const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    overlay.setDepth(999);
    overlay.setInteractive();

    // Game Over text
    const title = this.add.text(width / 2, height / 2 - 120, 'Game Over!', {
      font: 'bold 64px Arial',
      fill: '#ff4757',
      stroke: '#000000',
      strokeThickness: 4,
    }).setOrigin(0.5).setDepth(1000).setScale(0);

    const scoreText = this.add.text(width / 2, height / 2 - 30, `Score: ${this.score}`, {
      font: 'bold 44px Arial',
      fill: '#ffffff',
    }).setOrigin(0.5).setDepth(1000).setAlpha(0);

    const maxVal = gameStore.getState().maxBlockValue;
    const bestText = this.add.text(width / 2, height / 2 + 30, `Best Block: ${maxVal}`, {
      font: '32px Arial',
      fill: '#ffd32a',
    }).setOrigin(0.5).setDepth(1000).setAlpha(0);

    // Retry button
    const btnBg = this.add.graphics();
    btnBg.fillStyle(0xff6348, 1);
    btnBg.fillRoundedRect(width / 2 - 130, height / 2 + 90, 260, 70, 35);
    btnBg.lineStyle(3, 0xffffff, 0.6);
    btnBg.strokeRoundedRect(width / 2 - 130, height / 2 + 90, 260, 70, 35);
    btnBg.setDepth(1000);
    btnBg.setAlpha(0);

    const btnText = this.add.text(width / 2, height / 2 + 125, '🔄  Play Again', {
      font: 'bold 32px Arial',
      fill: '#ffffff',
    }).setOrigin(0.5).setDepth(1001).setAlpha(0);

    const btnHit = this.add.rectangle(width / 2, height / 2 + 125, 260, 70, 0xffffff, 0);
    btnHit.setDepth(1002);
    btnHit.setInteractive({ cursor: 'pointer' });
    btnHit.setAlpha(0);
    btnHit.on('pointerdown', () => {
      this.scene.restart();
    });

    // Animations
    this.tweens.add({ targets: title, scale: 1, duration: 400, ease: 'Back.easeOut' });
    this.tweens.add({ targets: [scoreText, bestText], alpha: 1, duration: 300, delay: 400 });
    this.tweens.add({ targets: [btnBg, btnText, btnHit], alpha: 1, duration: 300, delay: 600 });
  }

  /**
   * Create particles at position
   */
  createMergeParticles(x, y, value) {
    const color = this.getColorFromValue(value);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const vel = 120 + Math.random() * 80;
      const particle = this.add.circle(x, y, 5, color, 0.8).setDepth(5);
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * vel * 0.15,
        y: y + Math.sin(angle) * vel * 0.15,
        alpha: 0,
        scale: 0.2,
        duration: 400,
        ease: 'Quad.easeOut',
        onComplete: () => particle.destroy(),
      });
    }
  }

  /**
   * Color palette matching Block.js
   */
  getColorFromValue(value) {
    const colors = {
      1: 0xff6b6b,
      2: 0xffa502,
      3: 0xffd32a,
      4: 0x2ed573,
      5: 0x1e90ff,
      6: 0xa55eea,
      7: 0xff4757,
      8: 0x3742fa,
      9: 0x2bcbba,
    };
    return colors[value % 9 || 9] || 0x95a5a6;
  }

  /**
   * Called by Controls to select a block for drag (no-op, needed for compatibility)
   */
  selectBlockForDrag() {}

  update() {
    if (this.isGameOver || !this.fallingBlock || this.isPlacing) return;
    if (gameStore.getState().isPaused) return;

    const fb = this.fallingBlock;
    const landingRow = this.getLandingRow(fb.col);
    if (landingRow < 0) {
      // Column is full — game over
      this.gameOver();
      return;
    }

    const targetY = this.rowY(landingRow);
    fb.y += this.currentSpeed;

    if (fb.y >= targetY) {
      fb.y = targetY;
      this.redrawBlockAt(fb, this.colCenterX(fb.col), fb.y);
      this.placeBlock();
    } else {
      this.redrawBlockAt(fb, this.colCenterX(fb.col), fb.y);
    }
  }

  /**
   * Save current grid state for resume later
   */
  saveState() {
    const gridData = [];
    for (let c = 0; c < COLS; c++) {
      gridData[c] = this.grid[c].map(cell => cell.value);
    }
    gameStore.saveGameState('drop', {
      grid: gridData,
      nextValue: this.nextValue,
      currentSpeed: this.currentSpeed,
    });
  }

  /**
   * Restore grid state from a save
   */
  restoreState(saveData) {
    this.score = saveData.score;
    this.currentSpeed = saveData.scene.currentSpeed;
    this.nextValue = saveData.scene.nextValue;

    gameStore.setState({
      score: saveData.score,
      mergeCount: saveData.mergeCount,
      maxBlockValue: saveData.maxBlockValue,
      isGameOver: false,
      levelComplete: false,
    });

    // Rebuild grid visuals
    for (let c = 0; c < COLS; c++) {
      const values = saveData.scene.grid[c] || [];
      for (let r = 0; r < values.length; r++) {
        const x = this.colCenterX(c);
        const y = this.rowY(this.maxRows - 1 - r);
        const visual = this.createBlockVisual(x, y, values[r]);
        this.grid[c].push({ value: values[r], ...visual });
      }
    }

    this.updateMaxBlock();
    this.showNextPreview();
    this.spawnFallingBlock();
  }

  shutdown() {
    this.input.off('pointerdown', this.handlePointerDown, this);
    window.__dropSceneSave = null;
    for (let c = 0; c < COLS; c++) {
      for (const cell of this.grid[c]) {
        cell.graphics.destroy();
        cell.text.destroy();
        cell.shadow.destroy();
      }
    }
    this.grid = [];
    if (this.fallingBlock) {
      this.fallingBlock.graphics.destroy();
      this.fallingBlock.text.destroy();
      this.fallingBlock.shadow.destroy();
      this.fallingBlock = null;
    }
    if (this.nextPreview) {
      this.nextPreview.graphics.destroy();
      this.nextPreview.text.destroy();
      this.nextPreview.shadow.destroy();
      this.nextPreview = null;
    }
  }
}
