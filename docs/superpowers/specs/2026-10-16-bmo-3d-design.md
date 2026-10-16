# BMO Ağaç Ev — 3D Sürüm Tasarımı

Tarih: 2026-10-16
Durum: İnceleme bekliyor
Önceki sürüm: `docs/superpowers/specs/2026-10-16-bmo-agac-ev-portfolyo-design.md` (v1, `master`'da). Bu doküman yalnızca **değişenleri**
tanımlar; burada söz edilmeyen her şey (veri, TR/EN, Liste görünümü, üst çubuk, sesler, SEO, erişilebilirlik hedefleri) v1 spec'teki
gibi kalır.

## 1. Neden

v1 işlevsel olarak tamam ama görsel olarak "düz çizgi" duruyor. Kullanıcının referans aldığı örnekte (aynı etkileşim: kaseti BMO'ya
sürükle → zoom) fark görsel kalitede: **ressam elinden çıkmış gibi detaylı bir arka plan illüstrasyonu + 3D BMO**. Hedef bu kaliteye
ulaşmak.

## 2. Kararlar

| Konu | Karar |
|---|---|
| Arka plan | **bg2** (kullanıcı seçti): mürekkep çizgili ağaç ev illüstrasyonu, 2752×1536 (16:9'a yakın, 1.79). Gündüz görseli olarak kullanılır; gece versiyonu (`bg2` gece düzenlemesi) gelirse çapraz geçiş, gelmezse renk filtresi. bg1 ve spike denemeleri (`spike/deneme-bg*.png`) referans olarak kalır. |
| BMO | three.js ile **kodla, yüksek detayla** üretilmiş 3D model (Meshy yerine — gerekçe: animasyonlu parçalar, küçük dosya, stil uyumu). Ayrıntılar §4. |
| Kasetler | three.js 3D kasetler; zeminde perspektifle durur. Etiket 2 satıra kadar sığar (kesilme yok); projede ekran görüntüsü varsa etiketin yerine kapak görseli. |
| Konuşma | Örnekteki gibi altta **terminal tarzı diyalog kutusu** (`> BMO: …`, VT323, koyu zemin, yeşil metin); v1'in balonunun yerini alır. |
| Kamera zoom | Gerçek 3D kamera hareketi (GSAP ile `camera.position` + bakış noktası) BMO ekranına; arka plan görseli aynı anda büyür ve bulanıklaşır. |
| Proje görünümü | v1'deki HTML katmanı (`renderScreen`, odak tuzağı) korunur; BMO ekranının yansıtılmış (projected) dikdörtgenine hizalanır. **Dar düzende tam genişlik** (v1 inceleme Important 4). |
| Kapat vs çıkar | **Esc / dışarı tıklama = ekranı kapat, kaset BMO'da kalır** (kamera geri çekilir, makaralar döner). **⏏ Çıkar = kaseti çıkar.** BMO'ya tıklama ekranı yeniden açar; başka kaset takmak öncekini otomatik çıkarır. (v1'de bu iki dal erişilemiyordu.) |
| WebGL yoksa | Sahne kurulmaz, Liste görünümü (`#liste`) otomatik açılır; kısa bir not gösterilir. |
| Bağımlılık | `three@0.186.1` eklenir (çalışma zamanı: `gsap` + `three`). three.js dinamik `import()` ile yüklenir; yükleme ekranı bu sürede görünür. |

## 3. Sahne düzeni

- **Tasarım çerçevesi:** v1'deki gibi 1920×1080 `stage`, `cover` ölçekleme (`coverScale`, `stageOffsetY`) aynen kullanılır.
  Stage içinde alttan üste: (1) arka plan `<img>` (2) three.js `<canvas>` (1920×1080 CSS, piksel oranı ≤ 2 ve toplam ≤ ~4 MP)
  (3) parçacık canvas'ı (4) erişilebilir kaset düğmeleri katmanı. Böylece 3D sahne, hangi ekran oranı olursa olsun boyanmış zeminle
  birlikte ölçeklenir ve hizası bozulmaz.
- **Kalibrasyon:** Kamera (FOV, konum, bakış noktası), BMO konumu/dönüşü/ölçeği ve kaset yuvaları `src/three/layout.js`'de tek
  yerde. Görsel geldiğinde bu değerler görsele göre ayarlanır. `?calib` parametresi zemin ızgarası ve yuva işaretleri çizer (yalnızca
  geliştirme için).
- **Güvenli bant:** Etkileşimli her şey (BMO, 7 kaset) yansıtıldığında stage içinde x 240–1680, y 95–985 bandında kalır (v1 inceleme
  dersi: 16:9'dan geniş ekranlarda dikey kırpma).
- **Parallax:** Fareyle hafif: arka plan ±10 px kayar, 3D kamera küçük bir yay çizer. Dokunmatikte ve "hareketi azalt"ta yok.
- **Gün/gece:** `bg-night` varsa çapraz geçiş (600 ms); yoksa gündüz görseline gece renk filtresi (v1 `--tint`). 3D ışıklar dilime
  göre renk/şiddet değiştirir; gece ateş böcekleri, gündüz toz (konumlar görselden bağımsız, sahnenin orta bandında).

## 4. 3D BMO (`src/three/bmo.js`)

- Spike'taki model temel alınır (`spike/bmo3d.js`); modül olarak yeniden yazılır, testli.
- **Detay seviyesi (kullanıcı isteği: "mümkün olduğunca detaylı, birebir"):**
  - Gövde: dizideki oranlar (en:boy:derinlik ≈ 1 : 1.25 : 0.62), pahlı/yuvarlatılmış kenarlar, ön yüz ile yanlar arasında ton farkı,
    kenarlarda ince ışık parlaması (rim light).
  - Ekran: koyu çerçeve + iç gölge, ekran camında yumuşak yansıma şeridi, hafif tarama çizgisi; yüz ifadeleri canvas'ta.
  - Ön yüz: kaset yuvası (koyu, iç derinlikli) + açılır kapak; sarı D-pad (kabartmalı), mavi üçgen, yeşil küçük ve kırmızı büyük
    düğme (kabartmalı, parlak nokta), D-pad altında iki ızgara yarığı.
  - Yan yüzler: sol yanda dikey "BMO" yazısı + 3×3 hoparlör delikleri; sağ yanda kulaklık/şarj portu ve küçük yan düğme.
  - Arka yüz: vida başlıkları ve pil kapağı çizgisi (zoom/dönüşlerde görünürse).
  - Uzuvlar: ince, eklemli kollar (omuz–dirsek–el; el yuvarlak, başparmak ayrımı) ve bacaklar (ayak tabanı düz, öne bakan);
    oturuş pozunda bacaklar önde, eller yere dayalı.
  - Zemin: yumuşak temas gölgesi (ambient occlusion benzeri koyu halka) + uzun yönlü gölge, arka planın ışık yönüne uygun
    (bg2'de ışık sağdaki pencereden).
  - Stil: toon gölgelendirme (3 basamak) + mürekkep kontur; kontur kalınlığı bg2'nin çizgi kalınlığına göre ayarlanır.
- **Yüz:** v1'in ifade adları korunur (`idle, blink, hungry, talkA, talkB, happy, sad, giggle, loading`); her biri ekran canvas'ına
  çizen bir fonksiyon. v1'in `createFace` mantığı (temel/flash/konuşma önceliği) renderer'dan bağımsız hale getirilip yeniden kullanılır.
- **Davranışlar:** nefes, göz kırpma, göz bebeklerinin fareyi izlemesi (canvas'ta ±4 px), boşta dans/mırıldanma, el sallama,
  kaset yaklaşınca kolları uzatma ve yuvanın parlaması, kapak açılıp kapanma, makaraların dönmesi.
- **Ekran dikdörtgeni:** Ekran mesh'inin 4 köşesi her karede/yeniden boyutlandırmada ekrana yansıtılır → HTML katmanının konumu.

## 5. 3D kasetler (`src/three/tapes.js`)

- Her proje bir 3D kaset: gövde (proje `shell` rengi), etiket canvas'ı (proje `label` rengi şeridi + başlık, **2 satıra kadar
  sarma**; `shots[0]` varsa kapak görseli), pencerede iki makara.
- **Erişilebilirlik ve test uyumu:** Her kasetin üstünde, yansıtılmış sınırlarına oturan şeffaf bir `<button class="tape"
  data-id="…">` durur (v1 seçicileri ve e2e testleri çalışmaya devam eder). Odak halkası görünür. Klavye: Tab + Enter = tak.
- **Sürükleme:** Düğmede `pointerdown` → 3D kaset kalkar ve imleci zemine paralel bir düzlemde izler (hızına göre eğilir);
  BMO'ya yaklaşınca kollar uzanır. Bırakınca: yakınsa tak, değilse yerine seker (ıskalama). `pointercancel` ve
  `lostpointercapture` ıskalama sayılır (v1 minor).
- **Dar düzen:** Kasetler v1'deki gibi alttaki ahşap rafta HTML düğmeler olarak; her düğmenin içinde kasetin küçük statik
  görüntüsü (3D kasetten bir kez render edilmiş görsel). Dokununca 3D kaset raftan BMO'ya uçar.

## 6. Koreografi

1. **Tak:** kaset kalkar → BMO'nun önüne uçar → kapak açılır → kaset yuvaya kayıp kaybolur → kapak kapanır → BMO esner →
   makaralar döner, notalar (2D, BMO'nun yansıtılmış konumunda) → kamera ekrana dalar → CRT açılışı.
2. **Kapat (Esc/dışarı):** ekran kapanır → kamera geri çekilir; kaset BMO'da kalır.
3. **Çıkar (⏏):** önce kapat, sonra kaset yuvadan fırlayıp yerine seker.
4. **Iskalama:** kaset yere düşüp seker; BMO `sad` + replik. **`busy` kilidi altında** (v1 minor).
5. **Hareketi azalt:** uçuş/zoom yok; kaset anında BMO'ya geçer, proje ortada panel olarak açılır, CRT animasyonu yok (v1 minor).

## 7. Terminal diyalog kutusu

- Altta ortada, `min(720px, 100% − 32px)` genişlik; koyu yeşil-siyah zemin, ince yeşil çerçeve, `> BMO:` öneki, VT323 metin,
  harf harf yazım (v1 `createSpeech` mantığı), altında ipucu satırı. Kaset kapılınca ipucu gizlenir (v1 minor).
- Dar düzende kaset rafının hemen üstünde.

## 8. v1'den taşınan düzeltmeler

- Yükleme ekranı fontları açıkça bekler: `document.fonts.load` (Gochi Hand, VT323, Nunito 700) + 2,5 sn üst sınır.
- `AudioContext` yalnızca kullanıcı etkileşiminde kurulur/devam eder; kaset takılıyken ses açılınca chiptune başlar.
- Liste görünümü açıkken 3D render döngüsü ve parçacıklar durur; boşta replikler susar.
- `document.title` dile göre değişir.
- Kılıç/viola zıplaması ve SVG'ye özgü diğer minor'lar v1 sahnesiyle birlikte ortadan kalkar.

## 9. Kaldırılanlar

`src/scene/room.svg.js`, `src/scene/parallax.js` (yeni sürümü yazılır), `src/bmo/bmo.svg.js`, `src/bmo/behavior.js` (3D karşılığı yazılır),
`src/tapes/choreo.js` (3D karşılığı yazılır), SVG'ye özgü CSS. Finn/Jake nesneleri artık arka plan görselinin parçası
(görselde varsa); tıklanabilir sıcak noktalar (`?calib` ile konumlanan şeffaf düğmeler) **isteğe bağlı** ve bu sürümün kapsamı dışında.

## 10. Performans ve test

- Lighthouse hedefi: masaüstü ≥ 90, **mobil ≥ 80** (three.js ve büyük görsel nedeniyle v1'den gevşek). Görsel: WebP/AVIF, `srcset`
  ile 1920 ve 3840 sürümleri.
- Birim: yüz ifadesi öncelik mantığı, düzen/yansıtma hesapları (`projectRect`), etiket satır sarma, kapat/çıkar durum makinesi,
  WebGL yok yolu.
- E2E: v1 testlerinin hepsi (seçiciler korunduğu için) + kapat-kaset-kalır, BMO'ya tıkla-yeniden aç, dar düzende tam genişlik ekran,
  WebGL kapalıyken Liste.

## 11. Açık bağımlılık

Gündüz görseli hazır (`bg2.jpg`; uygulamada WebP'ye çevrilip `public/bg/` altına 1920 ve 2752 px sürümleriyle konur). Gece
versiyonu kullanıcıdan gelecek; gelene kadar renk filtresi kullanılır. Kalibrasyon (kamera açısı bg2'nin daha alçak perspektifine
göre, BMO ortadaki boş zeminde, kasetler zemin boşluklarında) yapılıp kullanıcıya ekran görüntüsüyle onaylatılır (stil durağı).
