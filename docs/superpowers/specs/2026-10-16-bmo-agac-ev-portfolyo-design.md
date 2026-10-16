# BMO Ağaç Ev Portfolyosu — Tasarım

Tarih: 2026-10-16
Durum: İnceleme bekliyor

## 1. Amaç ve hedef kitle

Erdem'in projelerini düzenli biçimde sergileyen ve kendini tanıttığı kişisel portfolyo sitesi.
Mevcut sürüm (tek dosya `index.html`, `bg.webp`, `teypo.png`) konsept olarak çalışıyor ama
bulanık görseller, tek parça raster karakter ve kaba animasyonlar yüzünden amatör görünüyor.
Bu tasarım siteyi baştan, aynı "kaseti robota tak, proje oynasın" konseptiyle yeniden kurar.

- **Birincil kitle:** İşverenler / staj yerleri (başvurularda link olarak verilir).
- **İkincil kitle:** Herkes (arkadaşlar, sosyal medya).
- **Dil:** Türkçe ve İngilizce.

### Başarı ölçütleri

1. 375 px telefondan 2560 px geniş ekrana kadar tüm görseller keskin (hepsi vektör).
2. Animasyonlar orta seviye bir dizüstünde akıcı (60 fps hedefi, takılma yok).
3. Lighthouse: Performans ≥ 90, Erişilebilirlik ≥ 95, SEO ≥ 95.
4. Her proje dört yoldan erişilebilir: sürükle-tak, tıkla-tak, klavye (Tab + Enter), hızlı görünüm listesi.
5. Bir işveren 10 saniye içinde "Liste" düğmesiyle tüm projeleri, CV'yi ve iletişimi görebilir.

## 2. Alınan kararlar

| Konu | Karar |
|---|---|
| Karakter | Birebir BMO (Adventure Time), fan-art olarak. Altbilgide not: "BMO fan-art'ıdır. Adventure Time © Cartoon Network." |
| Görseller | Hepsi kodla çizilmiş SVG (BMO, ağaç ev, kasetler, nesneler). Raster görsel yalnızca proje ekran görüntüleri ve OG görseli. |
| Teknoloji | Vite + saf JavaScript (ES modülleri) + satır içi SVG + GSAP 3. Framework yok. |
| Proje gösterimi | Kaset takılınca kamera BMO'nun ekranına yakınlaşır, proje BMO'nun ekranında okunur. |
| Atmosfer | Finn & Jake'in ağaç evi; gerçek saate bağlı gün/gece döngüsü; Finn/Jake göndermeleri. |
| İşveren modu | "Liste" hızlı görünümü + CV indirme + iletişim. |
| Ses | Varsayılan **kapalı**; düğmeyle açılır. |
| Yayın | Vercel'de statik site. |

## 3. Kapsam

**Kapsam içinde:** Sahne, BMO, kasetler, takma/çıkarma koreografisi, kamera zoom, BMO ekranında
proje görünümü, konuşma balonu, gün/gece, parallax, Finn/Jake nesneleri, mobil düzen, hızlı görünüm,
TR/EN, ses efektleri + kısa chiptune döngüleri, SEO/OG, yükleme ekranı, Vercel yayını, testler.

**Kapsam dışında:** Yönetim paneli / CMS, backend, iletişim formu (yalnızca `mailto:` ve sosyal linkler),
blog, analitik (ileride eklenebilir), 3D.

## 4. Görsel dil

- **Çizim stili:** Adventure Time: kalın, hafif düzensiz koyu kahve kontur (`--ink`), düz pastel dolgu,
  gölgeler tek ton koyu düz alan. Gradyan yalnızca ışık efektlerinde (huzme, fener parıltısı).
- **Fontlar (Google Fonts):** Başlık ve konuşma balonu için `Gochi Hand`, BMO ekranı için `VT323`,
  gövde metni için `Nunito` (500/700/800). `font-display: swap`, ön yükleme (`preload`).
- **Renk tokenları:** Tüm renkler `:root` üzerinde CSS değişkeni. Her gün dilimi bir sınıfla
  (`.t-morning`, `.t-noon`, `.t-sunset`, `.t-night`) bu değişkenlerin bir alt kümesini yeniden tanımlar.

## 5. Sahne: Ağaç ev

### 5.1 Koordinat sistemi ve ölçekleme

- Sahne tasarım ölçeği: **1920 × 1080** (`viewBox="0 0 1920 1080"`).
- Ekranı `cover` mantığıyla doldurur (mevcut `fit()` mantığı korunur, `1.04` fazlalık parallax payı için kalır).
- **Güvenli bölge:** Ortadaki **1440 × 1080** alan. BMO, kasetler ve tüm tıklanabilir nesneler bu bölgede.
  4:3 ve daha geniş yatay ekranlarda hiçbir etkileşimli öğe kırpılmaz.
- **Dar düzen tetikleyicisi:** `(max-width: 700px)` **veya** `(orientation: portrait)`. Bu durumda
  kasetler sahneden çıkıp alt kaset rafına (bkz. 8.1) taşınır.

### 5.2 Parallax katmanları (hepsi ayrı `<g>` / SVG)

| Katman | İçerik | Parallax katsayısı |
|---|---|---|
| L0 Dış | Yuvarlak pencereden görünen gökyüzü, bulutlar, Ooo tepeleri, (gece) yıldızlar, ay | 0.2 |
| L1 Duvar | Ağaç gövdesinin iç kıvrımları, kütük halkaları, raflar, kitaplar, asılı saksılar | 0.4 |
| L2 Oda | Zemin tahtaları, halı, kanepe, merdiven, fenerler, kaset yuvaları, Finn/Jake nesneleri, BMO | 0.7 |
| L3 Ön | Kenarlardan sarkan sarmaşık ve yapraklar | 1.3 |

- Fare ile yatay ±12 px, dikey ±8 px (L2 katmanında); diğer katmanlar katsayıyla çarpılır.
- Dokunmatik cihazlarda parallax yok (cihaz eğimi kullanılmaz: izin istemi gerektirir, YAGNI).
- Hareket `gsap.quickTo` ile yumuşatılır.

### 5.3 Gün/gece döngüsü

| Dilim | Saat (yerel) | Özellikler |
|---|---|---|
| Sabah | 06:00–10:59 | Açık mavi gök, yumuşak sarı ışık huzmesi, toz zerreleri |
| Öğle | 11:00–16:59 | Parlak gök, güçlü huzme, toz zerreleri |
| Gün batımı | 17:00–19:59 | Turuncu-pembe gök, uzun turuncu huzme, fenerler hafif yanık |
| Gece | 20:00–05:59 | Lacivert gök, yıldızlar + ay, fenerler yanık ve titrek, ateş böcekleri, huzme yok |

- Sağ üstte güneş/ay düğmesi: dilimler arasında elle geçiş (otomatik moda dönmek için sayfa yenilenir; seçim kalıcı değil).
- Dilim geçişi CSS değişkenleriyle 600 ms renk geçişi.
- Toz zerreleri ve ateş böcekleri tek bir `<canvas>` üzerinde (mevcut `dust` döngüsünün genelleştirilmiş hali),
  sekme gizliyken durur, `prefers-reduced-motion` açıkken hiç çizilmez.

### 5.4 Finn/Jake göndermeleri (tıklanabilir)

| Nesne | Konum | Tıklanınca |
|---|---|---|
| Finn'in beyaz ayı şapkası + yeşil sırt çantası | Duvardaki askı | BMO repliği |
| Jake'in violası | Köşeye yaslı | BMO repliği + 3–4 notalık kısa melodi (ses açıksa) |
| Altın kılıç | Duvarda asılı | BMO repliği |
| Enchiridion | Rafta | BMO repliği |
| Altın / hazine yığını | Bir köşede | BMO repliği + birkaç altın sekme animasyonu |

Her nesnenin hover/odak durumunda hafif parıltı; `role="button"`, `tabindex="0"`, `aria-label` TR/EN.

### 5.5 Kaset yuvaları

- Odada önceden tanımlı **10 kaset yuvası** (raf üstü, kanepe, halı, sehpa, zemin vb.), her biri
  `{x, y, scale, rotate}` ve hepsi güvenli bölgede.
- Projeler `projects.json` sırasına göre yuvalara yerleşir.
- 10'dan fazla proje varsa fazlası sahnede gösterilmez, yalnızca hızlı görünümde listelenir ve geliştirme
  modunda konsola uyarı yazılır.

## 6. BMO

### 6.1 Yapı (tek SVG, ayrı gruplar)

- `#bmo-body`: Teal gövde kutusu (BMO'nun özgün oranları), yan gölge yüzü.
- `#bmo-screen`: Açık yeşil ekran çerçevesi ve ekran yüzeyi; yüz ifadeleri bunun içinde.
- `#bmo-face`: Gözler (göz bebekleri ayrı), ağız, yanaklar.
- `#bmo-slot`: Ön yüzdeki kaset yuvası (dizideki kartuş yuvasının kaset boyutuna uyarlanmış hali),
  menteşeli kapak (`#bmo-lid`) ve kaset içerideyken görünen makara penceresi.
- `#bmo-controls`: D-pad, kırmızı yuvarlak tuş, yeşil küçük tuş, mavi üçgen tuş, hoparlör delikleri.
- `#bmo-arm-l`, `#bmo-arm-r`, `#bmo-leg-l`, `#bmo-leg-r`: İnce uzuvlar, eklem noktasından döner.

### 6.2 Ekran ifadeleri (`faces.js`)

| Durum | İfade |
|---|---|
| `idle` | Nokta gözler, küçük gülümseme |
| `blink` | Gözler çizgi (130 ms) |
| `hungry` | Büyük gözler, "O" ağız (kaset sürüklenirken) |
| `talk` | Ağız açık/kapalı kare değişimi (konuşma sürerken) |
| `happy` | "^ ^" kapalı gözler, geniş gülümseme (kaset takılınca) |
| `sad` | Kısa "aww" yüzü (kaset yanlış yere bırakılınca) |
| `giggle` | Kıkırdama (BMO'ya tıklanınca) |
| `loading` | "Loading…" + piksel ilerleme çubuğu (açılış) |

### 6.3 Davranışlar (`behavior.js`)

- Göz kırpma: 2,5–5,5 sn rastgele aralık, %25 olasılıkla çift kırpma.
- Göz bebekleri fareyi izler (ekran yüzeyi içinde sınırlı, en fazla 4 px kayma).
- Boşta: bacak sallama döngüsü; 20–40 sn'de bir rastgele küçük dans veya mırıldanma
  (konuşma balonunda "♪ hmm hmm ♪").
- BMO'ya tıklama: `giggle` + rastgele bir replik; kaset takılıysa proje ekranını yeniden açar.

## 7. Etkileşim akışı

### 7.1 Açılış

1. Yükleme ekranı: Ortada BMO'nun ekranı, `loading` ifadesi; fontlar ve kritik SVG hazır olunca biter
   (en fazla 2,5 sn; süre dolarsa yine açılır).
2. Sahne 500 ms'de açılır, BMO el sallar, konuşma balonunda karşılama repliği.

### 7.2 Konuşma balonu (`speech.js`)

- Mevcut alt terminal kutusu **kaldırılır**.
- BMO'nun yanında el çizimi kenarlı konuşma balonu (SVG kuyruk), `Gochi Hand`.
- Harf harf yazım (28 ms/harf), her 3 harfte bir `blip` sesi, yazım süresince `talk` ifadesi.
- `aria-live="polite"` bölge; yeni replik eskisini keser.
- Masaüstünde balonun altında küçük ipucu satırı: "[sürükle] kaseti BMO'ya tak · [tıkla] hızlı oynat".

### 7.3 Kaset takma koreografisi (`choreo.js`, GSAP zaman çizelgeleri)

1. **Kapma:** Kaset ölçeği 1.08, hafif sallanma; BMO `hungry`. İpucu yazısı kaybolur.
2. **Sürükleme:** Mevcut pointer-event mantığı korunur (pointer capture, 7 px eşik). Görsel takip
   `gsap.quickTo` ile; kaset yatay hıza göre ±12° eğilir ve yay gibi geri döner.
   BMO'ya yaklaşınca (yuva merkezine < 220 px, sahne ölçeğinde) yuva parlar, BMO kollarını uzatır.
3. **Bırakma (BMO üstünde):** Kaset yuva hizasına kayar → kapak 0°'den 80°'ye açılır → kaset küçülerek
   yuvaya girer → kapak kapanır ("klak" sesi) → BMO gövdesi esner (squash & stretch) → `happy`.
4. **Makaralar:** Yuva penceresinde makaralar döner; BMO'dan nota (♪ ♫) yükselir; ses açıksa projeye
   özgü kısa chiptune döngüsü başlar.
5. **Kamera zoom (`screen.js`):** Sahne kabı, BMO'nun ekran dikdörtgeni görüntünün ~%80'ini
   (kısa kenara göre) kaplayacak şekilde 700 ms `power2.inOut` ile ölçeklenir ve kaydırılır.
   Arka plan katmanları `blur(4px)` + %30 karartma.
6. **Ekran:** Proje içeriği **HTML katmanı** olarak, zoom sonunda BMO ekran dikdörtgeninin
   ekran koordinatlarına hizalanır (metin seçilebilir, erişilebilir, ekran okuyucu dostu).
   CRT açılma efekti (yatay çizgiden açılma + tarama çizgileri). İçerik:
   - Üst satır: `SIDE A · 03/07`, durum etiketi (Yayında / Geliştiriliyor / Tasarım / Planlama)
   - Başlık, tür
   - Ekran görüntüsü galerisi (yatay kaydırma, `scroll-snap`, ok tuşları; görsel yoksa bölüm gizli)
   - Açıklama
   - Teknoloji etiketleri
   - Linkler + "⏏ Çıkar" düğmesi
   - İçerik ekranı aşarsa ekran içinde dikey kaydırma.
   - Dialog semantiği: `role="dialog"`, `aria-modal="true"`, odak tuzağı, açılınca odak başlığa.
7. **Çıkarma** (⏏ düğmesi, `Esc`, ekran dışına tıklama): Ekran kapanır → kamera geri çekilir
   (600 ms) → kapak açılır → kaset yuvadan fırlar ve sekerek kendi yuvasına döner → BMO `idle`,
   "Kaset çıktı. Sıradaki hangisi?" → odak ilgili kasete döner.
8. **Kaset değiştirme:** Kaset takılıyken başka bir kaset takılırsa önce 7. adım (kamera zoom olmadan
   kısa sürümü), sonra yeni kaset için 3. adımdan itibaren.

- **Tıkla-tak:** Sürüklemeden tıklama ya da klavyede Enter/Space: kaset otomatik olarak BMO'ya uçar
  (yay eğrisi) ve 3. adımdan devam eder.
- **Yanlış yere bırakma:** Kaset yere düşüp seker ve kendi yuvasına döner; BMO kısa `sad` + "aww".
- **Kilit:** Koreografi sürerken yeni etkileşim kuyruğa alınmaz, yok sayılır (mevcut `busy` mantığı).

## 8. Duyarlı tasarım ve erişilebilirlik

### 8.1 Dar düzen (telefon / dikey)

- Sahne BMO'yu ortalayacak şekilde kırpılır (BMO dikeyde üst %55 içinde).
- Kasetler altta yatay kaydırılabilen **kaset kutusu** rafında (mevcut `.tray` fikrinin yeniden tasarımı,
  güvenli alan boşluklarıyla).
- Dokunma = tıkla-tak; koreografi kısaltılmış (kaset raftan BMO'ya uçar, kapak + makara, zoom).
- Zoom sonunda BMO ekranı tam ekran olur (kenarlarda BMO çerçevesinin ince bir kısmı görünür kalır).

### 8.2 Erişilebilirlik

- Kasetler `<button>`; Tab sırası: üst çubuk düğmeleri → kasetler → Finn/Jake nesneleri.
- Tüm durum değişiklikleri konuşma balonunun `aria-live` bölgesiyle duyurulur.
- `prefers-reduced-motion: reduce`: Parallax, zoom, sallanma, toz/ateş böceği kapalı; geçişler
  yalnızca 150 ms opaklık. Proje ekranı zoom yerine doğrudan ortada açılan panel olur.
- Renk kontrastı: Ekran metni ve hızlı görünüm WCAG AA.

### 8.3 Üst çubuk

Sol üst: İsim tabelası (mevcut tahta tabela, SVG olarak yeniden çizilmiş).
Sağ üst, soldan sağa: `📋 Liste` · `TR | EN` · güneş/ay · ses (♪). Hepsi 44 px dokunma hedefi.

## 9. Hızlı görünüm (`listview.js`)

- `📋 Liste` ile tam ekran, kaydırılabilir, sade bir sayfa açılır (oyun sahnesinin üstünde, açık zemin,
  sitenin renk ve fontlarıyla).
- İçerik: Kısa tanıtım (Hakkımda metni) → CV indir (dile göre `cv-tr.pdf` / `cv-en.pdf`) → iletişim
  (e-posta `mailto:`, GitHub, LinkedIn) → proje kartları (başlık, tür, durum, kısa açıklama, etiketler,
  linkler, varsa ilk ekran görüntüsü).
- URL `#liste` olur; doğrudan bu adresle açılabilir (CV'ye eklenebilir link).
- Kapatma: `✕`, `Esc`, tarayıcı geri tuşu.
- "Hakkımda" bir kaset olarak sahnede de kalır.

## 10. İçerik ve veri

### 10.1 `src/data/projects.json`

```json
[
  {
    "id": "okey",
    "status": "dev",
    "color": { "shell": "#4a3a36", "label": "#e2b04a" },
    "title": { "tr": "81 Okey", "en": "81 Okey" },
    "kind":  { "tr": "Mobil Oyun", "en": "Mobile Game" },
    "desc":  { "tr": "…", "en": "…" },
    "line":  { "tr": "…", "en": "…" },
    "stack": ["Unity", "C#"],
    "shots": ["shots/okey-1.webp"],
    "links": [{ "label": "alazgame.com", "url": "https://alazgame.com" }]
  }
]
```

- `status` ∈ `live | dev | design | planning`; görünen metin i18n'den gelir.
- `shots` ve `links` boş olabilir; boşsa ilgili bölüm gizlenir. `url` boş/`#` ise link gösterilmez.
- Geliştirme modunda şema doğrulaması: eksik zorunlu alan konsola hata olarak yazılır.
- Başlangıç içeriği: mevcut 7 proje (Hakkımda, 81 Okey, TBH Trade, Sanal Davetiyecim, Radar Mayın,
  ESP32 İstasyon, JARVIS) Türkçe metinleriyle taşınır, İngilizce çevirileri eklenir.

### 10.2 `src/data/i18n.js`

- Arayüz metinleri, durum adları, BMO replikleri (karşılama, boşta, tıklama, Finn/Jake nesneleri,
  yanlış bırakma, çıkarma) TR/EN.
- Dil seçimi: `localStorage` (`lang`) → yoksa `navigator.language` `tr` ile başlıyorsa TR, değilse EN.
  `localStorage` erişimi `try/catch` içinde. `<html lang>` güncellenir.

### 10.3 Senden gelecek içerik (yokken geçici içerikle çalışır)

GitHub ve LinkedIn profil linkleri, e-posta adresi, TBH Trade demo linki, proje ekran görüntüleri,
`cv-tr.pdf` / `cv-en.pdf`. Eksik link gösterilmez; eksik CV için düğme gizlenir.

## 11. Ses (`sfx.js`)

- Varsayılan kapalı; açık/kapalı tercihi `localStorage`'da (`sound`).
- WebAudio sentez (dosya yok): mevcut `pick`, `drop`, `clunk`, `eject`, `blip` korunur ve inceltilir;
  eklenenler: kapak "klak", viola melodisi, altın şıngırtısı, BMO kıkırdama.
- Kaset takılınca 4–8 ölçülük chiptune döngüsü; projeye göre farklı (projede `tune` tohumu yok,
  `id`'den deterministik olarak türetilir). Çıkarınca durur. Ses seviyesi düşük (≤ 0.04 gain).
- `AudioContext` yalnızca kullanıcı etkileşiminden sonra oluşturulur.

## 12. Mimari

```
kaset_proje/
├─ index.html
├─ package.json            (vite, gsap; geliştirme: vitest, @playwright/test)
├─ vite.config.js
├─ public/
│  ├─ cv-tr.pdf, cv-en.pdf (opsiyonel)
│  ├─ shots/
│  ├─ og-image.png
│  └─ favicon.svg          (BMO yüzü)
├─ src/
│  ├─ main.js
│  ├─ state.js             (küçük olay yayıcı + uygulama durumu: current, busy, lang, sound, timeOfDay)
│  ├─ data/projects.json
│  ├─ data/i18n.js
│  ├─ scene/stage.js       (fit/cover ölçekleme, katman kabı, dar düzen algılama)
│  ├─ scene/room.svg.js    (L0–L3 katmanları + Finn/Jake nesneleri + kaset yuvaları)
│  ├─ scene/parallax.js
│  ├─ scene/daycycle.js    (saat → dilim; saf fonksiyon + sınıf uygulama)
│  ├─ scene/particles.js   (toz + ateş böceği canvas'ı)
│  ├─ bmo/bmo.svg.js
│  ├─ bmo/faces.js
│  ├─ bmo/behavior.js
│  ├─ tapes/tape.js        (kaset SVG'si, yuvaya yerleştirme, sürükleme)
│  ├─ tapes/choreo.js      (takma / çıkarma / değiştirme zaman çizelgeleri)
│  ├─ ui/speech.js
│  ├─ ui/screen.js         (kamera zoom + BMO ekranı HTML katmanı)
│  ├─ ui/topbar.js
│  ├─ ui/listview.js
│  ├─ ui/loader.js
│  ├─ audio/sfx.js
│  └─ styles/tokens.css, scene.css, ui.css, screen.css, listview.css
├─ tests/
│  ├─ unit/                (vitest)
│  └─ e2e/                 (playwright)
└─ docs/superpowers/specs/
```

- Modüller birbirine doğrudan değil, `state.js` üzerindeki olaylarla bağlanır
  (`tape:insert`, `tape:eject`, `bmo:say`, `lang:change`, `time:change` …).
  Örnek: `choreo.js` takma bitince `tape:loaded` yayar; `screen.js` bunu dinleyip zoom yapar.
- SVG'ler JS modüllerinde şablon dizesi olarak tutulur ve bir kez DOM'a basılır; animasyonlar
  ID/sınıf seçicileriyle GSAP üzerinden.
- Mevcut `index.html`, `bg.webp`, `teypo.png` yeni sürüm tamamlanınca silinir (git geçmişinde kalır).

## 13. SEO, performans, yayın

- `<head>`: doğru `<title>` ("Erdem — Portfolyo" / "Erdem — Portfolio"; soyadı içerik listesiyle gelirse eklenir), `description`,
  OG + Twitter kartı etiketleri, `og-image.png` (1200×630), `favicon.svg`, JSON-LD `Person`.
- Hızlı görünüm içeriği DOM'da gerçek HTML olarak bulunur (gizli başlar), arama motorları okuyabilir.
- Bağımlılık: yalnızca `gsap` (çalışma zamanı). Fontlar `preconnect` + `preload`.
  Ekran görüntüleri `loading="lazy"` + `decoding="async"`, webp.
- `requestAnimationFrame` döngüleri sekme gizliyken durur.
- Vercel: `vite build` → `dist/`, statik yayın. Alan adı sonradan.

## 14. Hata durumları

- `localStorage` erişilemezse: varsayılanlarla devam (TR/EN tarayıcıdan, ses kapalı).
- Font yüklenemezse: sistem yedek fontları (`--f-*` yedek listeleri).
- WebAudio yoksa: sessiz devam.
- Ekran görüntüsü yüklenemezse: o görsel galeriden kaldırılır.
- Yükleme 2,5 sn'yi aşarsa: yükleme ekranı yine kapanır.
- JS çalışmazsa: `<noscript>` içinde hızlı görünümdeki bilgilerin sade sürümü.

## 15. Test ve doğrulama

**Birim (Vitest):**
- `daycycle`: saat → dilim eşlemesi (sınırlar: 05:59, 06:00, 10:59, 11:00, 16:59, 17:00, 19:59, 20:00).
- `i18n`: dil seçimi önceliği (localStorage > navigator > EN), eksik anahtar için TR'ye düşme.
- Proje şema doğrulaması; yuva atama (≤10 sahnede, fazlası yalnızca listede).
- `state` olay yayıcısı.

**Uçtan uca (Playwright):**
- Genişlikler: 375×812, 768×1024, 1440×900, 2560×1440; her birinde ekran görüntüsü.
- Akış: kasete tıkla → ekran açılır, başlık doğru → Esc → kaset yuvasına döndü.
- Sürükle-bırak akışı (masaüstü).
- Klavye: Tab ile kasete gel → Enter → odak dialog'da → Esc → odak kasete döndü.
- Hızlı görünüm: `#liste` ile doğrudan açılış, 7 proje kartı.
- TR/EN geçişi metinleri değiştirir.
- `prefers-reduced-motion` emülasyonunda zoom yerine panel açılır.

**Ölçüm:** Lighthouse (mobil + masaüstü) ile başarı ölçütü 3.

## 16. Riskler

- **Telif:** BMO ve Adventure Time öğeleri Cartoon Network'e ait. Kişisel fan-art kullanımı, altbilgi notu
  ile. Gerekirse karakter ileride özgün bir tasarımla değiştirilebilir; BMO SVG'si ve davranışları
  ayrı modülde olduğu için bu değişim sahneyi etkilemez.
- **SVG çizim kalitesi:** Ağaç ev elle kodlanmış SVG olduğu için mevcut raster görsel kadar detaylı
  olmayacak; stil bilerek sade ve düz renkli. Erken bir ekran görüntüsüyle stil onayı alınacak
  (uygulama planının ilk görsel adımı).
