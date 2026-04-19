package com.lucasm548.oneup;

/**
 * Separate provider class for the large (4x2) widget.
 * Android requires a distinct class per widget type in the manifest.
 * All logic is shared with StreakWidgetProvider.
 */
public class StreakWidgetLargeProvider extends StreakWidgetProvider {
    // Inherits all behavior from StreakWidgetProvider.
    // The onUpdate method checks widget size to decide which layout to use.
}
