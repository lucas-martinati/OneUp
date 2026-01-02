// Sound manager using Web Audio API for programmatically generated sounds
// Respects user settings for sound enablement

let settingsGetter = null;
let audioContext = null;

// Initialize audio context on first use
function getAudioContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
}

// Allow injection of settings getter from the app
export function setSoundSettingsGetter(getter) {
  settingsGetter = getter;
}

// Generate success sound - cheerful upbeat tones
function playSuccessSound() {
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  
  // Create oscillator for main tone
  const oscillator1 = ctx.createOscillator();
  const oscillator2 = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  // Connect nodes
  oscillator1.connect(gainNode);
  oscillator2.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  // Set frequencies for pleasant chord (C major)
  oscillator1.frequency.setValueAtTime(523.25, currentTime); // C5
  oscillator2.frequency.setValueAtTime(659.25, currentTime); // E5
  
  // Set oscillator types
  oscillator1.type = 'sine';
  oscillator2.type = 'sine';
  
  // Envelope for volume
  gainNode.gain.setValueAtTime(0, currentTime);
  gainNode.gain.linearRampToValueAtTime(0.3, currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.5);
  
  // Start and stop
  oscillator1.start(currentTime);
  oscillator2.start(currentTime);
  oscillator1.stop(currentTime + 0.5);
  oscillator2.stop(currentTime + 0.5);
  
  // Second tone for richness
  setTimeout(() => {
    const osc3 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc3.connect(gain2);
    gain2.connect(ctx.destination);
    
    osc3.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
    osc3.type = 'sine';
    
    gain2.gain.setValueAtTime(0, ctx.currentTime);
    gain2.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
    
    osc3.start();
    osc3.stop(ctx.currentTime + 0.4);
  }, 100);
}

// Generate click sound - subtle feedback
function playClickSound() {
  const ctx = getAudioContext();
  const currentTime = ctx.currentTime;
  
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  oscillator.frequency.setValueAtTime(800, currentTime);
  oscillator.type = 'sine';
  
  gainNode.gain.setValueAtTime(0.15, currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);
  
  oscillator.start(currentTime);
  oscillator.stop(currentTime + 0.1);
}

export function playSound(soundName) {
  // Check if sounds are enabled
  if (settingsGetter) {
    const settings = settingsGetter();
    if (!settings?.soundsEnabled) {
      return; // Sounds disabled, don't play
    }
  }

  try {
    if (soundName === 'success') {
      playSuccessSound();
    } else if (soundName === 'click') {
      playClickSound();
    }
  } catch (err) {
    // Silently fail if audio can't play
    console.debug('Sound play failed:', err);
  }
}

export const sounds = {
  success: () => playSound('success'),
  click: () => playSound('click')
};

