package com.lucasm548.oneup.wear;

/** Mirrors shared/exerciseLevels.js, including coincident early-day thresholds. */
public final class WatchMath {
    private WatchMath() {}
    public static int level(int count, int goal) {
        if (count <= 0 || goal <= 0) return 0;
        for (int level = 10; level >= 1; level--) {
            if (count >= Math.max(1, (int) Math.ceil((double) goal * level / 10))) return level;
        }
        return 0;
    }
    public static int wrap(int index, int direction, int size) {
        return size > 0 ? Math.floorMod(index + direction, size) : 0;
    }
}
