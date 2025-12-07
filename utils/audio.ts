import { ScoreGrade } from '../types';

export class SoundEngine {
  private drawAudio: HTMLAudioElement;
  private badAudio: HTMLAudioElement;
  private okayAudio: HTMLAudioElement;
  private perfectAudio: HTMLAudioElement;
  private isMuted: boolean = false;

  constructor() {
    this.drawAudio = new Audio('/sounds/draw.mp3');
    this.drawAudio.loop = true;
    this.drawAudio.volume = 0.5;

    this.badAudio = new Audio('/sounds/bad.mp3');
    this.okayAudio = new Audio('/sounds/okay.mp3');
    this.perfectAudio = new Audio('/sounds/perfect.mp3');
  }

  // --- NEW: Mute Toggle ---
  public setMute(muted: boolean) {
    this.isMuted = muted;
    if (muted) {
        // Stop everything immediately
        this.drawAudio.pause();
        this.badAudio.pause();
        this.okayAudio.pause();
        this.perfectAudio.pause();
    }
  }

  public startHum() {
    if (this.isMuted) return; // Don't play if muted
    this.drawAudio.currentTime = 0;
    this.drawAudio.play().catch(console.error);
  }

  public stopHum() {
    this.drawAudio.pause();
    this.drawAudio.currentTime = 0;
  }

  public playResult(grade: ScoreGrade) {
    if (this.isMuted) return; // Don't play if muted
    
    // Stop overlapping sounds
    this.badAudio.pause(); this.badAudio.currentTime = 0;
    this.okayAudio.pause(); this.okayAudio.currentTime = 0;
    this.perfectAudio.pause(); this.perfectAudio.currentTime = 0;

    switch (grade) {
      case ScoreGrade.EXCELLENT: this.perfectAudio.play().catch(console.error); break;
      case ScoreGrade.OKAY: this.okayAudio.play().catch(console.error); break;
      default: this.badAudio.play().catch(console.error); break;
    }
  }
}
export const soundEngine = new SoundEngine();