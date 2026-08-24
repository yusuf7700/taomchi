// ===== Taomchi — Admin panel logikasi =====

const CATEGORY_LABELS = {
  main: "🍲 Asosiy taomlar",
  soup: "🍜 Sho'rvalar",
  salad: "🥗 Salatlar",
  breakfast: "🍳 Nonushta",
  dessert: "🍰 Shirinliklar",
  pastry: "🥟 Yeguliklar",
  drinks: "🥤 Ichimliklar"
};

// ===== Tab navigatsiya =====
const tabBtnAdd = document.getElementById("tabBtnAdd");
const tabBtnList = document.getElementById("tabBtnList");
const tabBtnUsers = document.getElementById("tabBtnUsers");
const tabBtnBroadcast = document.getElementById("tabBtnBroadcast");
const tabBtnPantry = document.getElementById("tabBtnPantry");
const tabPanelAdd = document.getElementById("tabPanelAdd");
const tabPanelList = document.getElementById("tabPanelList");
const tabPanelUsers = document.getElementById("tabPanelUsers");
const tabPanelBroadcast = document.getElementById("tabPanelBroadcast");
const tabPanelPantry = document.getElementById("tabPanelPantry");

function showTab(tab) {
  tabPanelAdd.classList.toggle("screen-hidden", tab !== "add");
  tabPanelList.classList.toggle("screen-hidden", tab !== "list");
  tabPanelUsers.classList.toggle("screen-hidden", tab !== "users");
  tabPanelBroadcast.classList.toggle("screen-hidden", tab !== "broadcast");
  tabPanelPantry.classList.toggle("screen-hidden", tab !== "pantry");
  tabBtnAdd.classList.toggle("active", tab === "add");
  tabBtnList.classList.toggle("active", tab === "list");
  tabBtnUsers.classList.toggle("active", tab === "users");
  tabBtnBroadcast.classList.toggle("active", tab === "broadcast");
  tabBtnPantry.classList.toggle("active", tab === "pantry");

  if (tab === "users" && allAdminUsers.length === 0) {
    loadUsers();
  }
  if (tab === "pantry") {
    loadPantrySuggestions();
  }
}

tabBtnAdd.addEventListener("click", () => showTab("add"));
tabBtnList.addEventListener("click", () => showTab("list"));
tabBtnUsers.addEventListener("click", () => showTab("users"));
tabBtnBroadcast.addEventListener("click", () => showTab("broadcast"));
tabBtnPantry.addEventListener("click", () => showTab("pantry"));

// ⚠️ imgbb sozlamasi — quyidagi qatorni o'zingizning
// bepul API kalitingizga almashtiring (api.imgbb.com'dan olinadi):
const IMGBB_API_KEY = "1a168f2d64ca81fc96a55a6223ec5347";

const ADMIN_SECRET_KEY = "taomchi_admin_secret";

// ===== Login =====
const loginScreen = document.getElementById("loginScreen");
const adminPanel = document.getElementById("adminPanel");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

async function tryLogin(secret) {
  const res = await fetch("/api/admin-recipes", {
    headers: { "x-admin-secret": secret }
  });
  let errorMessage = "";
  if (!res.ok) {
    try {
      const body = await res.json();
      errorMessage = body.error || "";
    } catch {
      errorMessage = "";
    }
  }
  return { ok: res.ok, status: res.status, errorMessage };
}

async function attemptLogin() {
  const secret = passwordInput.value.trim();
  if (!secret) return;
  loginError.textContent = "";
  loginBtn.textContent = "Tekshirilmoqda...";

  const result = await tryLogin(secret);
  loginBtn.textContent = "Kirish";

  if (result.ok) {
    sessionStorage.setItem(ADMIN_SECRET_KEY, secret);
    showPanel();
  } else if (result.status === 401) {
    loginError.textContent = "Parol noto'g'ri.";
  } else {
    loginError.textContent = `Server xatosi (${result.status}): ${result.errorMessage}`;
  }
}

loginBtn.addEventListener("click", attemptLogin);
passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") attemptLogin();
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem(ADMIN_SECRET_KEY);
  location.reload();
});

function getSecret() {
  return sessionStorage.getItem(ADMIN_SECRET_KEY);
}

function showPanel() {
  loginScreen.classList.add("screen-hidden");
  adminPanel.classList.remove("screen-hidden");
  loadRecipes();
}

// Sahifa ochilganda avvalgi login saqlangan bo'lsa, avtomatik kirish
(async function initAuth() {
  const saved = getSecret();
  if (saved) {
    const result = await tryLogin(saved);
    if (result.ok) showPanel();
  }
})();

// ===== Kirillcha nomni avtomatik taklif qilish =====
const fTitle = document.getElementById("fTitle");
const fTitleCyrillic = document.getElementById("fTitleCyrillic");
fTitleCyrillic.dataset.autofilled = "true";

fTitle.addEventListener("input", () => {
  if (fTitleCyrillic.dataset.autofilled !== "false") {
    fTitleCyrillic.value = latinToCyrillic(fTitle.value);
  }
});

fTitleCyrillic.addEventListener("input", () => {
  fTitleCyrillic.dataset.autofilled = "false";
});

// ===== Rasm yuklash (imgbb) =====
const fImageFile = document.getElementById("fImageFile");
const fImageUrl = document.getElementById("fImageUrl");
const uploadStatus = document.getElementById("uploadStatus");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewHint = document.getElementById("imagePreviewHint");

// Umumiy rasm yuklash funksiyasi — imgbb'ga yuklaydi va URL qaytaradi.
// statusEl va previewEl ixtiyoriy (bo'lsa holatni ko'rsatib turadi).
async function uploadImageToImgbb(file, statusEl, previewEl) {
  if (statusEl) statusEl.textContent = "Yuklanmoqda...";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      if (previewEl) {
        previewEl.src = data.data.url;
        previewEl.style.display = "block";
      }
      if (statusEl) statusEl.textContent = "✅ Rasm yuklandi";
      return data.data.url;
    }
    if (statusEl) statusEl.textContent = "❌ Xatolik: " + (data.error?.message || "noma'lum");
    return null;
  } catch (err) {
    if (statusEl) statusEl.textContent = "❌ Yuklashda xatolik: " + err.message;
    return null;
  }
}

fImageFile.addEventListener("change", async () => {
  const file = fImageFile.files[0];
  if (!file) return;
  const url = await uploadImageToImgbb(file, uploadStatus, imagePreview);
  if (url) {
    fImageUrl.value = url;
    imagePreviewHint.style.display = "block";
  }
});

// ===== Forma: yordamchi funksiyalar =====
function parseIngredients(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean).map(line => {
    const [name, amount] = line.split(" - ");
    return { name: (name || "").trim(), amount: (amount || "").trim() };
  });
}

function parseSteps(text) {
  return text.split("\n").map(l => l.trim()).filter(Boolean);
}

function ingredientsToText(ingredients) {
  return (ingredients || []).map(i => `${i.name} - ${i.amount}`).join("\n");
}

function stepsToText(steps) {
  return (steps || []).join("\n");
}

function collectFormData() {
  return {
    title: document.getElementById("fTitle").value.trim(),
    titleCyrillic: document.getElementById("fTitleCyrillic").value.trim(),
    imageUrl: fImageUrl.value.trim(),
    ingredients: parseIngredients(document.getElementById("fIngredients").value),
    steps: parseSteps(document.getElementById("fSteps").value),
    cookTime: Number(document.getElementById("fCookTime").value) || 0,
    cookTimeUnit: document.getElementById("fCookTimeUnit").value,
    servings: Number(document.getElementById("fServings").value) || 0,
    category: document.getElementById("fCategory").value,
    difficulty: document.getElementById("fDifficulty").value,
    author: document.getElementById("fAuthor").value.trim(),
    sourceUrl: document.getElementById("fSourceUrl").value.trim(),
    videoPlatform: document.getElementById("fVideoPlatform").value,
    isPremium: document.getElementById("fPremium").checked,
    rating: 0
  };
}

function clearForm() {
  document.getElementById("fTitle").value = "";
  document.getElementById("fTitleCyrillic").value = "";
  document.getElementById("fTitleCyrillic").dataset.autofilled = "true";
  document.getElementById("fImageFile").value = "";
  fImageUrl.value = "";
  imagePreview.style.display = "none";
  imagePreviewHint.style.display = "none";
  uploadStatus.textContent = "";
  document.getElementById("fIngredients").value = "";
  document.getElementById("fSteps").value = "";
  document.getElementById("fCookTime").value = "";
  document.getElementById("fCookTimeUnit").value = "daqiqa";
  document.getElementById("fServings").value = "";
  document.getElementById("fCategory").value = "main";
  document.getElementById("fDifficulty").value = "oson";
  document.getElementById("fAuthor").value = "";
  document.getElementById("fSourceUrl").value = "";
  document.getElementById("fVideoPlatform").value = "telegram";
  document.getElementById("fPremium").checked = false;
  document.getElementById("fEditId").value = "";
  document.getElementById("formTitle").textContent = "➕ Retsept qo'shish";
  document.getElementById("submitBtn").textContent = "➕ Retseptni qo'shish";
  document.getElementById("cancelEditBtn").style.display = "none";
}

// ===== Forma: yuborish (qo'shish yoki tahrirlash) =====
const submitBtn = document.getElementById("submitBtn");
const formStatus = document.getElementById("formStatus");

submitBtn.addEventListener("click", async () => {
  const data = collectFormData();
  if (!data.title) {
    formStatus.textContent = "❌ Taom nomini kiriting.";
    return;
  }

  const editId = document.getElementById("fEditId").value;
  submitBtn.disabled = true;
  formStatus.textContent = "Saqlanmoqda...";

  try {
    const res = await fetch("/api/admin-recipes", {
      method: editId ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": getSecret()
      },
      body: JSON.stringify(editId ? { id: editId, ...data } : data)
    });

    const responseData = await res.json();
    if (!res.ok) throw new Error(responseData.error || "Server xatosi");

    console.log("Pantry debug:", responseData.pantryDebug);

    const pd = responseData.pantryDebug;
    let pantryNote = "";
    if (pd && pd.ok === false) {
      pantryNote = ` (⚠️ pantry taklif xatosi: ${pd.error})`;
    } else if (pd && pd.writtenAsNewPending && pd.writtenAsNewPending.length > 0) {
      pantryNote = ` (🆕 yangi taklif: ${pd.writtenAsNewPending.join(", ")})`;
    }

    formStatus.textContent = "✅ Saqlandi!" + pantryNote;
    clearForm();
    loadRecipes();
    showTab("list");
  } catch (err) {
    formStatus.textContent = "❌ Xatolik: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("cancelEditBtn").addEventListener("click", clearForm);

// ===== Ro'yxat: yuklash va chizish =====
let allAdminRecipes = [];
let activeCategory = "all";

async function loadRecipes() {
  const listEl = document.getElementById("adminRecipeList");
  listEl.innerHTML = `<p class="admin-hint">Yuklanmoqda...</p>`;

  try {
    const res = await fetch("/api/admin-recipes", {
      headers: { "x-admin-secret": getSecret() }
    });
    allAdminRecipes = await res.json();
    renderCategoryFilters();
    applyFilters();
  } catch (err) {
    listEl.innerHTML = `<p class="admin-hint">Xatolik: ${err.message}</p>`;
  }
}

function renderCategoryFilters() {
  const wrap = document.getElementById("categoryFilters");
  const counts = {};
  allAdminRecipes.forEach(r => {
    counts[r.category] = (counts[r.category] || 0) + 1;
  });

  const chips = [`<button class="admin-chip ${activeCategory === "all" ? "active" : ""}" data-cat="all">Barchasi <span class="admin-chip-count">${allAdminRecipes.length}</span></button>`];
  Object.keys(CATEGORY_LABELS).forEach(cat => {
    if (!counts[cat]) return; // faqat retsepti bor kategoriyalarni ko'rsatamiz
    chips.push(`<button class="admin-chip ${activeCategory === cat ? "active" : ""}" data-cat="${cat}">${CATEGORY_LABELS[cat]} <span class="admin-chip-count">${counts[cat]}</span></button>`);
  });
  wrap.innerHTML = chips.join("");

  wrap.querySelectorAll("[data-cat]").forEach(btn => {
    btn.addEventListener("click", () => {
      activeCategory = btn.getAttribute("data-cat");
      renderCategoryFilters();
      applyFilters();
    });
  });
}

function applyFilters() {
  const q = document.getElementById("searchInput").value.trim().toLowerCase();
  const filtered = allAdminRecipes.filter(r => {
    const matchesCategory = activeCategory === "all" || r.category === activeCategory;
    const matchesSearch = !q || (r.title || "").toLowerCase().includes(q) || (r.category || "").toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });
  renderAdminList(filtered);
}

function renderAdminList(recipes) {
  const listEl = document.getElementById("adminRecipeList");
  document.getElementById("tabListCount").textContent = allAdminRecipes.length ? `(${allAdminRecipes.length})` : "";

  if (recipes.length === 0) {
    listEl.innerHTML = `<p class="admin-hint">Hech narsa topilmadi.</p>`;
    return;
  }

  listEl.innerHTML = recipes.map(r => `
    <div class="admin-recipe-item">
      ${r.imageUrl ? `<img src="${r.imageUrl}" class="admin-recipe-item-thumb">` : `<div class="admin-recipe-item-thumb admin-recipe-item-thumb--placeholder">🍽️</div>`}
      <div class="admin-recipe-item-info">
        <p class="admin-recipe-item-title">${r.title || "(nomsiz)"}</p>
        <p class="admin-recipe-item-meta">${CATEGORY_LABELS[r.category] || r.category || "-"} · ⏱ ${r.cookTimeUnit === "nomalum" ? "Noma'lum" : `${r.cookTime || "-"} ${r.cookTimeUnit === "soat" ? "soat" : "daq"}`}</p>
      </div>
      <div class="admin-recipe-item-actions">
        <button class="admin-icon-btn" data-edit="${r.id}">✏️</button>
        <button class="admin-icon-btn" data-delete="${r.id}">🗑️</button>
      </div>
    </div>
  `).join("");

  listEl.querySelectorAll("[data-edit]").forEach(btn => {
    btn.addEventListener("click", () => startEdit(btn.getAttribute("data-edit")));
  });
  listEl.querySelectorAll("[data-delete]").forEach(btn => {
    btn.addEventListener("click", () => deleteRecipe(btn.getAttribute("data-delete")));
  });
}

function startEdit(id) {
  const r = allAdminRecipes.find(x => x.id === id);
  if (!r) return;

  document.getElementById("fTitle").value = r.title || "";
  fTitleCyrillic.value = r.titleCyrillic || "";
  fTitleCyrillic.dataset.autofilled = r.titleCyrillic ? "false" : "true";
  fImageUrl.value = r.imageUrl || "";
  if (r.imageUrl) {
    imagePreview.src = r.imageUrl;
    imagePreview.style.display = "block";
    imagePreviewHint.style.display = "block";
  }
  document.getElementById("fIngredients").value = ingredientsToText(r.ingredients);
  document.getElementById("fSteps").value = stepsToText(r.steps);
  document.getElementById("fCookTime").value = r.cookTime || "";
  document.getElementById("fCookTimeUnit").value = r.cookTimeUnit || "daqiqa";
  document.getElementById("fServings").value = r.servings || "";
  document.getElementById("fCategory").value = r.category || "main";
  document.getElementById("fDifficulty").value = r.difficulty || "oson";
  document.getElementById("fAuthor").value = r.author || "";
  document.getElementById("fSourceUrl").value = r.sourceUrl || "";
  document.getElementById("fVideoPlatform").value = r.videoPlatform || "telegram";
  document.getElementById("fPremium").checked = !!r.isPremium;
  document.getElementById("fEditId").value = r.id;

  document.getElementById("formTitle").textContent = "✏️ Retseptni tahrirlash";
  document.getElementById("submitBtn").textContent = "💾 Yangilash";
  document.getElementById("cancelEditBtn").style.display = "block";

  showTab("add");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function deleteRecipe(id) {
  if (!confirm("Rostdan ham o'chirilsinmi?")) return;

  try {
    await fetch("/api/admin-recipes", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": getSecret()
      },
      body: JSON.stringify({ id })
    });
    loadRecipes();
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

// ===== Qidiruv =====
document.getElementById("searchInput").addEventListener("input", applyFilters);

// ===== Foydalanuvchilar =====
let allAdminUsers = [];

async function loadUsers() {
  const listEl = document.getElementById("adminUserList");
  listEl.innerHTML = `<p class="admin-hint">Yuklanmoqda...</p>`;

  try {
    const res = await fetch("/api/admin-users", {
      headers: { "x-admin-secret": getSecret() }
    });
    allAdminUsers = await res.json();
    renderUserStats();
    applyUserFilter();
  } catch (err) {
    listEl.innerHTML = `<p class="admin-hint">Xatolik: ${err.message}</p>`;
  }
}

function renderUserStats() {
  document.getElementById("tabUsersCount").textContent = allAdminUsers.length ? `(${allAdminUsers.length})` : "";
  document.getElementById("statTotal").textContent = allAdminUsers.length;
  document.getElementById("statPremium").textContent = allAdminUsers.filter(u => u.isPremium).length;

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayCount = allAdminUsers.filter(u => u.createdAt && u.createdAt >= todayStart.getTime()).length;
  document.getElementById("statToday").textContent = todayCount;
}

function applyUserFilter() {
  const q = document.getElementById("userSearchInput").value.trim().toLowerCase();
  const filtered = allAdminUsers.filter(u => {
    if (!q) return true;
    return (u.firstName || "").toLowerCase().includes(q) || (u.username || "").toLowerCase().includes(q);
  });
  renderUserList(filtered);
}

function renderUserList(users) {
  const listEl = document.getElementById("adminUserList");
  if (users.length === 0) {
    listEl.innerHTML = `<p class="admin-hint">Hech narsa topilmadi.</p>`;
    return;
  }

  const sorted = [...users].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  listEl.innerHTML = sorted.map(u => {
    const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString("uz-UZ") : "-";
    const langLabel = u.language === "uzk" ? "Кирилл" : "Lotin";
    return `
      <div class="admin-user-item">
        <div class="admin-user-avatar">${(u.firstName || "?").charAt(0).toUpperCase()}</div>
        <div class="admin-recipe-item-info">
          <p class="admin-recipe-item-title">${u.firstName || "(nomsiz)"} ${u.isPremium ? "⭐" : ""}</p>
          <p class="admin-recipe-item-meta">${u.username ? "@" + u.username : "username yo'q"} · ${langLabel} · ${date}</p>
        </div>
      </div>
    `;
  }).join("");
}

document.getElementById("userSearchInput").addEventListener("input", applyUserFilter);

// ===== Xabar yuborish (broadcast) =====
const bImageFile = document.getElementById("bImageFile");
const bImageUrl = document.getElementById("bImageUrl");
const bUploadStatus = document.getElementById("bUploadStatus");
const bImagePreview = document.getElementById("bImagePreview");
const bText = document.getElementById("bText");
const bSendBtn = document.getElementById("bSendBtn");
const bStatus = document.getElementById("bStatus");

bImageFile.addEventListener("change", async () => {
  const file = bImageFile.files[0];
  if (!file) return;
  const url = await uploadImageToImgbb(file, bUploadStatus, bImagePreview);
  if (url) bImageUrl.value = url;
});

bSendBtn.addEventListener("click", async () => {
  const text = bText.value.trim();
  if (!text) {
    bStatus.textContent = "❌ Avval xabar matnini yozing.";
    return;
  }

  if (!confirm(`Xabar barcha foydalanuvchilarga (${allAdminUsers.length || "?"} ta) yuborilsinmi?`)) return;

  bSendBtn.disabled = true;
  bSendBtn.textContent = "⏳ Yuborilmoqda...";
  bStatus.textContent = "";

  try {
    const res = await fetch("/api/broadcast", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-admin-secret": getSecret()
      },
      body: JSON.stringify({ text, imageUrl: bImageUrl.value || null })
    });
    const data = await res.json();

    if (!res.ok) {
      bStatus.textContent = "❌ Xatolik: " + (data.error || "noma'lum");
    } else {
      bStatus.textContent = `✅ Yuborildi: ${data.sent} ta · ❌ Yetkazilmadi: ${data.failed} ta · 👥 Jami: ${data.total} ta`;
      bText.value = "";
      bImageUrl.value = "";
      bImageFile.value = "";
      bImagePreview.style.display = "none";
      bUploadStatus.textContent = "";
    }
  } catch (err) {
    bStatus.textContent = "❌ Yuborishda xatolik: " + err.message;
  } finally {
    bSendBtn.disabled = false;
    bSendBtn.textContent = "📢 Barchaga yuborish";
  }
});
                              

// ===== "Uyda nima bor?" — yangi mahsulot takliflari =====
const GROUP_LABELS = {
  meat: "Go'sht, baliq va tuxum",
  veg: "Sabzavotlar",
  herbs: "Ko'katlar",
  grains: "Don va yormalar",
  dairy: "Sut mahsulotlari",
  fruit: "Mevalar",
  dessert: "Shirinlik mahsulotlari",
  other: "Boshqa mahsulotlar"
};

let allPantrySuggestions = [];

async function loadPantrySuggestions() {
  const listEl = document.getElementById("pantrySuggestionList");
  listEl.innerHTML = `<p class="admin-hint">Yuklanmoqda...</p>`;

  try {
    const res = await fetch("/api/admin-pantry?type=suggestions", {
      headers: { "x-admin-secret": getSecret() }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server xatosi (${res.status})`);

    allPantrySuggestions = data;
    renderPantrySuggestions();
  } catch (err) {
    listEl.innerHTML = `<p class="admin-hint">Xatolik: ${err.message}</p>`;
  }
}

function renderPantrySuggestions() {
  const listEl = document.getElementById("pantrySuggestionList");
  const countEl = document.getElementById("tabPantryCount");
  countEl.textContent = allPantrySuggestions.length ? `(${allPantrySuggestions.length})` : "";

  if (allPantrySuggestions.length === 0) {
    listEl.innerHTML = `<p class="admin-hint">Hozircha yangi taklif yo'q. 🎉</p>`;
    return;
  }

  listEl.innerHTML = allPantrySuggestions.map(s => `
    <div class="pantry-suggestion-item">
      <div class="pantry-suggestion-info">
        <p class="pantry-suggestion-word">${s.word}${s.occurrences > 1 ? ` <span style="font-weight:400;color:var(--text-muted);">(${s.occurrences}x)</span>` : ""}</p>
        <p class="pantry-suggestion-meta">${s.recipeTitle || ""} · "${s.sampleLine || ""}"</p>
      </div>
      <div class="pantry-suggestion-actions">
        <button class="pantry-suggestion-btn pantry-suggestion-btn--approve" data-id="${s.id}" data-action="approve">✅</button>
        <button class="pantry-suggestion-btn pantry-suggestion-btn--reject" data-id="${s.id}" data-action="reject">✕</button>
      </div>
    </div>
  `).join("");

  listEl.querySelectorAll("[data-action='reject']").forEach(btn => {
    btn.addEventListener("click", () => rejectSuggestion(btn.getAttribute("data-id")));
  });
  listEl.querySelectorAll("[data-action='approve']").forEach(btn => {
    btn.addEventListener("click", () => openApproveModal(btn.getAttribute("data-id")));
  });
}

async function rejectSuggestion(suggestionId) {
  try {
    const res = await fetch("/api/admin-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getSecret() },
      body: JSON.stringify({ action: "reject", suggestionId })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server xatosi (${res.status})`);

    allPantrySuggestions = allPantrySuggestions.filter(s => s.id !== suggestionId);
    renderPantrySuggestions();
  } catch (err) {
    alert("Xatolik: " + err.message);
  }
}

// ===== Tasdiqlash modali =====
const pantryApproveModal = document.getElementById("pantryApproveModal");
const paLabel = document.getElementById("paLabel");
const paEmoji = document.getElementById("paEmoji");
const paGroup = document.getElementById("paGroup");
const paKeywords = document.getElementById("paKeywords");
const paConfirmBtn = document.getElementById("paConfirmBtn");
const paCancelBtn = document.getElementById("paCancelBtn");
const paStatus = document.getElementById("paStatus");

let currentSuggestion = null;

function openApproveModal(suggestionId) {
  currentSuggestion = allPantrySuggestions.find(s => s.id === suggestionId);
  if (!currentSuggestion) return;

  document.getElementById("pantryApproveTitle").textContent = `"${currentSuggestion.word}" ni tasdiqlash`;
  paLabel.value = capitalize(currentSuggestion.word);
  paEmoji.value = "";
  paGroup.value = "other";
  paKeywords.value = currentSuggestion.word;
  paStatus.textContent = "";
  pantryApproveModal.classList.remove("screen-hidden");
}

function capitalize(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function slugifyId(word) {
  return String(word).toLowerCase().replace(/[^a-z0-9']/g, "").slice(0, 40);
}

paCancelBtn.addEventListener("click", () => {
  pantryApproveModal.classList.add("screen-hidden");
  currentSuggestion = null;
});

paConfirmBtn.addEventListener("click", async () => {
  if (!currentSuggestion) return;

  const label = paLabel.value.trim();
  const emoji = paEmoji.value.trim() || "🍽️";
  const groupId = paGroup.value;
  const keywords = paKeywords.value.split(",").map(k => k.trim()).filter(Boolean);

  if (!label || keywords.length === 0) {
    paStatus.textContent = "❗ Nomi va kamida bitta kalit so'z kerak.";
    return;
  }

  const ingredientId = slugifyId(label) || slugifyId(currentSuggestion.word);

  paConfirmBtn.disabled = true;
  paStatus.textContent = "Saqlanmoqda...";

  try {
    const res = await fetch("/api/admin-pantry", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-secret": getSecret() },
      body: JSON.stringify({
        action: "approve",
        suggestionId: currentSuggestion.id,
        ingredient: {
          id: ingredientId,
          label,
          emoji,
          groupId,
          groupLabel: GROUP_LABELS[groupId] || "Boshqa mahsulotlar",
          keywords
        }
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `Server xatosi (${res.status})`);

    allPantrySuggestions = allPantrySuggestions.filter(s => s.id !== currentSuggestion.id);
    renderPantrySuggestions();
    pantryApproveModal.classList.add("screen-hidden");
    currentSuggestion = null;
  } catch (err) {
    paStatus.textContent = "❌ Xatolik: " + err.message;
  } finally {
    paConfirmBtn.disabled = false;
  }
});
