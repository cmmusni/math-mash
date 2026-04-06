export default class Block {
  constructor(scene, x, y, value) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.value = value;
    this.isDragging = false;
    this.dragOffsetX = 0;
    this.dragOffsetY = 0;
    this.valueText = null;

    // Block dimensions
    this.blockWidth = 120;
    this.blockHeight = 120;
    this.cornerRadius = 20;

    // Create shadow
    this.shadow = scene.add.graphics();
    this.shadow.fillStyle(0x000000, 0.2);
    this.shadow.fillRoundedRect(
      x - this.blockWidth / 2 + 4,
      y - this.blockHeight / 2 + 6,
      this.blockWidth,
      this.blockHeight,
      this.cornerRadius
    );
    this.shadow.setDepth(0);

    // Create the rounded rectangle using graphics
    this.graphics = scene.add.graphics();
    this._drawBlock(x, y, this.getColorFromValue(value));

    // Create an invisible interactive rectangle for hit detection
    this.rectangle = scene.add.rectangle(
      x,
      y,
      this.blockWidth,
      this.blockHeight,
      0xffffff,
      0
    );
    this.rectangle.setInteractive({ cursor: 'grab' });

    // Bind events to rectangle
    this.rectangle.on('pointerdown', this.onPointerDown, this);

    // Create physics body for the rectangle
    scene.physics.add.existing(this.rectangle);
    this.body = this.rectangle.body;

    // Configure physics body
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0.2);
    this.body.setDrag(0);
    this.body.setVelocity(0, 0);
    this.body.setMass(1);

    // Store reference back to this Block instance
    this.rectangle.blockInstance = this;
  }

  /**
   * Draw the rounded block at a position
   */
  _drawBlock(x, y, color) {
    this.graphics.clear();
    // Main fill
    this.graphics.fillStyle(color, 1);
    this.graphics.fillRoundedRect(
      x - this.blockWidth / 2,
      y - this.blockHeight / 2,
      this.blockWidth,
      this.blockHeight,
      this.cornerRadius
    );
    // Light highlight on top
    this.graphics.fillStyle(0xffffff, 0.25);
    this.graphics.fillRoundedRect(
      x - this.blockWidth / 2 + 6,
      y - this.blockHeight / 2 + 4,
      this.blockWidth - 12,
      this.blockHeight * 0.4,
      { tl: this.cornerRadius - 4, tr: this.cornerRadius - 4, bl: 0, br: 0 }
    );
    // Border
    this.graphics.lineStyle(3, 0xffffff, 0.5);
    this.graphics.strokeRoundedRect(
      x - this.blockWidth / 2,
      y - this.blockHeight / 2,
      this.blockWidth,
      this.blockHeight,
      this.cornerRadius
    );
  }

  /**
   * Get color based on block value
   */
  getColorFromValue(value) {
    const colors = {
      1: 0xff6b6b, // Coral
      2: 0xffa502, // Orange
      3: 0xffd32a, // Sunflower
      4: 0x2ed573, // Green
      5: 0x1e90ff, // Dodger Blue
      6: 0xa55eea, // Purple
      7: 0xff4757, // Watermelon
      8: 0x3742fa, // Royal Blue
      9: 0x2bcbba, // Teal
    };
    return colors[value] || 0x95a5a6;
  }

  /**
   * Handle pointer down event
   */
  onPointerDown(pointer) {
    this.isDragging = true;
    this.dragOffsetX = pointer.x - this.rectangle.x;
    this.dragOffsetY = pointer.y - this.rectangle.y;

    // Bring to front
    this.shadow.setDepth(5);
    this.graphics.setDepth(6);
    this.rectangle.setDepth(7);
    if (this.valueText) this.valueText.setDepth(8);

    // Disable velocity during drag
    this.body.setVelocity(0, 0);

    // Notify scene that this block is being dragged
    this.scene.selectBlockForDrag(this);

    // Play drag sound if sound manager available
    if (this.scene.soundManager) {
      this.scene.soundManager.play('drag_start');
    }
  }

  /**
   * Update block position while dragging
   */
  updateDrag(pointer) {
    if (this.isDragging) {
      const newX = pointer.x - this.dragOffsetX;
      const newY = pointer.y - this.dragOffsetY;

      this.rectangle.setPosition(newX, newY);
      this._drawBlock(newX, newY, this.getColorFromValue(this.value));
      
      // Update shadow
      this.shadow.clear();
      this.shadow.fillStyle(0x000000, 0.25);
      this.shadow.fillRoundedRect(
        newX - this.blockWidth / 2 + 6,
        newY - this.blockHeight / 2 + 10,
        this.blockWidth,
        this.blockHeight,
        this.cornerRadius
      );

      this.body.setVelocity(0, 0);
      this.x = newX;
      this.y = newY;
    }
  }

  /**
   * Stop dragging
   */
  stopDrag() {
    if (this.isDragging) {
      this.isDragging = false;

      // Reset depth
      this.shadow.setDepth(0);
      this.graphics.setDepth(1);
      this.rectangle.setDepth(2);
      if (this.valueText) this.valueText.setDepth(10);
      
      // Reset shadow to normal offset
      const pos = this.getPosition();
      this.shadow.clear();
      this.shadow.fillStyle(0x000000, 0.2);
      this.shadow.fillRoundedRect(
        pos.x - this.blockWidth / 2 + 4,
        pos.y - this.blockHeight / 2 + 6,
        this.blockWidth,
        this.blockHeight,
        this.cornerRadius
      );

      if (this.scene.soundManager) {
        this.scene.soundManager.play('drag_release');
      }
    }
  }

  /**
   * Get block value
   */
  getValue() {
    return this.value;
  }

  /**
   * Get world position
   */
  getPosition() {
    return { x: this.rectangle.x, y: this.rectangle.y };
  }

  /**
   * Set text element for this block
   */
  setValueText(text) {
    this.valueText = text;
  }

  /**
   * Clean up block
   */
  destroy() {
    if (this.shadow) {
      this.shadow.destroy();
    }
    if (this.graphics) {
      this.graphics.destroy();
    }
    if (this.rectangle) {
      this.rectangle.off('pointerdown', this.onPointerDown, this);
      this.rectangle.destroy();
    }
    if (this.valueText) {
      this.valueText.destroy();
    }
  }
}
