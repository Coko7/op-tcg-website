// Simple audio effects using Web Audio API for card reveals
export class AudioEffects {
  private static audioContext: AudioContext | null = null;

  private static getAudioContext(): AudioContext {
    if (!this.audioContext) {
      // Try to create AudioContext with fallbacks
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioContext = new AudioContextClass();
      }
    }
    return this.audioContext!;
  }

  // Generate a card flip sound using oscillator
  static playCardFlip(): void {
    try {
      const context = this.getAudioContext();
      if (!context) return;

      // Resume context if suspended (required by some browsers)
      if (context.state === 'suspended') {
        context.resume();
      }

      const oscillator = context.createOscillator();
      const gainNode = context.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(context.destination);

      // Card flip sound: quick frequency sweep
      oscillator.frequency.setValueAtTime(200, context.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(800, context.currentTime + 0.1);
      oscillator.frequency.exponentialRampToValueAtTime(400, context.currentTime + 0.2);

      // Envelope for natural sound
      gainNode.gain.setValueAtTime(0.1, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.3, context.currentTime + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.2);

      oscillator.type = 'triangle';
      oscillator.start(context.currentTime);
      oscillator.stop(context.currentTime + 0.2);
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  // Special sound for rare cards
  static playRareCardReveal(rarity: string): void {
    try {
      const context = this.getAudioContext();
      if (!context) return;

      if (context.state === 'suspended') {
        context.resume();
      }

      // Different sounds based on rarity
      const frequencies = {
        'rare': [440, 554, 659], // C major triad
        'super_rare': [523, 659, 784, 880], // C major with higher notes
        'secret_rare': [523, 659, 784, 1047, 1319] // Extended C major
      };

      const freqs = frequencies[rarity as keyof typeof frequencies] || [440];
      const baseTime = context.currentTime;

      freqs.forEach((freq, index) => {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        const startTime = baseTime + index * 0.15;
        const duration = rarity === 'secret_rare' ? 0.4 : 0.3;

        oscillator.frequency.setValueAtTime(freq, startTime);

        // Add some sparkle with frequency modulation for secret rare
        if (rarity === 'secret_rare') {
          oscillator.frequency.exponentialRampToValueAtTime(freq * 1.2, startTime + duration * 0.5);
          oscillator.frequency.exponentialRampToValueAtTime(freq, startTime + duration);
        }

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.15, startTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.type = rarity === 'secret_rare' ? 'sine' : 'triangle';
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  // Shuffle/deck sound
  static playDeckShuffle(): void {
    try {
      const context = this.getAudioContext();
      if (!context) return;

      if (context.state === 'suspended') {
        context.resume();
      }

      // Generate multiple quick pops to simulate cards shuffling
      for (let i = 0; i < 5; i++) {
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(context.destination);

        const startTime = context.currentTime + i * 0.05;
        const freq = 150 + Math.random() * 100; // Random frequency for natural shuffle sound

        oscillator.frequency.setValueAtTime(freq, startTime);
        gainNode.gain.setValueAtTime(0.05, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.15, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.08);

        oscillator.type = 'sawtooth';
        oscillator.start(startTime);
        oscillator.stop(startTime + 0.08);
      }
    } catch (error) {
      console.log('Audio not available:', error);
    }
  }

  // Initialize audio context (call this on first user interaction)
  static initializeAudio(): void {
    try {
      this.getAudioContext();
    } catch (error) {
      console.log('Could not initialize audio:', error);
    }
  }
}