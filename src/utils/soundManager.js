// Sound manager with rarity-based audio files
// Respects user settings for sound enablement
import { createLogger } from './logger';

const logger = createLogger('SoundManager');

let settingsGetter = null;
const soundCache = {};

// Allow injection of settings getter from the app
export function setSoundSettingsGetter(getter) {
  settingsGetter = getter;
}

// Preload audio files
function preloadSound(name, path) {
  if (!soundCache[name]) {
    const audio = new Audio(path);
    audio.preload = 'auto';
    soundCache[name] = audio;
  }
  return soundCache[name];
}

// Preload all success sound variants
preloadSound('success', 'sounds/success.mp3');      // Common - 95%
preloadSound('perfect', 'sounds/perfect.mp3');      // Rare - 4.99%
preloadSound('yaaas', 'sounds/yaaas.mp3');          // Ultra Rare - 0.01%

// Select success sound based on rarity
function getSuccessSound() {
  const random = Math.random() * 100; // 0-100
  
  if (random < 0.01) {
    // 0.01% chance - ULTRA RARE! 🌟
    logger.success('🌟 ULTRA RARE SOUND! YAAAS!');
    return 'yaaas';
  } else if (random < 5.00) {
    // 4.99% chance - RARE! ⭐
    logger.success('⭐ RARE SOUND! PERFECT!');
    return 'perfect';
  } else {
    // 95% chance - COMMON
    return 'success';
  }
};

// Play audio file
function playAudioFile(soundName) {
  const audio = soundCache[soundName];
  if (!audio) {
    logger.warn(`Sound not found: ${soundName}`);
    return;
  }
  
  // Clone the audio to allow overlapping plays
  const clone = audio.cloneNode();
  clone.volume = 0.6; // Set reasonable volume
  
  clone.play().catch(err => {
    // Silently fail if audio can't play (e.g., user hasn't interacted yet)
    console.debug('Sound play failed:', err);
  });
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
      // Use rarity system for success sounds
      const selectedSound = getSuccessSound();
      playAudioFile(selectedSound);
    } else if (soundName === 'click') {
      playAudioFile('click');
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

