// ===== Taomchi — Admin panel logikasi =====

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
  return { ok: res.ok, status: res.status };
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
    loginError.textContent = `Server xatosi (kod: ${result.status}). Vercel'dagi FIREBASE_SERVICE_ACCOUNT to'g'ri joylashtirilganini tekshiring.`;
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
  loginScreen.style.display = "none";
  adminPanel.style.display = "block";
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

// ===== Rasm yuklash (imgbb) =====
const fImageFile = document.getElementById("fImageFile");
const fImageUrl = document.getElementById("fImageUrl");
const uploadStatus = document.getElementById("uploadStatus");
const imagePreview = document.getElementById("imagePreview");

fImageFile.addEventListener("change", async () => {
  const file = fImageFile.files[0];
  if (!file) return;

  uploadStatus.textContent = "Yuklanmoqda...";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      fImageUrl.value = data.data.url;
      imagePreview.src = data.data.url;
      imagePreview.style.display = "block";
      uploadStatus.textContent = "✅ Rasm yuklandi";
    } else {
      uploadStatus.textContent = "❌ Xatolik: " + (data.error?.message || "noma'lum");
    }
  } catch (err) {
    uploadStatus.textContent = "❌ Yuklashda xatolik: " + err.message;
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
    imageUrl: fImageUrl.value.trim(),
    ingredients: parseIngredients(document.getElementById("fIngredients").value),
    steps: parseSteps(document.getElementById("fSteps").value),
    cookTime: Number(document.getElementById("fCookTime").value) || 0,
    servings: Number(document.getElementById("fServings").value) || 0,
    category: document.getElementById("fCategory").value,
    difficulty: document.getElementById("fDifficulty").value,
    author: document.getElementById("fAuthor").value.trim(),
    sourceUrl: document.getElementById("fSourceUrl").value.trim(),
    isPremium: document.getElementById("fPremium").checked,
    rating: 0
  };
}

function clearForm() {
  document.getElementById("fTitle").value = "";
  document.getElementById("fImageFile").value = "";
  fImageUrl.value = "";
  imagePreview.style.display = "none";
  uploadStatus.textContent = "";
  document.getElementById("fIngredients").value = "";
  document.getElementById("fSteps").value = "";
  document.getElementById("fCookTime").value = "";
  document.getElementById("fServings").value = "";
  document.getElementById("fCategory").value = "main";
  document.getElementById("fDifficulty").value = "oson";
  document.getElementById("fAuthor").value = "";
  document.getElementById("fSourceUrl").value = "";
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

    if (!res.ok) throw new Error("Server xatosi");

    formStatus.textContent = "✅ Saqlandi!";
    clearForm();
    loadRecipes();
  } catch (err) {
    formStatus.textContent = "❌ Xatolik: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("cancelEditBtn").addEventListener("click", clearForm);

// ===== Ro'yxat: yuklash va chizish =====
let allAdminRecipes = [];

async function loadRecipes() {
  const listEl = document.getElementById("adminRecipeList");
  listEl.innerHTML = `<p class="admin-hint">Yuklanmoqda...</p>`;

  try {
    const res = await fetch("/api/admin-recipes", {
      headers: { "x-admin-secret": getSecret() }
    });
    allAdminRecipes = await res.json();
    renderAdminList(allAdminRecipes);
  } catch (err) {
    listEl.innerHTML = `<p class="admin-hint">Xatolik: ${err.message}</p>`;
  }
}

function renderAdminList(recipes) {
  const listEl = document.getElementById("adminRecipeList");
  if (recipes.length === 0) {
    listEl.innerHTML = `<p class="admin-hint">Hozircha retsept yo'q.</p>`;
    return;
  }

  listEl.innerHTML = recipes.map(r => `
    <div class="admin-recipe-item">
      <div class="admin-recipe-item-info">
        <p class="admin-recipe-item-title">${r.title || "(nomsiz)"}</p>
        <p class="admin-recipe-item-meta">${r.category || "-"} · ⏱ ${r.cookTime || "-"} daq</p>
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
  fImageUrl.value = r.imageUrl || "";
  if (r.imageUrl) {
    imagePreview.src = r.imageUrl;
    imagePreview.style.display = "block";
  }
  document.getElementById("fIngredients").value = ingredientsToText(r.ingredients);
  document.getElementById("fSteps").value = stepsToText(r.steps);
  document.getElementById("fCookTime").value = r.cookTime || "";
  document.getElementById("fServings").value = r.servings || "";
  document.getElementById("fCategory").value = r.category || "main";
  document.getElementById("fDifficulty").value = r.difficulty || "oson";
  document.getElementById("fAuthor").value = r.author || "";
  document.getElementById("fSourceUrl").value = r.sourceUrl || "";
  document.getElementById("fPremium").checked = !!r.isPremium;
  document.getElementById("fEditId").value = r.id;

  document.getElementById("formTitle").textContent = "✏️ Retseptni tahrirlash";
  document.getElementById("submitBtn").textContent = "💾 Yangilash";
  document.getElementById("cancelEditBtn").style.display = "block";

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
document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = allAdminRecipes.filter(r =>
    (r.title || "").toLowerCase().includes(q) ||
    (r.category || "").toLowerCase().includes(q)
  );
  renderAdminList(filtered);
});
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
  loginScreen.style.display = "none";
  adminPanel.style.display = "block";
  loadRecipes();
}

// Sahifa ochilganda avvalgi login saqlangan bo'lsa, avtomatik kirish
(async function initAuth() {
  const saved = getSecret();
  if (saved && (await tryLogin(saved))) {
    showPanel();
  }
})();

// ===== Rasm yuklash (imgbb) =====
const fImageFile = document.getElementById("fImageFile");
const fImageUrl = document.getElementById("fImageUrl");
const uploadStatus = document.getElementById("uploadStatus");
const imagePreview = document.getElementById("imagePreview");

fImageFile.addEventListener("change", async () => {
  const file = fImageFile.files[0];
  if (!file) return;

  uploadStatus.textContent = "Yuklanmoqda...";

  const formData = new FormData();
  formData.append("image", file);

  try {
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
      method: "POST",
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      fImageUrl.value = data.data.url;
      imagePreview.src = data.data.url;
      imagePreview.style.display = "block";
      uploadStatus.textContent = "✅ Rasm yuklandi";
    } else {
      uploadStatus.textContent = "❌ Xatolik: " + (data.error?.message || "noma'lum");
    }
  } catch (err) {
    uploadStatus.textContent = "❌ Yuklashda xatolik: " + err.message;
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
    imageUrl: fImageUrl.value.trim(),
    ingredients: parseIngredients(document.getElementById("fIngredients").value),
    steps: parseSteps(document.getElementById("fSteps").value),
    cookTime: Number(document.getElementById("fCookTime").value) || 0,
    servings: Number(document.getElementById("fServings").value) || 0,
    category: document.getElementById("fCategory").value,
    difficulty: document.getElementById("fDifficulty").value,
    author: document.getElementById("fAuthor").value.trim(),
    sourceUrl: document.getElementById("fSourceUrl").value.trim(),
    isPremium: document.getElementById("fPremium").checked,
    rating: 0
  };
}

function clearForm() {
  document.getElementById("fTitle").value = "";
  document.getElementById("fImageFile").value = "";
  fImageUrl.value = "";
  imagePreview.style.display = "none";
  uploadStatus.textContent = "";
  document.getElementById("fIngredients").value = "";
  document.getElementById("fSteps").value = "";
  document.getElementById("fCookTime").value = "";
  document.getElementById("fServings").value = "";
  document.getElementById("fCategory").value = "main";
  document.getElementById("fDifficulty").value = "oson";
  document.getElementById("fAuthor").value = "";
  document.getElementById("fSourceUrl").value = "";
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

    if (!res.ok) throw new Error("Server xatosi");

    formStatus.textContent = "✅ Saqlandi!";
    clearForm();
    loadRecipes();
  } catch (err) {
    formStatus.textContent = "❌ Xatolik: " + err.message;
  } finally {
    submitBtn.disabled = false;
  }
});

document.getElementById("cancelEditBtn").addEventListener("click", clearForm);

// ===== Ro'yxat: yuklash va chizish =====
let allAdminRecipes = [];

async function loadRecipes() {
  const listEl = document.getElementById("adminRecipeList");
  listEl.innerHTML = `<p class="admin-hint">Yuklanmoqda...</p>`;

  try {
    const res = await fetch("/api/admin-recipes", {
      headers: { "x-admin-secret": getSecret() }
    });
    allAdminRecipes = await res.json();
    renderAdminList(allAdminRecipes);
  } catch (err) {
    listEl.innerHTML = `<p class="admin-hint">Xatolik: ${err.message}</p>`;
  }
}

function renderAdminList(recipes) {
  const listEl = document.getElementById("adminRecipeList");
  if (recipes.length === 0) {
    listEl.innerHTML = `<p class="admin-hint">Hozircha retsept yo'q.</p>`;
    return;
  }

  listEl.innerHTML = recipes.map(r => `
    <div class="admin-recipe-item">
      <div class="admin-recipe-item-info">
        <p class="admin-recipe-item-title">${r.title || "(nomsiz)"}</p>
        <p class="admin-recipe-item-meta">${r.category || "-"} · ⏱ ${r.cookTime || "-"} daq</p>
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
  fImageUrl.value = r.imageUrl || "";
  if (r.imageUrl) {
    imagePreview.src = r.imageUrl;
    imagePreview.style.display = "block";
  }
  document.getElementById("fIngredients").value = ingredientsToText(r.ingredients);
  document.getElementById("fSteps").value = stepsToText(r.steps);
  document.getElementById("fCookTime").value = r.cookTime || "";
  document.getElementById("fServings").value = r.servings || "";
  document.getElementById("fCategory").value = r.category || "main";
  document.getElementById("fDifficulty").value = r.difficulty || "oson";
  document.getElementById("fAuthor").value = r.author || "";
  document.getElementById("fSourceUrl").value = r.sourceUrl || "";
  document.getElementById("fPremium").checked = !!r.isPremium;
  document.getElementById("fEditId").value = r.id;

  document.getElementById("formTitle").textContent = "✏️ Retseptni tahrirlash";
  document.getElementById("submitBtn").textContent = "💾 Yangilash";
  document.getElementById("cancelEditBtn").style.display = "block";

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
document.getElementById("searchInput").addEventListener("input", (e) => {
  const q = e.target.value.trim().toLowerCase();
  const filtered = allAdminRecipes.filter(r =>
    (r.title || "").toLowerCase().includes(q) ||
    (r.category || "").toLowerCase().includes(q)
  );
  renderAdminList(filtered);
});
