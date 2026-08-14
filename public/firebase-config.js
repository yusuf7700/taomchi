// ===== Taomchi — Firebase ulanish =====
// Bu fayl index.html'da firebase-app-compat.js va
// firebase-firestore-compat.js skriptlaridan KEYIN yuklanishi shart.

const firebaseConfig = {
  apiKey: "AIzaSyBXYwHVHMO_BCUphenGOmPZYuda7vrIRaU",
  authDomain: "taomchi.firebaseapp.com",
  projectId: "taomchi",
  storageBucket: "taomchi.firebasestorage.app",
  messagingSenderId: "689399488321",
  appId: "1:689399488321:web:461b896effaee8793fcbc0"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Telegram Mini App (WebView) ba'zan WebSocket ulanishini bloklaydi,
// shuning uchun Firestore so'rovlari "osilib qolishi" mumkin. Shu sozlama
// avtomatik ravishda muqobil (long-polling) usulga o'tkazadi.
db.settings({ experimentalAutoDetectLongPolling: true, merge: true });
