/* ============================================================
 *  DYNAMIC INTERSTITIAL ADS  (Mobile view only)
 *  Debug: console logs only. URL ?adDebug=1 for extra logs.
 * ============================================================ */
(function () {
  "use strict";

  var CONFIG = {
    enabled: true,
    mobileOnly: true,
    mobileMaxWidth: 768,
    adUnitPath: "/23353868385/champslevl.com_inter",
    triggerOnEveryClick: true,
    // Do interstitial ke beech minimum gap (ms). GAM spam bhi block karta hai.
    clickCooldownMs: 3000,
    ignoreSelectors: ["input", "textarea", "select", "[data-no-ad]"],
    loadGptIfMissing: true,
    // Page load: display/banner ads (ads.js) normal chalenge.
    // Interstitial: page load par NAHI dikhega, sirf user click par.
    showOnLoad: false,
    // Background me slot define (fast first click), par display() nahi -- interstitial nahi dikhega
    prepareSlotOnLoad: true,
    debug: true,
    gptWaitTimeoutMs: 20000,
    gptPollIntervalMs: 200
  };

  if (window.__interstitialAdsLoaded) return;
  window.__interstitialAdsLoaded = true;

  window.googletag = window.googletag || { cmd: [] };

  var interstitialSlot = null;
  var slotDefined = false;
  var adFilled = false;
  var lastShownAt = 0;
  var gptReady = false;
  var clickListenerAttached = false;
  var eventsRegistered = false;

  function isDebugOn() {
    if (CONFIG.debug) return true;
    try {
      if (/[?&]adDebug=1/.test(window.location.search)) return true;
      if (window.localStorage && localStorage.getItem("interstitialDebug") === "1") return true;
    } catch (e) {}
    return false;
  }

  function log() {
    if (!isDebugOn() || !window.console) return;
    var args = ["%c[InterstitialAds]", "color:#00bcd4;font-weight:bold"].concat([].slice.call(arguments));
    console.log.apply(console, args);
  }

  function logError() {
    if (!window.console) return;
    var args = ["%c[InterstitialAds ERROR]", "color:#f44336;font-weight:bold"].concat([].slice.call(arguments));
    console.error.apply(console, args);
  }

  function isMobileView() {
    if (!CONFIG.mobileOnly) return true;
    var w = window.innerWidth || document.documentElement.clientWidth;
    var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    return w <= CONFIG.mobileMaxWidth || coarse;
  }

  function shouldIgnore(target) {
    if (!target || !target.closest) return false;
    for (var i = 0; i < CONFIG.ignoreSelectors.length; i++) {
      try {
        if (target.closest(CONFIG.ignoreSelectors[i])) return true;
      } catch (e) {}
    }
    return false;
  }

  function isGptReady() {
    return !!(
      window.googletag &&
      typeof googletag.defineOutOfPageSlot === "function" &&
      googletag.enums &&
      googletag.enums.OutOfPageFormat &&
      googletag.enums.OutOfPageFormat.INTERSTITIAL
    );
  }

  function injectGptScript() {
    var existing = document.querySelector('script[src*="securepubads.g.doubleclick.net/tag/js/gpt.js"]');
    if (existing) return;
    if (!CONFIG.loadGptIfMissing) return;
    log("gpt.js inject ho raha hai...");
    var s = document.createElement("script");
    s.src = "https://securepubads.g.doubleclick.net/tag/js/gpt.js";
    s.async = true;
    s.crossOrigin = "anonymous";
    document.head.appendChild(s);
  }

  function waitForGpt() {
    return new Promise(function (resolve, reject) {
      injectGptScript();
      var start = Date.now();
      function tick() {
        if (isGptReady()) {
          gptReady = true;
          log("GPT ready");
          resolve();
          return;
        }
        if (Date.now() - start >= CONFIG.gptWaitTimeoutMs) {
          reject(new Error("GPT load timeout"));
          return;
        }
        setTimeout(tick, CONFIG.gptPollIntervalMs);
      }
      tick();
    });
  }

  function registerAdEvents() {
    if (eventsRegistered) return;
    eventsRegistered = true;

    googletag.cmd.push(function () {
      googletag.pubads().addEventListener("slotRenderEnded", function (ev) {
        if (ev.slot.getAdUnitPath() !== CONFIG.adUnitPath) return;
        adFilled = !ev.isEmpty;
        if (ev.isEmpty) {
          logError("Ad EMPTY -- GAM ne fill nahi diya");
        } else {
          log("Ad FILLED -- interstitial ready hai");
        }
      });

      googletag.pubads().addEventListener("slotOnload", function (ev) {
        if (ev.slot.getAdUnitPath() === CONFIG.adUnitPath) {
          log("Ad slot onload");
        }
      });

      googletag.pubads().addEventListener("slotVisibilityChanged", function (ev) {
        if (ev.slot.getAdUnitPath() === CONFIG.adUnitPath && ev.inViewPercentage > 0) {
          log("Interstitial visible:", ev.inViewPercentage + "%");
        }
      });
    });
  }

  function enableServicesOnce() {
    if (window.__gptServicesEnabled) return;
    googletag.cmd.push(function () {
      if (window.__gptServicesEnabled) return;
      googletag.pubads().enableSingleRequest();
      googletag.enableServices();
      window.__gptServicesEnabled = true;
      log("enableServices() called");
    });
  }

  // Slot sirf EK baar define -- destroy NAHI karna (warna FILLED ad kho jata hai)
  function defineSlotOnce(callback) {
    if (slotDefined && interstitialSlot) {
      if (callback) callback();
      return;
    }

    googletag.cmd.push(function () {
      try {
        if (slotDefined && interstitialSlot) {
          if (callback) callback();
          return;
        }

        interstitialSlot = googletag.defineOutOfPageSlot(
          CONFIG.adUnitPath,
          googletag.enums.OutOfPageFormat.INTERSTITIAL
        );

        if (!interstitialSlot) {
          logError("defineOutOfPageSlot fail -- shayad pehle se defined hai");
          if (callback) callback();
          return;
        }

        interstitialSlot.addService(googletag.pubads());
        window.__interstitialSlot = interstitialSlot;
        slotDefined = true;
        enableServicesOnce();
        log("Slot defined (ek baar)");
        if (callback) callback();
      } catch (e) {
        logError(e.message || e);
      }
    });
  }

  // Interstitial dikhane ke liye -- same slot reuse, destroy mat karo
  function showInterstitial(reason) {
    if (!CONFIG.enabled) return;
    if (!isMobileView()) {
      log("Desktop -- skip");
      return;
    }

    var now = Date.now();
    if (CONFIG.clickCooldownMs > 0 && now - lastShownAt < CONFIG.clickCooldownMs) {
      log("Cooldown (" + reason + ") -- skip");
      return;
    }

    if (!gptReady) {
      waitForGpt().then(function () { showInterstitial(reason); }).catch(function (e) { logError(e.message); });
      return;
    }

    defineSlotOnce(function () {
      if (!interstitialSlot) {
        logError("Slot nahi bana");
        return;
      }

      googletag.cmd.push(function () {
        try {
          lastShownAt = Date.now();

          if (reason === "page-load") {
            // Prefetch: pehli baar display se ad load hota hai
            googletag.display(interstitialSlot);
            log("Prefetch display (page-load)");
            return;
          }

          // Click par: pehle same slot display karo (FILLED ad ko destroy mat karo)
          googletag.display(interstitialSlot);
          log("display() -- reason:", reason, adFilled ? "(ad filled)" : "(waiting fill)");

          // Agar pehle se dikha chuka ho aur cooldown guzar gaya ho to refresh
          if (reason === "click" && adFilled) {
            setTimeout(function () {
              googletag.cmd.push(function () {
                try {
                  googletag.pubads().refresh([interstitialSlot]);
                  log("Refresh for next interstitial");
                } catch (e) {
                  logError("Refresh fail:", e.message);
                }
              });
            }, CONFIG.clickCooldownMs);
          }
        } catch (e) {
          logError(e.message || e);
        }
      });
    });
  }

  function attachClickListener() {
    if (clickListenerAttached) return;
    clickListenerAttached = true;

    document.addEventListener(
      "click",
      function (ev) {
        if (!CONFIG.enabled || !CONFIG.triggerOnEveryClick) return;
        if (!isMobileView()) return;
        if (shouldIgnore(ev.target)) return;
        showInterstitial("click");
      },
      false // bubble phase -- pehle page ka kaam ho, phir ad
    );

    log("Click listener attached");
  }

  function init() {
    if (!CONFIG.enabled) return;

    registerAdEvents();
    attachClickListener();

    waitForGpt()
      .then(function () {
        if (CONFIG.prepareSlotOnLoad && isMobileView()) {
          defineSlotOnce(function () {
            log("Slot background me ready. Display ads page load par, interstitial sirf click par.");
          });
        } else {
          log("Ready -- interstitial sirf click par chalega");
        }
      })
      .catch(function (e) { logError(e.message); });

    window.InterstitialAds = {
      config: CONFIG,
      show: function () { showInterstitial("manual"); },
      enable: function () { CONFIG.enabled = true; },
      disable: function () { CONFIG.enabled = false; }
    };

    log("Init complete. Test: InterstitialAds.show()");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
