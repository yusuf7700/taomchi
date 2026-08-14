// ===== Taomchi — Saqlanganlar ro'yxati =====

const tg = window.Telegram?.WebApp;
if (tg) { tg.ready(); tg.expand(); }

const favListEl = document.getElementById("favList");

function renderEmpty() {
  const lang = getCurrentLang();
  const text = lang === "uz"
    ? "Hali hech narsa saqlamagansiz. Retseptlar bo'limidan yoqtirgan taomlaringizni ❤️ belgilang."
    : "Ҳали ҳеч нарса сақламагансиз. Рецептлар бўлимидан ёқтирган таомларингизни ❤️ белгиланг.";
  favListEl.innerHTML = `<p class="empty-text">${text}</p>`;
}

function renderFavorites(recipes) {
  if (recipes.length === 0) {
    renderEmpty();
    return;
  }

  favListEl.innerHTML = recipes.map(r => `
    <div class="recipe-card" data-id="${r.id}">
      <div class="recipe-thumb">${r.imageUrl ? `<img src="${r.imageUrl}" alt="${r.title}">` : "🍽️"}</div>
      <div class="recipe-info">
        <p class="recipe-title">${r.title}</p>
        <p class="recipe-meta">
          <span>⏱ ${r.cookTime || "-"} <span>${(TRANSLATIONS[getCurrentLang()] || TRANSLATIONS.uz).minutes}</span></span>
          <span>⭐ ${r.rating || "-"}</span>
        </p>
      </div>
      <svg class="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m9 18 6-6-6-6"/></svg>
    </div>
  `).join("");

  document.querySelectorAll(".recipe-card").forEach(card => {
    card.addEventListener("click", () => {
      window.location.href = `recipe-detail.html?id=${card.getAttribute("data-id")}`;
    });
  });
}

const favIds = getFavoriteIds();

if (favIds.length === 0) {
  renderEmpty();
} else {
  const cached = getCachedRecipes();
  if (cached) {
    // Keshdan darrov ko'rsatamiz, Firestore'ga so'rov shart emas
    const recipes = favIds
      .map(id => cached.data.find(r => r.id === id))
      .filter(Boolean);
    renderFavorites(recipes);
  } else {
    Promise.all(favIds.map(id => db.collection("recipes").doc(id).get()))
      .then(docs => {
        const recipes = docs
          .filter(d => d.exists)
          .map(d => ({ id: d.id, ...d.data() }));
        renderFavorites(recipes);
      })
      .catch(err => {
        console.error("Saqlanganlarni yuklashda xato:", err);
        favListEl.innerHTML = `<p class="empty-text">Xatolik yuz berdi.</p>`;
      });
  }
}
