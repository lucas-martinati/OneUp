import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Stub Audio before importing so the module-level preloadSound() calls succeed
// and we can observe play() on the clones.
const playSpy = vi.fn(() => Promise.resolve());
class AudioStub {
  constructor(src) { this.src = src; this.preload = ''; }
  cloneNode() { return { volume: 0, play: playSpy }; }
}

beforeEach(() => {
  vi.resetModules();
  vi.clearAllMocks();
  vi.stubGlobal('Audio', AudioStub);
});
afterEach(() => vi.unstubAllGlobals());

async function load() {
  return import('@utils/soundManager');
}

describe('soundManager', () => {
  it('plays the common success sound', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.9); // > 5 → common
    const { sounds } = await load();
    sounds.success();
    expect(playSpy).toHaveBeenCalled();
    Math.random.mockRestore();
  });

  it('selects the rare and ultra-rare success variants', async () => {
    const { sounds } = await load();
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.04); // < 5 → rare
    sounds.success();
    vi.spyOn(Math, 'random').mockReturnValueOnce(0.0); // < 0.01 → ultra rare
    sounds.success();
    expect(playSpy).toHaveBeenCalledTimes(2);
    Math.random.mockRestore();
  });

  it('plays the poke sound', async () => {
    const { sounds } = await load();
    sounds.poke();
    expect(playSpy).toHaveBeenCalled();
  });

  it('does nothing when sounds are disabled by the settings getter', async () => {
    const { sounds, setSoundSettingsGetter } = await load();
    setSoundSettingsGetter(() => ({ soundsEnabled: false }));
    sounds.success();
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('plays when the settings getter enables sounds', async () => {
    const { sounds, setSoundSettingsGetter } = await load();
    setSoundSettingsGetter(() => ({ soundsEnabled: true }));
    sounds.poke();
    expect(playSpy).toHaveBeenCalled();
  });
});
