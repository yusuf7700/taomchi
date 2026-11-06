// ===== Taomchi — Telegram header va fon ranglari =====
// Barcha sahifalarda <head> ichida, telegram-web-app.js dan keyin ulanadi:
// sovuq to'q-ko'k o'rniga brend rangi har sahifada bir xil bo'lsin.
try {
  const _tg = window.Telegram?.WebApp;
  if (_tg) {
    _tg.setHeaderColor?.("#6A0806");
    _tg.setBackgroundColor?.("#FDF2EB");
    _tg.setBottomBarColor?.("#FDF2EB");
  }
} catch (e) {}
