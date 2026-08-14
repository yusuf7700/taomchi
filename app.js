// ===== Taomchi — asosiy logika =====

// --- Telegram WebApp ulanishi ---
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // Telegram interfeysiga moslashtirish (headerBackgroundColor va h.k. keyinroq)
}

// --- Splash screen (1.1 soniyadan keyin yopiladi) ---
window.addEventListener("load", () => {
  setTimeout(() => {
    const splash = document.getElementById("splash");
    if (splash) splash.classList.add("hidden");
  }, 1100);
});

// --- Pastki navigatsiya ---
const navItems = document.querySelectorAll(".nav-item");
navItems.forEach(item => {
  item.addEventListener("click", () => {
    navItems.forEach(i => i.classList.remove("active"));
    item.classList.add("active");
    const page = item.getAttribute("data-page");
    goToPage(page);
  });
});

function goToPage(page) {
  // Hozircha faqat "home" tayyor. Boshqa sahifalar keyingi bosqichda qo'shiladi.
  console.log("Sahifaga o'tish:", page);
  // TODO: recipes.html, favorites.html, profile.html tayyor bo'lgach shu yerga ulanadi
}

// --- 3 ta asosiy tugma (Uyda bor / AI / Haftalik menyu) ---
const actionCards = document.querySelectorAll(".action-card");
actionCards.forEach(card => {
  card.addEventListener("click", () => {
    const action = card.getAttribute("data-action");
    console.log("Amal tanlandi:", action);
    // TODO: pantry.html, ai.html, weekly-menu.html tayyor bo'lgach shu yerga ulanadi
  });
});

// --- Kategoriya tugmalari ---
const categoryCards = document.querySelectorAll(".category-card");
categoryCards.forEach(card => {
  card.addEventListener("click", () => {
    const cat = card.getAttribute("data-cat");
    console.log("Kategoriya tanlandi:", cat);
    // TODO: retseptlar ro'yxati sahifasiga category filter bilan o'tish
  });
});

// --- Bugungi tavsiya kartasi ---
const dailyRecipe = document.getElementById("dailyRecipe");
if (dailyRecipe) {
  dailyRecipe.addEventListener("click", () => {
    console.log("Retsept ochilmoqda...");
    // TODO: retsept detali sahifasiga o'tish
  });
}