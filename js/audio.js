// ============================================================
// AUDIO MANAGER - Handles all audio
// ============================================================
class AudioManager {
    constructor() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sounds = this.initializeSounds();
    }

    initializeSounds() {
        return {
            shoot: this.createSound({ type: 'shoot', duration: 0.1 }),
            hit: this.createSound({ type: 'hit', duration: 0.15 }),
            death: this.createSound({ type: 'death', duration: 0.3 }),
            reload: this.createSound({ type: 'reload', duration: 0.5 }),
            purchase: this.createSound({ type: 'purchase', duration: 0.4 })
        };
    }

    createSound(config) {
        const duration = config.duration || 0.2;
        const sampleRate = this.audioContext.sampleRate;
        const samples = Math.floor(sampleRate * duration);
        const buffer = this.audioContext.createBuffer(1, samples, sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < samples; i++) {
            const t = i / sampleRate;
            let sample = 0;

            if (config.type === 'shoot') {
                sample = Math.random() * 0.3 * Math.exp(-t * 10) * Math.sin(t * 1000);
            } else if (config.type === 'hit') {
                sample = Math.random() * 0.2 * Math.exp(-t * 15) * Math.sin(t * 800);
            } else if (config.type === 'death') {
                sample = Math.random() * 0.4 * Math.exp(-t * 5) * Math.sin(t * 200 + t * t * 1000);
            } else if (config.type === 'reload') {
                sample = 0.1 * Math.sin(t * 400) * Math.exp(-t * 3);
            } else if (config.type === 'purchase') {
                sample = 0.2 * Math.sin(t * 600 + Math.sin(t * 10) * 2) * Math.exp(-t * 2);
            }
            data[i] = sample;
        }
        return buffer;
    }

    play(soundType) {
        const buffer = this.sounds[soundType];
        if (!buffer) return;
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(this.audioContext.destination);
        source.start();
    }
}

export { AudioManager };