/**
 * ad-config.js � Central Ad Units Config
 * Har domain ki apni config file hogi, bas values change karo.
 * Yeh file <head> mein SABSE PEHLE load karo (adsess.js se bhi pehle).
 *
 * Usage:  <script src="/js/ad-config.js"></script>
 */

window.adUnits = {
  // --- Display Ads ---
  //slot1: '/23330730517/turboquestz.com_d1',   // Top banner
  //slot2: '/23330730517/turboquestz.com_d2',   // Mid banner (question ke neeche)
  //// --- Rewarded Ad ---
  reward: '/23330730517/turboquestz.com_reward',

  // --- Interstitial (agar use ho) ---
  // interstitial: '/23330730517/turboquestz.com_interstitial',

  // --- Slot Sizes (common) ---
  //bannerSizes: [[300, 250], [320, 300], [250, 250], [300, 280], [300, 100]],
};

/**
 * =====================================================
 * DUSRE DOMAIN KE LIYE EXAMPLE (copy karo, values badlo):
 * =====================================================
 *
 * window.adUnits = {
 *   slot1:       '/23353868385/otherdomain.com_d1',
 *   slot2:       '/23353868385/otherdomain.com_d2',
 *   reward:      '/23353868385/otherdomain.com_reward',
 *   bannerSizes: [[300, 250], [320, 300], [250, 250], [300, 280], [300, 100]],
 * };
 */