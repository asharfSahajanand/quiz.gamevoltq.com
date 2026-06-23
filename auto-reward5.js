/**
 * auto-reward.js � Final Version
 *
 * FLOW:
 *   UTM (utm_campign=allcountry) ? UTM URL strip ? hit-count check ? reward sirf 1,4,8,12,16... pe
 *   Direct domain                ? Watch Ad popup ? reward (HAR baar dialog, koi block nahi)
 */

(function () {
  'use strict';

  var rewardEnabled = true;
  if (!rewardEnabled) return;

  var UTM_KEY = 'utm_campign';
  var UTM_VAL = 'allcountry';

  // -- UTM reward pattern config -----------------------------------
  // Reward milega hit #1 pe, fir har +4 ke gap pe: 1, 4, 8, 12, 16, 20...
  var UTM_FIRST_REWARD_HIT = 1;
  var UTM_REWARD_STEP      = 3;
  var UTM_HIT_COUNT_KEY    = 'utmRewardHitCount';

  // -- Debug helper ----------------------------------------------
  function dbg(msg, data, color) {
    if (window._dbg) window._dbg('[auto-reward] ' + msg, data, color);
    else console.log('[auto-reward]', msg, data !== undefined ? data : '');
  }

  // -- UTM check + URL clean karo --------------------------------
  function getSessionType() {
    try {
      var url    = new URL(window.location.href);
      var params = url.searchParams;
      var utmVal = params.get(UTM_KEY);
      var isActive = (utmVal === UTM_VAL);

      if (isActive) {
        // UTM params URL se hata do (clean URL, back button me nahi aayega)
        var utmKeys = [
          'utm_campign', 'utm_source', 'utm_medium',
          'utm_campaign', 'utm_term', 'utm_content', 'utm_id'
        ];
        utmKeys.forEach(function(k) { params.delete(k); });
        var cleanUrl = url.pathname + (params.toString() ? '?' + params.toString() : '') + url.hash;
        history.replaceState(null, document.title, cleanUrl);
        dbg('UTM stripped from URL ? ACTIVE user', utmVal, '#88ff88');
        return 'active';
      }

      dbg('No UTM ? INACTIVE user', null, '#ffaa00');
      return 'inactive';

    } catch (e) {
      dbg('URL parse error ? inactive fallback', e.message, '#ff4444');
      return 'inactive';
    }
  }

  // -- UTM user ka hit counter (per browser/device, localStorage) --
  // Har visit pe +1, return karta hai ki ye hit reward-eligible hai ya nahi.
  function bumpUtmHitCountAndCheckReward() {
    var count;
    try {
      count = parseInt(localStorage.getItem(UTM_HIT_COUNT_KEY), 10);
      if (isNaN(count) || count < 0) count = 0;
    } catch (e) {
      count = 0;
    }

    count += 1;

    try {
      localStorage.setItem(UTM_HIT_COUNT_KEY, String(count));
    } catch (e) {
      dbg('localStorage write failed for hit count', e.message, '#ff4444');
    }

    var isEligible;
    if (count < UTM_FIRST_REWARD_HIT) {
      isEligible = false;
    } else if (count === UTM_FIRST_REWARD_HIT) {
      isEligible = true;
    } else {
      isEligible = ((count - UTM_FIRST_REWARD_HIT) % UTM_REWARD_STEP === 0);
    }

    dbg('UTM hit #' + count + (isEligible ? ' ? REWARD ELIGIBLE' : ' ? skip (no reward this hit)'), null, isEligible ? '#88ff88' : '#888888');

    return isEligible;
  }

  // -- Smooth entrance animation styles -------------------------
  var ANIM_STYLE = [
    '@keyframes ar-fadeIn { from { opacity:0; transform:scale(0.92) translateY(18px); } to { opacity:1; transform:scale(1) translateY(0); } }',
    '@keyframes ar-bgIn   { from { opacity:0; } to { opacity:1; } }',
    '.ar-overlay { animation: ar-bgIn 0.35s ease forwards; }',
    '.ar-modal   { animation: ar-fadeIn 0.38s cubic-bezier(.22,.68,0,1.2) 0.1s both; }'
  ].join('\n');

  function injectStyles() {
    if (document.getElementById('ar-styles')) return;
    var s = document.createElement('style');
    s.id = 'ar-styles';
    s.textContent = ANIM_STYLE;
    document.head.appendChild(s);
  }

  // -- Watch Ad Popup --------------------------------------------
  function createRewardPopup(onWatchAdClick) {
    if (document.getElementById('custom-reward-popup')) return;
    injectStyles();

    var overlay = document.createElement('div');
    overlay.id = 'custom-reward-popup';
    overlay.className = 'ar-overlay';
    overlay.style.cssText = [
      'position:fixed', 'top:0', 'left:0',
      'width:100vw', 'height:100vh',
      'background-color:rgba(0,0,0,0.72)',
      'display:flex', 'justify-content:center', 'align-items:center',
      'z-index:999999'
    ].join(';');

    var modal = document.createElement('div');
    modal.className = 'ar-modal';
    modal.style.cssText = [
      'background:linear-gradient(145deg,#1c1e26,#252836)',
      'border-radius:20px',
      'padding:28px 24px',
      'width:90%', 'max-width:340px',
      'text-align:center', 'color:#fff',
      'font-family:Arial,sans-serif',
      'box-shadow:0 20px 60px rgba(0,0,0,0.6)',
      'position:relative',
      'border:1px solid rgba(255,255,255,0.07)'
    ].join(';');

    // Close btn
    var closeBtn = document.createElement('button');
    closeBtn.innerHTML = '&times;';
    closeBtn.style.cssText = [
      'position:absolute', 'top:14px', 'right:18px',
      'background:none', 'border:none', 'color:rgba(255,255,255,0.5)',
      'font-size:26px', 'cursor:pointer', 'outline:none',
      'line-height:1', 'padding:0', 'transition:color 0.2s'
    ].join(';');
    closeBtn.onmouseover = function () { closeBtn.style.color = '#fff'; };
    closeBtn.onmouseout  = function () { closeBtn.style.color = 'rgba(255,255,255,0.5)'; };
    closeBtn.addEventListener('click', function () {
      overlay.style.opacity = '0';
      overlay.style.transition = 'opacity 0.25s';
      setTimeout(function() {
        if (overlay.parentNode) document.body.removeChild(overlay);
      }, 250);
      dbg('Popup closed by user', null, '#888888');
    });

    // Coin icon
    var iconWrap = document.createElement('div');
    iconWrap.style.cssText = 'font-size:48px;margin-bottom:12px;line-height:1;';
    iconWrap.innerHTML = '&#127873;';

    // Tag
    var tag = document.createElement('div');
    tag.style.cssText = [
      'display:inline-flex', 'align-items:center',
      'background:linear-gradient(90deg,#29b6f6,#0288d1)',
      'color:#fff', 'padding:5px 14px', 'border-radius:20px',
      'font-size:11px', 'font-weight:bold',
      'letter-spacing:0.8px', 'margin-bottom:18px'
    ].join(';');
    tag.innerText = 'FREE REWARD';

    // Title
    var title = document.createElement('h2');
    title.innerText = 'Get 100 Coins Free!';
    title.style.cssText = 'font-size:20px;margin:0 0 8px 0;font-weight:700;color:#fff;';

    // Subtitle
    var subtitle = document.createElement('p');
    subtitle.innerText = 'Watch a short ad and claim your coins instantly.';
    subtitle.style.cssText = 'font-size:13px;color:#9a9db0;margin:0 0 22px 0;line-height:1.5;';

    // Watch button
    var btn = document.createElement('button');
    btn.style.cssText = [
      'width:100%', 'padding:15px',
      'border:none', 'border-radius:14px',
      'background:linear-gradient(90deg,#7c3aed,#2563eb)',
      'color:#fff', 'font-size:15px', 'font-weight:700',
      'cursor:pointer', 'margin-bottom:14px', 'outline:none',
      'box-shadow:0 4px 20px rgba(124,58,237,0.4)',
      'transition:transform 0.15s, box-shadow 0.15s',
      'display:flex', 'align-items:center', 'justify-content:center', 'gap:8px'
    ].join(';');
    btn.innerHTML = '<span style="font-size:16px;">&#9654;</span> Watch Ad &amp; Claim';
    btn.onmouseover = function() { btn.style.transform='scale(1.03)'; btn.style.boxShadow='0 6px 28px rgba(124,58,237,0.55)'; };
    btn.onmouseout  = function() { btn.style.transform='scale(1)';    btn.style.boxShadow='0 4px 20px rgba(124,58,237,0.4)';  };

    // Note
    var note = document.createElement('p');
    note.innerText = 'Short ad � Free coins � No signup needed';
    note.style.cssText = 'font-size:11px;color:#555872;margin:0;';

    modal.appendChild(closeBtn);
    modal.appendChild(iconWrap);
    modal.appendChild(tag);
    modal.appendChild(title);
    modal.appendChild(subtitle);
    modal.appendChild(btn);
    modal.appendChild(note);
    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    btn.addEventListener('click', function () {
      btn.innerHTML = '<span style="font-size:16px;">&#9203;</span> Loading ad...';
      btn.style.opacity = '0.75';
      btn.disabled = true;
      setTimeout(function() {
        if (overlay.parentNode) document.body.removeChild(overlay);
        dbg('Watch Ad clicked ? launching reward', null, '#88ffff');
        onWatchAdClick();
      }, 400);
    });
  }

  // -- GPT Rewarded Slot -----------------------------------------
  function launchRewardedAd(isInactive) {
    window.googletag = window.googletag || { cmd: [] };

    googletag.cmd.push(function () {
      if (!googletag.enums ||
          !googletag.enums.OutOfPageFormat ||
          !googletag.enums.OutOfPageFormat.REWARDED) {
        dbg('? REWARDED format not supported', null, '#ff4444');
        return;
      }

      var rewardAdUnit = (window.adUnits && window.adUnits.reward)
        ? window.adUnits.reward
        : '/23353868385/champslevl.com_reward';

      dbg('Defining rewarded slot', rewardAdUnit, '#88ffff');

      var rewardedSlot = googletag.defineOutOfPageSlot(
        rewardAdUnit,
        googletag.enums.OutOfPageFormat.REWARDED
      );

      if (!rewardedSlot) {
        dbg('? defineOutOfPageSlot = null', null, '#ff4444');
        return;
      }

      rewardedSlot.addService(googletag.pubads());

      googletag.pubads().addEventListener('rewardedSlotReady', function (event) {
        dbg('? rewardedSlotReady', null, '#88ff88');

        if (isInactive) {
          // Direct user ? HAR baar popup dikhao, click ke baad ad
          createRewardPopup(function () {
            event.makeRewardedVisible();
          });
        } else {
          // UTM user ? seedha ad, koi popup nahi (hit-count eligibility already check ho gaya hai)
          event.makeRewardedVisible();
        }
      });

      googletag.pubads().addEventListener('rewardedSlotGranted', function () {
        dbg('?? Reward GRANTED', null, '#ffff00');
      });

      googletag.pubads().addEventListener('rewardedSlotClosed', function () {
        dbg('Slot closed', null, '#888888');
        googletag.destroySlots([rewardedSlot]);
      });

      googletag.enableServices();
      googletag.display(rewardedSlot);
    });
  }

  // -- Main -----------------------------------------------------
  var sessionType = getSessionType();
  var isInactive  = (sessionType === 'inactive');

  if (isInactive) {
    // Direct domain user ? ab koi "already shown" block nahi.
    // Har visit pe popup dikhega.
    dbg('Inactive � will ALWAYS show Watch Ad popup (no block)', null, '#ffaa00');
  } else {
    // UTM user ? hit counter check karo, sirf eligible hit pe reward milega
    var eligible = bumpUtmHitCountAndCheckReward();
    if (!eligible) {
      dbg('Active (UTM) � this hit not eligible for reward, skipping', null, '#888888');
      return;
    }
    dbg('Active (UTM) � eligible hit, direct reward', null, '#88ff88');
  }

  // Page load ke baad thoda wait karo � feels natural
  var delay = isInactive ? 1200 : 800;
  setTimeout(function () {
    launchRewardedAd(isInactive);
  }, delay);

})();