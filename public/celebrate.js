// ===== Taomchi — Xarid muvaffaqiyat animatsiyasi =====
// Premium sotib olingandan keyin chaqiriladi. Faqat shu payt DOM'ga
// qo'shiladi va yopilganda butunlay olib tashlanadi — fonda doim
// ishlaydigan hech narsa yo'q. Animatsiyalar faqat transform/opacity
// bilan ishlaydi (GPU-friendly, past quvvatli qurilmalarda ham silliq).

let confettiLibPromise = null;

function loadConfettiLib() {
  if (window.confetti) return Promise.resolve();
  if (confettiLibPromise) return confettiLibPromise;

  confettiLibPromise = new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/canvas-confetti/1.9.3/confetti.browser.min.js";
    script.onload = resolve;
    script.onerror = resolve; // Yuklanmasa ham tabriklash ekrani konfettisiz ko'rsatiladi
    document.head.appendChild(script);
  });

  return confettiLibPromise;
}

function fireConfetti() {
  if (!window.confetti) return;

  const colors = ["#EA260B", "#A81208", "#FDF2EB", "#FFC93C"];

  window.confetti({
    particleCount: 90,
    spread: 75,
    startVelocity: 42,
    origin: { y: 0.35 },
    colors,
    zIndex: 10001
  });

  setTimeout(() => {
    window.confetti({
      particleCount: 50,
      spread: 100,
      startVelocity: 30,
      origin: { y: 0.3 },
      colors,
      zIndex: 10001
    });
  }, 250);
}

/**
 * @param {"monthly"|"yearly"} plan
 * @param {object} texts - tp() orqali olingan matnlar (i18n uchun profile.js beradi)
 */
function showPurchaseCelebration(plan, texts = {}) {
  if (window.Telegram?.WebApp?.HapticFeedback) {
    window.Telegram.WebApp.HapticFeedback.notificationOccurred("success");
  }

  const overlay = document.createElement("div");
  overlay.className = "celebrate-overlay";
  overlay.innerHTML = `
    <div class="celebrate-box">
      <div class="celebrate-crown">👑</div>
      <p class="celebrate-title">${texts.title || "Tabriklaymiz!"}</p>
      <p class="celebrate-subtitle">${texts.subtitle || (plan === "yearly"
        ? "Sizda endi 1 yillik Premium faol"
        : "Sizda endi 1 oylik Premium faol")}</p>
      <ul class="celebrate-feature-list">
        <li>${texts.feature1 || "Kuniga 15 marta AI'dan so'rash"}</li>
        <li>${texts.feature2 || "Premium retseptlarga to'liq kirish"}</li>
      </ul>
      <button class="premium-btn premium-btn--primary celebrate-close-btn">${texts.closeBtn || "Ajoyib!"}</button>
    </div>
  `;
  document.body.appendChild(overlay);

  // Keyingi frame'da klass qo'shamiz — shu orqali CSS transition ishga tushadi
  requestAnimationFrame(() => overlay.classList.add("celebrate-overlay--visible"));

  function close() {
    overlay.classList.remove("celebrate-overlay--visible");
    setTimeout(() => overlay.remove(), 250);
  }

  overlay.querySelector(".celebrate-close-btn").addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });

  loadConfettiLib().then(fireConfetti);
}

window.showPurchaseCelebration = showPurchaseCelebration;
