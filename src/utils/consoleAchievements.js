/**
 * Console utilities for testing achievements
 * Access via: window.__testAchievements.showBadge('first_share')
 * 
 * Usage:
 *   window.__testAchievements.showBadge('first_share')  - Show notification
 */

window.__testAchievements = {
  /**
   * Show a badge unlock notification
   * @param {string} badgeId - The badge ID to show (e.g., 'first_share', 'first_blood')
   */
  showBadge: function(badgeId) {
    const event = new CustomEvent('show-achievement', { 
      detail: { badgeId } 
    });
    window.dispatchEvent(event);
    console.log('🎖️ Achievement notification:', badgeId);
  },

  /**
   * Show a custom achievement notification
   * @param {string} title - Title to display
   * @param {string} color - Hex color
   */
  showCustom: function(title, color = '#fbbf24') {
    const event = new CustomEvent('show-achievement-custom', { 
      detail: { title, color } 
    });
    window.dispatchEvent(event);
    console.log('🎖️ Custom achievement:', title);
  }
};