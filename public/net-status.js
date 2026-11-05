// ===== Taomchi — umumiy internet holati (sust / yo'q / tiklandi) =====
// Hamma sahifada o'zi ishlaydi:
//   • brauzerning online/offline hodisalari
//   • fetch() so'rovlari: tarmoq xatosi -> "aloqa yo'q", 8 soniyadan uzoq GET -> "sust"
// Sahifa asosiy ma'lumotini yuklay olmasa (masalan retseptlar), qo'shimcha xabar beradi:
//   NetStatus.start()          — asosiy so'rov boshlandi
//   NetStatus.ok()             — ma'lumot keldi
//   NetStatus.fail(hasCache)   — xato (kesh bor bo'lsa banner, yo'q bo'lsa to'liq ekran)
//   NetStatus.register(k, fn)  — "Qayta urinish" bosilganda chaqiriladigan funksiya
/* NET_ICONS:BEGIN — avtomatik yaratilgan: ikonkalar offline paytda ham chiqishi uchun kodning ichiga joylangan */
const NET_ICONS = {
  slow: "data:image/webp;base64,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",
  offline: "data:image/webp;base64,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",
  offlineBig: "data:image/webp;base64,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"
};
/* NET_ICONS:END */

(function () {
  const SLOW_MS = 8000;      // shuncha vaqt javob bo'lmasa "sust" banneri chiqadi
  const RESTORED_MS = 2200;  // "Aloqa tiklandi" necha ms ko'rinadi

  const FALLBACK = {
    uz: {
      net_slow: "Internet sust ishlayapti",
      net_offline_cache: "Aloqa yo'q — saqlangan ma'lumotlar ko'rsatilmoqda",
      net_offline_banner: "Internet bilan aloqa yo'q",
      net_offline_title: "Internet bilan aloqa yo'q",
      net_offline_text: "Ulanishni tekshirib, qayta urinib ko'ring.",
      net_retry: "Qayta urinish", net_refresh: "Yangilash",
      net_restored: "Aloqa tiklandi", net_home: "Bosh sahifaga"
    },
    uzk: {
      net_slow: "Интернет секин ишлаяпти",
      net_offline_cache: "Алоқа йўқ — сақланган маълумотлар кўрсатилмоқда",
      net_offline_banner: "Интернет билан алоқа йўқ",
      net_offline_title: "Интернет билан алоқа йўқ",
      net_offline_text: "Уланишни текшириб, қайта уриниб кўринг.",
      net_retry: "Қайта уриниш", net_refresh: "Янгилаш",
      net_restored: "Алоқа тикланди", net_home: "Бош саҳифага"
    }
  };
  function t(key) {
    let lang = "uz";
    try { lang = getCurrentLang(); } catch (e) {}
    const d = (typeof TRANSLATIONS !== "undefined" && TRANSLATIONS[lang]) || {};
    return d[key] || (FALLBACK[lang] || FALLBACK.uz)[key] || key;
  }

  let pending = 0;          // hozir kutilayotgan so'rovlar
  let state = "idle";       // idle | slow | offline | overlay | restored
  let slowTimer = null, restoredTimer = null;
  const retryFns = new Map();
  let banner = null, overlay = null;
  let offlineKey = "net_offline_banner"; // kesh bor bo'lsa "saqlangan ma'lumotlar" matni

  function ico(name, size) {
    return '<img src="' + NET_ICONS[name] + '" alt="" width="' + size + '" height="' + size + '" decoding="async">';
  }

  function ensureBanner() {
    if (banner) return banner;
    banner = document.createElement("div");
    banner.className = "net-banner";
    banner.setAttribute("role", "status");
    banner.setAttribute("aria-live", "polite");
    banner.innerHTML = '<span class="net-banner-ico"></span><span class="net-banner-text"></span><button type="button" class="net-banner-btn"></button>';
    banner.querySelector("button").addEventListener("click", retry);
    document.body.appendChild(banner);
    return banner;
  }

  function showBanner(kind) {
    const b = ensureBanner();
    b.className = "net-banner net-banner--" + kind;
    const icoEl = b.querySelector(".net-banner-ico");
    const textEl = b.querySelector(".net-banner-text");
    const btn = b.querySelector("button");
    if (kind === "slow") {
      icoEl.innerHTML = ico("slow", 40);
      textEl.textContent = t("net_slow");
      btn.textContent = t("net_retry");
    } else if (kind === "offline") {
      icoEl.innerHTML = ico("offline", 40);
      textEl.textContent = t(offlineKey);
      btn.textContent = t("net_refresh");
    } else {
      icoEl.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m8 12.5 3 3 5-6"/></svg>';
      textEl.textContent = t("net_restored");
    }
    btn.hidden = kind === "restored";
    btn.disabled = false;
    // keyingi kadrda ochamiz — slide-down animatsiyasi ishlashi uchun
    requestAnimationFrame(function () {
      b.classList.add("net-banner--show");
      document.documentElement.classList.add("has-net-banner");
    });
  }

  function hideBanner() {
    if (!banner) return;
    banner.classList.remove("net-banner--show");
    document.documentElement.classList.remove("has-net-banner");
  }

  function ensureOverlay() {
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "net-overlay";
    overlay.setAttribute("role", "alert");
    const needHome = !/(^|\/)(index\.html)?$/.test(location.pathname) && !document.querySelector(".bottom-nav");
    overlay.innerHTML =
      '<div class="net-overlay-box">' +
        '<img class="net-overlay-ico" src="' + NET_ICONS.offlineBig + '" alt="" width="200" height="200">' +
        '<h2 class="net-overlay-title"></h2>' +
        '<p class="net-overlay-text"></p>' +
        '<button type="button" class="net-overlay-btn"></button>' +
        (needHome ? '<a class="net-overlay-home" href="index.html"></a>' : '') +
      '</div>';
    overlay.querySelector(".net-overlay-btn").addEventListener("click", retry);
    document.body.appendChild(overlay);
    return overlay;
  }

  function showOverlay() {
    const o = ensureOverlay();
    o.querySelector(".net-overlay-title").textContent = t("net_offline_title");
    o.querySelector(".net-overlay-text").textContent = t("net_offline_text");
    const btn = o.querySelector(".net-overlay-btn");
    btn.textContent = t("net_retry");
    btn.disabled = false;
    btn.classList.remove("is-loading");
    const home = o.querySelector(".net-overlay-home");
    if (home) home.textContent = t("net_home");
    requestAnimationFrame(function () { o.classList.add("net-overlay--show"); });
  }

  function hideOverlay() {
    if (overlay) overlay.classList.remove("net-overlay--show");
  }

  function clearTimers() {
    clearTimeout(slowTimer); slowTimer = null;
  }

  function setLoadingUI(on) {
    [banner && banner.querySelector("button"), overlay && overlay.querySelector(".net-overlay-btn")].forEach(function (b) {
      if (!b) return;
      b.disabled = on;
      b.classList.toggle("is-loading", on);
    });
  }

  function retry() {
    setLoadingUI(true);
    clearTimeout(restoredTimer);
    if (retryFns.size) {
      retryFns.forEach(function (fn) { try { fn(); } catch (e) {} });
    } else {
      location.reload();
    }
  }

  function isBad() { return state === "slow" || state === "offline" || state === "overlay"; }

  // Aloqa yaxshilandi: banner/ekranni yopib, "Aloqa tiklandi" ko'rsatamiz
  function recovered() {
    if (!isBad()) return;
    clearTimers();
    setLoadingUI(false);
    hideOverlay();
    state = "restored";
    showBanner("restored");
    clearTimeout(restoredTimer);
    restoredTimer = setTimeout(function () { hideBanner(); state = "idle"; }, RESTORED_MS);
  }

  function enterOffline(cacheText) {
    if (state === "overlay") return;
    offlineKey = cacheText ? "net_offline_cache" : "net_offline_banner";
    clearTimeout(restoredTimer);
    state = "offline";
    showBanner("offline");
  }

  window.NetStatus = {
    register: function (key, fn) { retryFns.set(key, fn); },

    start: function () {
      pending++;
      if (slowTimer || state === "overlay") return;
      slowTimer = setTimeout(function () {
        slowTimer = null;
        if (pending > 0 && state !== "overlay") { state = "slow"; showBanner("slow"); }
      }, SLOW_MS);
    },

    ok: function () {
      pending = Math.max(0, pending - 1);
      if (pending > 0) return;
      clearTimers();
      setLoadingUI(false);
      if (isBad()) recovered();
      else if (state !== "restored") { hideBanner(); state = "idle"; }
    },

    fail: function (hasCache) {
      pending = Math.max(0, pending - 1);
      if (pending > 0) return;
      clearTimers();
      setLoadingUI(false);
      clearTimeout(restoredTimer);
      if (hasCache) {
        hideOverlay();
        enterOffline(true);
      } else {
        hideBanner();
        state = "overlay";
        showOverlay();
      }
    }
  };

  // ===== Brauzer hodisalari =====
  window.addEventListener("online", function () {
    if (!isBad()) return;
    if (retryFns.size) retry(); // ma'lumot yuklovchi sahifa: o'zi qayta yuklaydi
    else recovered();           // boshqa sahifalar: foydalanuvchi ishini buzmaymiz (reload yo'q)
  });
  window.addEventListener("offline", function () {
    if (state === "idle" || state === "restored") enterOffline(false);
  });
  function initialCheck() {
    if (navigator.onLine === false && state === "idle") enterOffline(false);
  }
  if (document.body) initialCheck();
  else document.addEventListener("DOMContentLoaded", initialCheck);

  // ===== fetch() kuzatuvi =====
  // Firestore/Google/Telegram so'rovlari hisobga olinmaydi (ular uzoq ochiq turadi),
  // AI va menyu generatsiyasi uzoq davom etishi mumkin, shuning uchun "sust" deb hisoblanmaydi.
  const SKIP = /googleapis\.com|gstatic\.com|telegram\.org|cloudinary\.com/i;
  const LONG = /\/api\/(ai-|weekly-menu|create-ai|broadcast)/i;
  let slowCount = 0;

  if (typeof window.fetch === "function") {
    const origFetch = window.fetch.bind(window);
    window.fetch = function (input, init) {
      let url = "", method = "GET";
      try {
        url = typeof input === "string" ? input : (input && input.url) || String(input);
        method = ((init && init.method) || (input && input.method) || "GET").toUpperCase();
      } catch (e) {}
      if (SKIP.test(url)) return origFetch(input, init);

      let sameOrigin = true;
      try { sameOrigin = new URL(url, location.href).origin === location.origin; } catch (e) {}
      const watchSlow = method === "GET" && !LONG.test(url);
      let flaggedSlow = false, timer = null;

      if (watchSlow) {
        timer = setTimeout(function () {
          flaggedSlow = true;
          slowCount++;
          if (state === "idle" || state === "restored") { state = "slow"; showBanner("slow"); }
        }, SLOW_MS);
      }
      function settle() {
        clearTimeout(timer);
        if (flaggedSlow) { flaggedSlow = false; slowCount = Math.max(0, slowCount - 1); }
      }

      return origFetch(input, init).then(function (res) {
        settle();
        if (isBad() && slowCount === 0 && pending === 0) recovered();
        return res;
      }, function (err) {
        settle();
        if (err && err.name !== "AbortError" && (navigator.onLine === false || sameOrigin)) {
          if (state === "idle" || state === "restored" || state === "slow") enterOffline(false);
        }
        throw err;
      });
    };
  }
  // ===== Ikonkalarni internet borida oldindan yuklab qo'yish =====
  // Rasmi yuklanmagan retseptlar kategoriya ikonkasini ko'rsatadi; ular keshda turishi uchun.
  function preloadIcons() {
    if (navigator.onLine === false) return;
    const px = (window.devicePixelRatio || 1) > 1.5 ? 256 : 128;
    ["plov", "soup", "salad", "egg", "cake", "pastry", "juice", "avocado", "pot"].forEach(function (n) {
      const im = new Image();
      im.src = "icons/" + n + "-" + px + ".webp";
    });
  }
  window.addEventListener("load", function () {
    if (window.requestIdleCallback) requestIdleCallback(preloadIcons, { timeout: 4000 });
    else setTimeout(preloadIcons, 1500);
  });
})();
