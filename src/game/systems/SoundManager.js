/**
 * SoundManager - Manages game sounds using Web Audio API
 * Generates procedural sound effects (no audio files needed)
 */
export default class SoundManager {
  constructor(scene) {
    this.scene = scene;
    this.isMuted = false;
    this.soundEnabled = true;
    this.audioCtx = null;
  }

  /**
   * Lazily create AudioContext (must be after user interaction)
   */
  getAudioContext() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play a sound effect by key
   */
  play(key) {
    if (!this.soundEnabled || this.isMuted) return;

    switch (key) {
      case 'drag_start':
        this._playTone(440, 0.08, 'sine', 0.15);
        break;
      case 'drag_release':
        this._playTone(330, 0.1, 'sine', 0.1);
        break;
      case 'merge':
        this._playMerge();
        break;
      case 'merge_pop':
        this._playPop();
        break;
      case 'level_complete':
        this._playLevelComplete();
        break;
      case 'level_failed':
        this._playLevelFailed();
        break;
      default:
        break;
    }
  }

  /**
   * Play a single tone
   */
  _playTone(freq, duration, type = 'sine', volume = 0.3) {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + duration);
  }

  /**
   * Merge sound - quick ascending notes
   */
  _playMerge() {
    this._playTone(523, 0.1, 'sine', 0.2);
    setTimeout(() => this._playTone(659, 0.1, 'sine', 0.2), 60);
    setTimeout(() => this._playTone(784, 0.15, 'sine', 0.15), 120);
  }

  /**
   * Pop sound effect
   */
  _playPop() {
    const ctx = this.getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Level complete - happy ascending fanfare
   */
  _playLevelComplete() {
    const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6
    const durations = [0.15, 0.15, 0.15, 0.3];
    let time = 0;

    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._playTone(freq, durations[i], 'sine', 0.25);
      }, time);
      time += 150;
    });
  }

  /**
   * Level failed - descending sad tones
   */
  _playLevelFailed() {
    const notes = [440, 370, 311, 262]; // A4, F#4, Eb4, C4
    const durations = [0.2, 0.2, 0.2, 0.4];
    let time = 0;

    notes.forEach((freq, i) => {
      setTimeout(() => {
        this._playTone(freq, durations[i], 'triangle', 0.2);
      }, time);
      time += 200;
    });
  }

  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }

  /**
   * Set mute state
   */
  setMuted(muted) {
    this.isMuted = muted;
  }

  /**
   * Enable/disable sounds
   */
  setEnabled(enabled) {
    this.soundEnabled = enabled;
  }

  /**
   * Get mute state
   */
  isMuted() {
    return this.isMuted;
  }
}
