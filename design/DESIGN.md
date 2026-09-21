# Ovqaty — Dizayn tizimi

Yo'nalish: **"Issiq Dasturxon"** — an'anaviy o'zbek dasturxoni hissi, zamonaviy va yumshoq shaklda. To'liq HTML namunasi: `style-board.html` (shu papkada).

---

## 1. Prinsiplar

1. **Sovuqlik emas — issiqlik.** Har bir sirt issiq rangda (qizil-jigar, oltin, terrakota, krem). Hech qachon kulrang yoki ko'k-qora fon ishlatilmaydi.
2. **Mukammal emas — tabiiy.** Fon uchun silliq gradient o'rniga noaniq shakldagi "blob"lar va nozik don (grain) tekstura. Hech narsa piksel-aniq simmetrik emas.
3. **Bitta ataylab qo'yilgan urg'u.** Oltin rang faqat Premium/urg'u lahzalarida ishlatiladi — bezak sifatida hech qachon sochilmaydi.
4. **Ovqatga yo'naltirilgan 3D ikonalar** — imzo uslubi, butun ilova bo'ylab izchil.

---

## 2. Ranglar

### Asosiy palitra (base hues)

| Rang | Rol | Hex |
|---|---|---|
| Maroon | Asosiy fon/brend | `#6A0806` |
| Rust | Urg'u | `#C81E08` |
| Gold | Premium urg'u | `#D9A62E` |
| Terracotta | Ikkinchi urg'u | `#B5652E` |
| Rose | Ikkinchi urg'u | `#D98B8B` |
| Sage | Kamdan-kam (yangilik) | `#8A9B6E` |
| Warm neutral | Matn/fon | `#8C7364` |

### To'liq ramkalar (50 → 900)

```
Maroon:      50 #FBEAE9  100 #F0C4C2  300 #A8433E  500 #6A0806  700 #4A0504  900 #2E0302
Rust:        50 #FDEEE9  100 #F8C9B8  300 #E0542D  500 #C81E08  700 #8F1506  900 #5C0D04
Gold:        50 #FCF3DF  100 #F3DA9C  300 #E5B94C  500 #D9A62E  700 #A67D1F  900 #6B5113
Terracotta:  50 #F7EAE1  100 #E9C4AC  300 #C77F4C  500 #B5652E  700 #854A20  900 #573015
Rose:        50 #FBEDEC  100 #F0CCC9  300 #E1A29D  500 #D98B8B  700 #B85F5F  900 #7D3F3F
Sage:        50 #F2F5EC  100 #DDE4CC  300 #A9B98A  500 #8A9B6E  700 #647249  900 #414A2F
Warm neutral:50 #FDF2EB  100 #F3E2D4  300 #C9B29C  500 #8C7364  700 #5A483D  900 #2A211C
```

### Matn/fon juftliklari (har biri WCAG AA'ga mos)

| Fon | Matn | Holat |
|---|---|---|
| `warm-50` (#FDF2EB) | `warm-900` (#2A211C) | Sahifa foni + asosiy matn |
| `#FFFFFF` | `warm-900` | Karta foni + matn |
| `maroon-500` | `#FFFFFF` | Tugma/hero foni + matn |
| `gold-50` | `gold-900` (#6B5113) | Ogohlantirish chip |
| `sage-50` | `sage-700` (#647249) | Muvaffaqiyat chip |
| `rust-50` | `rust-700` (#8F1506) | Xato chip |
| `warm-100` | `warm-700` (#5A483D) | Neytral/info chip |
| `maroon-500` → `rust-500` gradient | `#FFFFFF` | Retsept karta ustki qismi |

**Semantik ranglar** — hammasi mavjud palitradan (yangi ko'k/yashil kiritilmagan):
- Muvaffaqiyat → Sage (`sage-50` fon / `sage-700` matn)
- Ogohlantirish → Gold (`gold-50` / `gold-700`)
- Xato → Rust (`rust-50` / `rust-700`)
- Ma'lumot → Warm neutral (`warm-100` / `warm-700`)

### 60/30/10 nisbat

- **60%** — Warm cream (`warm-50`) fon va oq kartalar
- **30%** — Maroon/Rust (asosiy brend rangi — header, tugmalar, hero)
- **10%** — Gold (faqat Premium/urg'u), Terracotta/Rose (ikkinchi darajali urg'ular), Sage (kamdan-kam)

### Qorong'i rejim

Hozircha **kerak emas** (qaror qilingan) — Ovqaty faqat yorug' rejimda ishlaydi.

---

## 3. Tipografiya

| Rol | Shrift | O'lcham (desktop / mobil) | Og'irlik |
|---|---|---|---|
| Display | Yeseva One | 52px / 34px | 400 (shrift o'zi qalin ko'rinishga ega) |
| Sub-line | Yeseva One | 26px / 22px | 400 |
| Label | Mulish | 13px | 700 |
| Body | Mulish | 16px, line-height 1.7 | 400 |
| Caption | Mulish | 13px | 400 |
| Mono (faqat narx/statistika) | JetBrains Mono | 20px | 600 |

Ikkalasi ham (Yeseva One, Mulish, JetBrains Mono) to'liq kirill harflarini qo'llab-quvvatlaydi — o'zbek tilining ikkala yozuvi (lotin/kirill) uchun ham xavfsiz.

**Qoida:** ALL CAPS yorliqlar ishlatilmaydi (sentence case saqlanadi), bitta so'zni bo'yash/kursiv qilish orqali "AI-uslubidagi" urg'u berilmaydi.

---

## 4. Shakl va bo'shliq

| Token | Qiymat | Ishlatilishi |
|---|---|---|
| `--radius-sm` | 10px | Chip, input, kichik karta |
| `--radius-md` | 16px | Asosiy kartalar |
| `--radius-lg` | 26px | Hero, katta bannerlar |
| Soya | `0 10px 26px rgba(42,33,28,0.12)` | Issiq-tusli soya (kulrang emas!) |
| Bo'shliq | 8 / 12 / 16 / 24 / 32 / 44px | Standart shkala |

---

## 5. Komponentlar

- **Tugmalar:** Primary (maroon fon, oq matn, to'liq radius), Secondary (oq fon, maroon ramka+matn), Ghost (faqat matn, tag' chizig'i bilan)
- **Chiplar:** semantik ranglar bo'yicha (yuqoridagi jadval)
- **Kartalar:** oq fon, 16px radius, issiq soya. Retsept kartalarida ustki qismi gradient (maroon→rust) + emoji/ikonka
- **Statistik mini-kartalar:** `warm-100` fon, mono raqam + kichik label
- **Input:** oq fon, `maroon-100` ramka, 10px radius
- **Pastki navigatsiya:** to'liq radius (pill), faol element maroon rangda

---

## 6. Motivlar (signature)

- **3D loy-render ikonalar** — issiq ranglarda, yaltiroq, yumaloq (mavjud ikona to'plamingiz)
- **Organik "blob" shakllar** — mukammal doira emas, tasodifiy asimmetrik radius (`63% 37% 54% 46% / 55% 48% 52% 45%` uslubida)
- **Nozik don/tekstura** — silliq/glyansli emas
- **"Chek" uslubidagi qatlamli kartalar** — profil sahifasidagi Premium popup allaqachon shu uslubda
- **Ikatdan ilhomlangan naqsh** — soddalashtirilgan romb zanjiri + oltin nuqtalar (SVG, `style-board.html`da namuna bor). Faqat **chegara/bezak** sifatida (sahifa chekkasi, karta ustki chizig'i) — hech qachon asosiy fon sifatida, chunki matn o'qilishini buzadi
- **Logotip** — YAKUNIY va o'zgartirilmaydi (`assets/logo.png`): qopqoq (taom qopqog'i) siluyeti + yurak shaklidagi bug' tepada + "Ovqaty" so'zi o'ziga xos yumaloq harflar bilan (bespoke lettering, Yeseva One emas) + tagida tabassum shaklidagi qizil chiziq. **Muhim:** logotipning o'z harf chizig'i bor — bu atayin Yeseva One display shriftidan farq qiladi va shunday qoladi; faqat oddiy matn/sarlavhalarda Yeseva One ishlatiladi, logotipning o'zi hech qachon shrift bilan qayta yozilmaydi

---

## 6.1. Ehtiyot bo'lish kerak bo'lgan narsalar

Referens sifatida AI orqali generatsiya qilingan rasmlarda ba'zi narsalar chiqib qoldi — bular dizayn tizimining **rasmiy qismi emas**, chunki amalda muammo tug'diradi:

- **Professional taom fotografiyasi** — chiroyli ko'rinadi, lekin har bir retsept uchun sifatli surat topish/sur'atga olish katta mehnat talab qiladi. Hozircha 3D-ikonalar bilan davom etiladi; fotografiya faqat alohida "bayroqcha" retseptlar uchun, kelajakda, ixtiyoriy qo'shimcha sifatida ko'rib chiqiladi
- **Yurak belgisi** — faqat logotipning bitta kichik detali sifatida ishlatiladi, matn yoki UI elementlarida keng tarqalgan holda emas (ovqat ilovasi uchun "romantik"lik emas, "issiqlik" kerak)
- **Bezak uchun bezak** (masalan funksiyasiz chat pufakchasi) — har bir vizual element haqiqiy funksiyaga ulanishi kerak, aks holda qo'shilmaydi

---

## 7. Fonlar

- **Haqiqiy render:** organik blob (terracotta/rose rangda, past shaffoflik) + warm-50 fon
- **CSS fallback:** oddiy `warm-100` tekis fon (blob CSS qo'llab-quvvatlanmasa)

---

## 8. Format retseptlari

| Format | Qanday qo'llaniladi |
|---|---|
| Veb-sayt | Maroon hero + blob dekor, asimmetrik 2-ustunli joylashuv (chapda matn, o'ngda blob) |
| 16:9 slaydlar | Sarlavha slayd (warm-50 fon, eyebrow label) + statistik slayd (maroon fon, gold mono raqam) |
| 4:5 karusel (Instagram/Telegram) | Har bir post — gradient yoki bitta to'q rang fon, Yeseva One sarlavha, kichik "Ovqaty" belgisi yuqorida |
| Hujjatlar (paper mode) | Oq fon, yuqorida 6px gold chiziq, Yeseva One sarlavha, punktir ajratgich |
| Ilova UI | Mavjud vanilla CSS tokenlar orqali (pastga qarang) |

---

## 9. Harakat (motion)

- Faqat foydalanuvchi harakatiga javoban (tugma bosilganda active-holat, karta ochilganda) — sahifa yuklanganda avtomatik "fade-slide-up" animatsiyalar ishlatilmaydi
- Bitta o'ylab qo'yilgan lahza (masalan onboarding tour o'tishi) — hamma joyda emas

---

## 10. Do / Don't

| Qil | Qilma |
|---|---|
| Issiq soya (`rgba(42,33,28,...)`) | Kulrang soya (`rgba(0,0,0,...)`) |
| Sentence case yorliqlar | ALL CAPS yorliqlar |
| Bitta oltin urg'u (Premium) | Oltinni hamma joyda sochish |
| Organik blob/tekstura | Silliq/mukammal gradient |
| 3D loy-ikonalar izchil | Emoji va 3D ikonalarni aralashtirib, tasodifiy ishlatish |
| Yurak — faqat logotipda, kichik detal | Yurak belgisini matn/UI bo'ylab tarqatish |
| Ikat naqsh — faqat chegara/bezak | Ikat naqshni asosiy fon sifatida (o'qishni buzadi) |

---

## 11. Copy-paste CSS tokenlar

```css
:root{
  --maroon-50:#FBEAE9; --maroon-100:#F0C4C2; --maroon-300:#A8433E; --maroon-500:#6A0806; --maroon-700:#4A0504; --maroon-900:#2E0302;
  --rust-50:#FDEEE9; --rust-100:#F8C9B8; --rust-300:#E0542D; --rust-500:#C81E08; --rust-700:#8F1506; --rust-900:#5C0D04;
  --gold-50:#FCF3DF; --gold-100:#F3DA9C; --gold-300:#E5B94C; --gold-500:#D9A62E; --gold-700:#A67D1F; --gold-900:#6B5113;
  --terracotta-50:#F7EAE1; --terracotta-100:#E9C4AC; --terracotta-300:#C77F4C; --terracotta-500:#B5652E; --terracotta-700:#854A20; --terracotta-900:#573015;
  --rose-50:#FBEDEC; --rose-100:#F0CCC9; --rose-300:#E1A29D; --rose-500:#D98B8B; --rose-700:#B85F5F; --rose-900:#7D3F3F;
  --sage-50:#F2F5EC; --sage-100:#DDE4CC; --sage-300:#A9B98A; --sage-500:#8A9B6E; --sage-700:#647249; --sage-900:#414A2F;
  --warm-50:#FDF2EB; --warm-100:#F3E2D4; --warm-300:#C9B29C; --warm-500:#8C7364; --warm-700:#5A483D; --warm-900:#2A211C;

  --bg-page:var(--warm-50);
  --bg-surface:#FFFFFF;
  --bg-surface-2:var(--warm-100);
  --text-primary:var(--warm-900);
  --text-secondary:var(--warm-700);
  --text-muted:var(--warm-300);
  --border:var(--warm-100);
  --brand:var(--maroon-500);
  --brand-strong:var(--maroon-700);
  --accent:var(--rust-500);
  --premium:var(--gold-500);

  --font-display:'Yeseva One', serif;
  --font-body:'Mulish', sans-serif;
  --font-mono:'JetBrains Mono', monospace;

  --radius-sm:10px; --radius-md:16px; --radius-lg:26px;
}
```

**Google Fonts import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Yeseva+One&family=Mulish:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap" rel="stylesheet">
```

Tailwind tokenlari kerak emas — Ovqaty vanilla CSS bilan yozilgan.

---

## 12. Ishga tushirishdan oldingi tekshiruv (pre-ship checklist)

- [ ] Yangi rang qo'shilganda — u yuqoridagi ramkalardan kelib chiqadimi (yangi tasodifiy hex emasmi)?
- [ ] Matn/fon jufti WCAG AA kontrastiga mosmi (yuqoridagi jadvaldan foydalaning)?
- [ ] Oltin faqat Premium/urg'u uchun ishlatildimi (bezak sifatida sochilmadimi)?
- [ ] Soya issiq-tusli (`rgba(42,33,28,...)`), kulrang emasmi?
- [ ] Yorliqlar sentence case'da, ALL CAPS emasmi?
- [ ] Kirill matn (uzk tili) shu shriftlarda to'g'ri ko'rinadimi?
- [ ] Mobil (390px) kenglikda joylashuv buzilmaydimi?
