/**
 * MergeSystem - Handles block merging logic
 * Detects overlaps and merges blocks when they collide
 */
import Block from '../objects/Block';
import * as gameStore from '../../store/gameStore';

export default class MergeSystem {
  constructor(scene) {
    this.scene = scene;
    this.isMerging = false; // Prevent multiple merges at once
  }

  /**
   * Apply the current operation to two values
   */
  applyOperation(a, b) {
    const op = gameStore.getState().operation || 'add';
    switch (op) {
      case 'subtract': return Math.abs(a - b);
      case 'multiply': return a * b;
      case 'divide': {
        const big = Math.max(a, b);
        const small = Math.min(a, b);
        return small === 0 ? big : Math.round(big / small);
      }
      case 'add':
      default:
        return a + b;
    }
  }

  /**
   * Check for overlaps and merge blocks if they overlap
   * Called when a block is released from dragging
   * 
   * @param {Block} draggedBlock - The block that was just released
   * @param {Block[]} allBlocks - Array of all blocks in the scene
   * @returns {Object|null} - { mergedBlock, block1, block2 } or null if no merge
   */
  checkAndMerge(draggedBlock, allBlocks) {
    // Prevent multiple merges simultaneously
    if (this.isMerging) {
      return null;
    }

    // Find a block that overlaps with the dragged block
    const targetBlock = this.findOverlapBlock(draggedBlock, allBlocks);

    if (targetBlock) {
      this.isMerging = true;
      const result = this.merge(draggedBlock, targetBlock);
      this.isMerging = false;
      return result;
    }

    return null;
  }

  /**
   * Find the first block that overlaps with the given block
   * Prevents merging the same block with itself
   * 
   * @param {Block} draggedBlock - The block to check
   * @param {Block[]} allBlocks - Array of all blocks
   * @returns {Block|null} - First overlapping block or null
   */
  findOverlapBlock(draggedBlock, allBlocks) {
    const draggedRect = draggedBlock.rectangle.getBounds();

    for (const block of allBlocks) {
      // Skip the dragged block itself
      if (block === draggedBlock) {
        continue;
      }

      // Check for rectangle overlap using Phaser's bounds
      const blockRect = block.rectangle.getBounds();
      const overlap = Phaser.Geom.Rectangle.Overlaps(draggedRect, blockRect);

      if (overlap) {
        return block;
      }
    }

    return null;
  }

  /**
   * Merge two blocks together
   * Destroys both original blocks and creates a new one with their sum
   * 
   * @param {Block} block1 - First block to merge
   * @param {Block} block2 - Second block to merge
   * @returns {Object} - { mergedBlock, block1, block2 } containing the new block and refs to old ones
   */
  merge(block1, block2) {
    // Calculate new value using current operation
    const newValue = this.applyOperation(block1.getValue(), block2.getValue());
    // Ensure value is at least 1
    const safeValue = Math.max(1, newValue);

    // Calculate midpoint position
    const pos1 = block1.getPosition();
    const pos2 = block2.getPosition();
    const midX = (pos1.x + pos2.x) / 2;
    const midY = (pos1.y + pos2.y) / 2;

    // Create new block at midpoint
    const newBlock = new Block(this.scene, midX, midY, safeValue);

    // Set initial scale to 0 for pop animation
    newBlock.rectangle.setScale(0);
    newBlock.rectangle.setAlpha(0);

    // Create text for the new block
    const newText = this.scene.add.text(
      midX,
      midY,
      safeValue.toString(),
      {
        font: 'bold 48px Arial',
        fill: '#ffffff',
        align: 'center',
      }
    );
    newText.setOrigin(0.5, 0.5);
    newText.setDepth(10);
    newText.setScale(0);
    newText.setAlpha(0);
    newBlock.setValueText(newText);

    // Add particle effect at merge point
    this.createMergeParticles(midX, midY, safeValue);

    // Destroy original blocks with fade out
    this.destroyBlockWithEffect(block1);
    this.destroyBlockWithEffect(block2);

    // Pop animation: Scale up and fade in
    this.scene.tweens.add({
      targets: [newBlock.rectangle, newText],
      scale: 1,
      alpha: { from: 0, to: 1 },
      duration: 250,
      ease: 'Back.easeOut',
      delay: 50, // Slight delay for better feel
    });

    // Add bounce effect to the new block
    this.scene.tweens.add({
      targets: newBlock.rectangle,
      y: midY - 10,
      duration: 150,
      ease: 'Quad.easeOut',
      yoyo: true,
    });

    // Play merge sound
    if (this.scene.soundManager) {
      this.scene.soundManager.play('merge', { volume: 0.7 });
      this.scene.soundManager.play('merge_pop', { volume: 0.5 });
    }

    // Show equation animation and speak it
    const op = gameStore.getState().operation || 'add';
    this.showEquation(block1.getValue(), block2.getValue(), safeValue, op, midX, midY);
    this.speakEquation(block1.getValue(), block2.getValue(), safeValue, op);

    // Update score and merge count
    gameStore.addScore(safeValue);
    gameStore.incrementMergeCount();

    return {
      mergedBlock: newBlock,
      block1,
      block2,
    };
  }

  /**
   * Reset merge state
   */
  reset() {
    this.isMerging = false;
  }

  /**
   * Create particle effect at merge point
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} value - Block value for color reference
   */
  createMergeParticles(x, y, value) {
    const particleCount = 8;
    const blockInstance = new Block(this.scene, 0, 0, value);
    const color = blockInstance.getColorFromValue(value);
    blockInstance.destroy();

    // Create burst particles
    for (let i = 0; i < particleCount; i++) {
      const angle = (i / particleCount) * Math.PI * 2;
      const velocity = 150 + Math.random() * 100;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;

      // Create small circle particle
      const particle = this.scene.add.circle(x, y, 4, color, 0.8);
      particle.setDepth(5);

      // Animate particle outward and fade
      this.scene.tweens.add({
        targets: particle,
        x: x + vx * 0.15,
        y: y + vy * 0.15,
        alpha: 0,
        scale: 0.3,
        duration: 500,
        ease: 'Quad.easeOut',
        onComplete: () => {
          particle.destroy();
        },
      });
    }

    // Create flash effect at merge point
    const flash = this.scene.add.circle(x, y, 15, 0xffffff, 0.6);
    flash.setDepth(5);

    this.scene.tweens.add({
      targets: flash,
      scale: 2,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  /**
   * Destroy block with fade-out animation
   * @param {Block} block - Block to destroy
   */
  destroyBlockWithEffect(block) {
    // Fade out animation
    this.scene.tweens.add({
      targets: [block.rectangle, block.valueText],
      alpha: 0,
      duration: 200,
      ease: 'Quad.easeIn',
      onComplete: () => {
        block.destroy();
      },
    });

    // Scale down animation
    this.scene.tweens.add({
      targets: block.rectangle,
      scale: 0.7,
      duration: 200,
      ease: 'Quad.easeIn',
    });
  }

  /**
   * Show animated equation at merge point
   * e.g. "3 + 4 = 7" floats up with color-coded operation
   */
  showEquation(val1, val2, result, op, x, y) {
    const opConfig = {
      add:      { symbol: '+', color: '#2ed573' },
      subtract: { symbol: '−', color: '#ff4757' },
      multiply: { symbol: '×', color: '#1e90ff' },
      divide:   { symbol: '÷', color: '#a55eea' },
    };
    const { symbol, color } = opConfig[op] || opConfig.add;

    // Create equation parts with different colors
    const eqText = `${val1} ${symbol} ${val2} = ${result}`;

    // Background pill
    const pillW = eqText.length * 28 + 40;
    const pillH = 64;
    const pill = this.scene.add.graphics();
    pill.fillStyle(0x000000, 0.55);
    pill.fillRoundedRect(x - pillW / 2, y - 100 - pillH / 2, pillW, pillH, pillH / 2);
    pill.setDepth(1100);

    // Number text parts
    const val1Text = this.scene.add.text(x - pillW / 2 + 24, y - 100, val1.toString(), {
      font: 'bold 40px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(1101);

    const opText = this.scene.add.text(val1Text.x + val1Text.width + 12, y - 100, symbol, {
      font: 'bold 44px Arial',
      fill: color,
    }).setOrigin(0, 0.5).setDepth(1101);

    const val2Text = this.scene.add.text(opText.x + opText.width + 12, y - 100, val2.toString(), {
      font: 'bold 40px Arial',
      fill: '#ffffff',
    }).setOrigin(0, 0.5).setDepth(1101);

    const eqSign = this.scene.add.text(val2Text.x + val2Text.width + 12, y - 100, '=', {
      font: 'bold 40px Arial',
      fill: 'rgba(255,255,255,0.7)',
    }).setOrigin(0, 0.5).setDepth(1101);

    const resText = this.scene.add.text(eqSign.x + eqSign.width + 12, y - 100, result.toString(), {
      font: 'bold 44px Arial',
      fill: '#ffd32a',
    }).setOrigin(0, 0.5).setDepth(1101);

    const allParts = [pill, val1Text, opText, val2Text, eqSign, resText];

    // Pop in
    allParts.forEach(p => { p.setScale(0); p.setAlpha(0); });
    this.scene.tweens.add({
      targets: allParts,
      scale: 1,
      alpha: 1,
      duration: 250,
      ease: 'Back.easeOut',
    });

    // Float up and fade out
    this.scene.tweens.add({
      targets: allParts,
      y: '-=80',
      alpha: 0,
      duration: 600,
      delay: 1000,
      ease: 'Quad.easeIn',
      onComplete: () => {
        allParts.forEach(p => p.destroy());
      },
    });
  }

  /**
   * Speak the equation using Web Speech API
   * "Three plus four equals seven!"
   */
  speakEquation(val1, val2, result, op) {
    if (!window.speechSynthesis) return;

    const opWords = {
      add: 'plus',
      subtract: 'minus',
      multiply: 'times',
      divide: 'divided by',
    };
    const opWord = opWords[op] || 'plus';
    const text = `${val1} ${opWord} ${val2} equals ${result}`;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1.2;
    utterance.volume = 0.8;

    // Try to pick a friendly voice
    const voices = window.speechSynthesis.getVoices();
    const preferred = voices.find(v =>
      v.name.includes('Samantha') || v.name.includes('Google') || v.lang.startsWith('en')
    );
    if (preferred) utterance.voice = preferred;

    window.speechSynthesis.speak(utterance);
  }

  /**
   * Clean up system
   */
  destroy() {
    // Nothing to clean up for now
  }
}
