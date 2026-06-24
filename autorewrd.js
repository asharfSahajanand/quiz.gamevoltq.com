/**
 * auto-reward.js � Auto Rewarded Ad Logic (Session Based)
 *
 * Kya karta hai:
 *   - Inactive users ko ek baar reward popup dikhata hai
 *   - Active users ko har 3rd visit pe reward dikhata hai
 *
 * Dependencies (pehle load hone chahiye):
 *   1. ad-config.js        ? window.adUnits define karta hai
 *   2. adsess.js           ? window.__sessionActive / __sessionInActive set karta hai
 *   3. gpt.js              ? Google Publisher Tag (adsess.js khud load karta hai)
 *
 * Load order in HTML:
 *   <script src="/js/ad-config.js"></script>
 *   <script src="/js/adsess.js"></script>
 *   <script src="/js/auto-reward.js"></script>
 *
 * NOTE: Yeh file showRewardAd() (Claim button) ko bilkul touch nahi karti.
 */

(function () {
  var rewardEnabled = true;

  // -----------------------------------------------
  // Reward Popup UI (inactive users ke liye)
  // -----------------------------------------------
  function createRewardPopup(onWatchAdClick) {
    if (document.getElementById('custom-reward-popup')) return;

    var overlay = document.createElement('div');
    overlay.id = 'custom-reward-popup';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0',
      'width:100vw', 'height:100vh',
      'background-color:rgba(0,0,0,0.7)',
      'display:flex', 'justify-content:center', 'align-items:center',
      'z-index:999999'
    ].join(';');

    var modal = document.createElement('div');
    modal.style.cssText = [
      'background-color:#1c1e26', 'border-radius:16px',
      'padding:24px', 'width:90%', 'max-width:340px',
      'text-align:center', 'color:#ffffff',
      'font-family:Arial,sans-serif',
      'box-shadow:0 10px 30px rgba(0,0,0,0.5)',
      'position:relative'
    ].join(';');

    // Close button
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = [
      'position:absolute', 'top:12px', 'right:16px',
      'background:none', 'border:none', 'color:#ffffff',
      'font-size:24px', 'cursor:pointer', 'outline:none', 'opacity:0.6'
    ].join(';');
    closeBtn.onmouseover = function () { closeBtn.style.opacity = '1'; };
    closeBtn.onmouseout  = function () { closeBtn.style.opacity = '0.6'; };
    closeBtn.addEventListener('click', function () {
      if (overlay.parentNode) document.body.removeChild(overlay);
    });

    // Reward tag
    var tag = document.createElement('div');
    tag.style.cssText = [
      'display:inline-flex', 'align-items:center',
      'background-color:#29b6f6', 'color:#ffffff',
      'padding:6px 12px', 'border-radius:20px',
      'font-size:12px', 'font-weight:bold', 'margin-bottom:16px'
    ].join(';');
    tag.innerHTML = '<span style="margin-right:6px;">??</span> REWARD';

    // Title
    var title = document.createElement('h2');
    title.innerText = 'Unlock the recommendation';
    title.style.cssText = 'font-size:18px;margin:0 0 12px 0;font-weight:bold;';

    // Subtitle
    var subtitle = document.createElement('p');
    subtitle.innerText = 'We found something made for you. Watch a short ad to continue.';
    subtitle.style.cssText = [
      'font-size:14px', 'color:#a0a0a0',
      'margin:0 0 24px 0', 'line-height:1.4'
    ].join(';');

    // Watch Ad button
    var btn = document.createElement('button');
    btn.innerHTML = '<span style="margin-right:8px;">?</span> Watch ad and continue';
    btn.style.cssText = [
      'width:100%', 'padding:14px',
      'border:2px solid #5ed0ff', 'border-radius:12px',
      'background:linear-gradient(90deg,#8a2be2,#00bfff)',
      'color:#fff', 'font-size:16px', 'font-weight:bold',
      'cursor:pointer', 'margin-bottom:16px', 'outline:none'
    ].join(';');

    // Bottom note
    var bottomText = document.createElement('p');
    bottomText.innerText = 'You will see an ad in exchange for the content.';
    bottomText.style.cssText = 'font-size:12px;color:#707070;margin:0;';

    modal.appendChild(closeBtn);
    modal.appendChild(tag);
    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(btn);
    modal.appendChild(bottomText);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    btn.addEventListener('click', function () {
      if (overlay.parentNode) document.body.removeChild(overlay);
      onWatchAdClick();
    });
  }

  // -----------------------------------------------
  // Main Auto-Reward Logic
  // -----------------------------------------------
  if (!rewardEnabled) return;

  var sessionChecker = setInterval(function () {
    var isActive   = window.__sessionActive   === true;
    var isInActive = window.__sessionInActive === true;

    if (!isActive && !isInActive) return; // abhi ready nahi

    clearInterval(sessionChecker);

    // --- Decide karo dikhana hai ya nahi ---
    var shouldShow = false;

    if (isInActive) {
      var inactiveShown = (
        localStorage.getItem('inactiveRewardShown') === 'true' ||
        localStorage.getItem('rewardShown')         === 'true'
      );
      if (!inactiveShown) shouldShow = true;

    } else if (isActive) {
      var activeVisitCount = parseInt(localStorage.getItem('activeVisitCount') || '0', 10);
      activeVisitCount++;
      localStorage.setItem('activeVisitCount', activeVisitCount);
      if (activeVisitCount % 3 === 1) shouldShow = true;
    }

    if (!shouldShow) return;

    // --- GPT Rewarded Slot ---
    window.googletag = window.googletag || { cmd: [] };

    googletag.cmd.push(function () {
      var rewardAdUnit = (window.adUnits && window.adUnits.reward)
        ? window.adUnits.reward
        : '/23330730517/turboquestz.com_reward'; // fallback

      var rewardedSlot = googletag.defineOutOfPageSlot(
        rewardAdUnit,
        googletag.enums.OutOfPageFormat.REWARDED
      );

      if (!rewardedSlot) {
        console.log('[auto-reward] Rewarded ads not supported on this device.');
        return;
      }

      rewardedSlot.addService(googletag.pubads());

      googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
        console.log('[auto-reward] Rewarded ad ready.');
        if (isInActive) {
          createRewardPopup(function () {
            event.makeRewardedVisible();
            localStorage.setItem('inactiveRewardShown', 'true');
          });
        } else {
          event.makeRewardedVisible();
        }
      });

      googletag.pubads().addEventListener('rewardedSlotGranted', function () {
        console.log('[auto-reward] Reward granted.');
      });

      googletag.pubads().addEventListener('rewardedSlotClosed', function () {
        console.log('[auto-reward] Rewarded ad closed.');
        googletag.destroySlots([rewardedSlot]);
      });

      googletag.enableServices();
      googletag.display(rewardedSlot);
    });

  }, 1000);

})();