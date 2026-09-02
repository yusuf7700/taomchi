// ===== Taomchi — Xavfsiz (constant-time) taqqoslash =====
// Oddiy "===" orqali maxfiy kalitlarni solishtirish "timing attack"ga
// nazariy jihatdan zaif (taqqoslash vaqti dastlabki mos kelmagan belgi
// pozitsiyasiga bog'liq bo'lishi mumkin). crypto.timingSafeEqual bu
// muammoni butunlay bartaraf etadi.

const crypto = require("crypto");

function safeCompare(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");
  if (bufA.length !== bufB.length) return false;
  return crypto.timingSafeEqual(bufA, bufB);
}

module.exports = { safeCompare };
