// ===== Ovqaty — Haftalik reja eslatmasi (umumiy logika) =====
// Foydalanuvchida joriy haftaga HECH NARSA rejalashtirilmagan bo'lsa
// eslatma yuboradi. api/cron-daily-reminder.js (lunch chaqiruvi) orqali
// kuniga bir marta ishga tushiriladi — alohida Vercel cron entry sifatida
// EMAS, chunki Hobby reja bitta loyihada maksimal 2ta cron'ga ruxsat beradi.

const bot = require("../bot/bot");
const { getCurrentMonday, dateKeyOf, LEGACY_DAY_ORDER } = require("./weeklyMenuDates");

const TEXT = {
  uz: {
    body: "📅 Bu haftaga hali ovqat rejalashtirilmagan! Oldindan rejalashtiring — har kuni \"bugun nima pishiray\" deb o'ylamang.",
    btn: "🗓 Haftalik menyu"
  },
  uzk: {
    body: "📅 Бу ҳафтага ҳали овқат режалаштирилмаган! Олдиндан режалаштиринг — ҳар куни \"бугун нима пиширай\" деб ўйламанг.",
    btn: "🗓 Ҳафталик меню"
  }
};

// Joriy haftaning 7 ta sana-kalitini (dushanbadan boshlab) qaytaradi
function getCurrentWeekDateKeys() {
  const monday = getCurrentMonday();
  const keys = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setUTCDate(monday.getUTCDate() + i);
    keys.push(dateKeyOf(d));
  }
  return keys;
}

// Hujjatda joriy haftaga (sana yoki hali migratsiya qilinmagan
// kun-nomli kalitlar orqali) kamida bitta reja borligini tekshiradi
function hasAnyPlanThisWeek(days, weekDateKeys) {
  if (!days) return false;
  const hasDateKeyPlan = weekDateKeys.some(key => {
    const entry = days[key];
    return entry && (entry.lunch || entry.dinner);
  });
  if (hasDateKeyPlan) return true;
  return LEGACY_DAY_ORDER.some(day => {
    const entry = days[day];
    return entry && (entry.lunch || entry.dinner);
  });
}

async function sendWeeklyReminders(db) {
  const weekDateKeys = getCurrentWeekDateKeys();
  const [menusSnap, usersSnap] = await Promise.all([
    db.collection("weeklyMenus").get(),
    db.collection("users").get()
  ]);

  const menusById = new Map(menusSnap.docs.map(doc => [doc.id, doc.data()]));

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const userDoc of usersSnap.docs) {
    const userId = userDoc.id;
    const user = userDoc.data();
    const legacyOff = user.notificationsEnabled === false;
    const weeklyOff = user.weeklyReminderEnabled !== undefined ? user.weeklyReminderEnabled === false : legacyOff;
    if (weeklyOff) { skipped++; continue; }

    const menu = menusById.get(userId);
    if (hasAnyPlanThisWeek(menu && menu.days, weekDateKeys)) { skipped++; continue; }

    const lang = user.language === "uzk" ? "uzk" : "uz";
    const tt = TEXT[lang];
    const url = `${process.env.MINI_APP_URL}/weekly-menu.html`;

    try {
      await bot.telegram.sendMessage(userId, tt.body, {
        reply_markup: { inline_keyboard: [[{ text: tt.btn, web_app: { url } }]] }
      });
      sent++;
    } catch {
      failed++; // bot bloklangan yoki chat topilmadi
    }
    await new Promise(resolve => setTimeout(resolve, 40)); // Telegram limitidan chiqmaslik uchun
  }

  return { week: weekDateKeys[0], sent, skipped, failed };
}

module.exports = { sendWeeklyReminders };
