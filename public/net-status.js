// ===== Taomchi — internet holati (sust / yo'q / tiklandi) =====
// recipes-cache.js shu obyekt orqali holatni xabar qiladi:
//   NetStatus.start(hasCache)  — so'rov boshlandi
//   NetStatus.ok()             — ma'lumot keldi
//   NetStatus.fail(hasCache)   — xato (kesh bor bo'lsa banner, yo'q bo'lsa to'liq ekran)
//   NetStatus.register(fn)     — "Qayta urinish" bosilganda chaqiriladigan funksiya
(function () {
  const SLOW_MS = 8000;      // shuncha vaqt javob bo'lmasa "sust" banneri chiqadi
  const RESTORED_MS = 2200;  // "Aloqa tiklandi" necha ms ko'rinadi

  const FALLBACK = {
    uz: {
      net_slow: "Internet sust ishlayapti",
      net_offline_cache: "Aloqa yo'q — saqlangan ma'lumotlar ko'rsatilmoqda",
      net_offline_title: "Internet bilan aloqa yo'q",
      net_offline_text: "Ulanishni tekshirib, qayta urinib ko'ring.",
      net_retry: "Qayta urinish", net_refresh: "Yangilash",
      net_restored: "Aloqa tiklandi", net_home: "Bosh sahifaga"
    },
    uzk: {
      net_slow: "Интернет секин ишлаяпти",
      net_offline_cache: "Алоқа йўқ — сақланган маълумотлар кўрсатилмоқда",
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

  function ico(name, size) {
    return '<img src="icons/' + name + '-128.webp" srcset="icons/' + name + '-128.webp 1x, icons/' + name + '-256.webp 2x" alt="" width="' + size + '" height="' + size + '" decoding="async">';
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
      textEl.textContent = t("net_offline_cache");
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
        '<img class="net-overlay-ico" src="icons/offline-256.webp" alt="" width="200" height="200">' +
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
    retryFns.forEach(function (fn) { try { fn(); } catch (e) {} });
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
      const wasBad = state === "slow" || state === "offline" || state === "overlay";
      hideOverlay();
      if (wasBad) {
        state = "restored";
        showBanner("restored");
        clearTimeout(restoredTimer);
        restoredTimer = setTimeout(function () { hideBanner(); state = "idle"; }, RESTORED_MS);
      } else {
        hideBanner();
        state = "idle";
      }
    },

    fail: function (hasCache) {
      pending = Math.max(0, pending - 1);
      if (pending > 0) return;
      clearTimers();
      setLoadingUI(false);
      clearTimeout(restoredTimer);
      if (hasCache) {
        hideOverlay();
        state = "offline";
        showBanner("offline");
      } else {
        hideBanner();
        state = "overlay";
        showOverlay();
      }
    }
  };

  // Aloqa qaytsa — o'zi qayta yuklaydi
  window.addEventListener("online", function () {
    if (state === "slow" || state === "offline" || state === "overlay") retry();
  });
  // Aloqa uzilsa — ma'lumot allaqachon ko'rinib turgan bo'lsa banner chiqaramiz
  window.addEventListener("offline", function () {
    if (state === "idle") { state = "offline"; showBanner("offline"); }
  });
})();
