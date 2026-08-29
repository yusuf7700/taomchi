// ===== Taomchi — Telegram Mini App initData'ni tekshirish =====
// Mini App'dan (masalan profile.js) server'ga so'rov kelganda, "bu haqiqatan
// ham shu Telegram foydalanuvchisimi" ekanini tasdiqlash uchun ishlatiladi.
// Bo'lmasa, boshqa birov faqat sizning Telegram ID'ingizni bilib, sizning
// sozlamalaringizni o'zgartira olardi.
//
// Rasmiy Telegram algoritmi:
// https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app

const crypto = require("crypto");

// initData — tg.initData qatori (query-string ko'rinishida)
// botToken — process.env.BOT_TOKEN
// Qaytaradi: Telegram foydalanuvchi obyekti ({ id, first_name, username, ... })
//            yoki imzo noto'g'ri/eskirgan bo'lsa — null
function verifyTelegramInitData(initData, botToken, maxAgeSeconds = 86400) {
  if (!initData || !botToken) return null;

  let params;
  try {
    params = new URLSearchParams(initData);
  } catch {
    return null;
  }

  const hash = params.get("hash");
  if (!hash) return null;
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const computedHash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (computedHash !== hash) return null;

  const authDate = parseInt(params.get("auth_date") || "0", 10);
  if (maxAgeSeconds && authDate && (Date.now() / 1000 - authDate) > maxAgeSeconds) {
    return null; // eskirgan initData (masalan sahifa uzoq vaqt ochiq turgan)
  }

  const userJson = params.get("user");
  if (!userJson) return null;

  try {
    return JSON.parse(userJson);
  } catch {
    return null;
  }
}

module.exports = { verifyTelegramInitData };
