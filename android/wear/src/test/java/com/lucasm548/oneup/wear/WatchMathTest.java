package com.lucasm548.oneup.wear;
import org.junit.Test;
import static org.junit.Assert.*;
public class WatchMathTest {
    @Test public void levelsMatchRoundedThresholds() {
        assertEquals(0, WatchMath.level(0, 50)); assertEquals(6, WatchMath.level(30, 50));
        assertEquals(10, WatchMath.level(50, 50)); assertEquals(3, WatchMath.level(1, 3));
        assertEquals(6, WatchMath.level(2, 3)); assertEquals(10, WatchMath.level(1, 1));
    }
    @Test public void exerciseNavigationWrapsBothWays() {
        assertEquals(0, WatchMath.wrap(2, 1, 3)); assertEquals(2, WatchMath.wrap(0, -1, 3));
        assertEquals(0, WatchMath.wrap(0, -1, 1)); assertEquals(0, WatchMath.wrap(0, 1, 0));
    }
}
