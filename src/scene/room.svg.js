/* Ağaç ev — 4 parallax katmanı. Renkler sınıflarla (c-*) tokenlardan gelir; .o = kalın mürekkep kontur. */

export const SKY_SVG = `
<svg viewBox="0 0 1920 1080" aria-hidden="true">
  <rect class="c-sky" x="-40" y="-40" width="1000" height="1160"/>
  <rect class="c-sky2" x="-40" y="330" width="1000" height="790"/>
  <g class="stars">
    <circle class="c-paper" cx="236" cy="246" r="3"/><circle class="c-paper" cx="300" cy="226" r="2.5"/>
    <circle class="c-paper" cx="372" cy="262" r="3"/><circle class="c-paper" cx="410" cy="318" r="2"/>
    <circle class="c-paper" cx="250" cy="330" r="2"/><circle class="c-paper" cx="342" cy="318" r="2.5"/>
    <circle class="c-paper" cx="420" cy="232" r="2"/><circle class="c-paper" cx="226" cy="290" r="2"/>
  </g>
  <circle class="c-sun o" cx="280" cy="272" r="40"/>
  <circle class="moon-bite" cx="300" cy="258" r="34"/>
  <g class="cloud"><path class="c-paper o" d="M180 312c0-16 14-26 30-22 6-16 32-18 40-2 16-2 26 8 24 24Z"/></g>
  <g class="cloud" style="animation-duration:85s"><path class="c-paper o" d="M330 236c0-12 10-20 22-17 5-12 24-13 30-1 12-1 20 6 18 18Z"/></g>
  <path class="c-hill2 o" d="M140 420c60-50 140-50 200-10 40-30 100-34 160 6V1120H140Z"/>
  <path class="c-hill o" d="M140 452c80-34 160-26 230 4 50-20 90-20 140 2V1120H140Z"/>
</svg>`;

export const WALL_SVG = `
<svg viewBox="0 0 1920 1080" aria-hidden="true">
  <path class="c-wall" fill-rule="evenodd" d="M-40-40H1960V1120H-40Z M210 330a120 120 0 1 0 240 0a120 120 0 1 0-240 0Z"/>
  <path class="c-wall-dk" d="M-40-40H1960V60C1500 150 420 150-40 60Z"/>
  <path class="c-wall-dk" d="M-40-40H130C95 300 105 700 160 1120H-40Z"/>
  <path class="c-wall-dk" d="M1960-40H1790C1825 300 1815 700 1760 1120H1960Z"/>
  <path class="bark" d="M610 130C585 330 590 540 630 770"/>
  <path class="bark" d="M1310 130C1335 330 1330 540 1290 770"/>
  <path class="bark" d="M200 520C180 640 190 720 230 800"/>
  <path class="bark" d="M1720 170C1740 300 1735 420 1710 520"/>
  <ellipse class="ring" cx="860" cy="300" rx="74" ry="40"/>
  <ellipse class="ring" cx="860" cy="300" rx="44" ry="22"/>
  <ellipse class="c-wall-dk o" cx="1470" cy="250" rx="34" ry="22"/>
  <ellipse class="c-wall" cx="1470" cy="250" rx="15" ry="8"/>
  <!-- yuvarlak pencere -->
  <circle class="win-frame-out" cx="330" cy="330" r="126"/>
  <circle class="win-frame" cx="330" cy="330" r="126"/>
  <path class="win-bar-out" d="M330 210V450M210 330H450"/>
  <path class="win-bar" d="M330 210V450M210 330H450"/>
  <rect class="c-wood o" x="180" y="458" width="300" height="26" rx="8"/>
  <path class="c-pot o" d="M392 458l8-52h56l8 52Z"/>
  <path class="c-leaf o" d="M428 408c-40-20-46-60-30-76 20 10 34 40 30 76Z"/>
  <path class="c-leaf-dk o" d="M428 408c30-30 60-34 76-20-14 22-44 30-76 20Z"/>
  <!-- sol üst raf -->
  <rect class="c-b1 o" x="540" y="172" width="34" height="80" rx="4"/>
  <rect class="c-b2 o" x="574" y="160" width="30" height="92" rx="4"/>
  <rect class="c-b3 o" x="604" y="184" width="40" height="68" rx="4"/>
  <rect class="c-b4 o" x="652" y="176" width="28" height="76" rx="4" transform="rotate(8 666 214)"/>
  <rect class="c-wood o" x="520" y="250" width="300" height="22" rx="6"/>
  <path class="c-wood-dk o" d="M548 272v34l30-34Z M792 272v34l-30-34Z"/>
  <!-- asılı saksı -->
  <path class="rope" d="M1180 40L1150 160M1180 40L1210 160"/>
  <path class="c-pot o" d="M1136 160h88l-10 50h-68Z"/>
  <path class="c-leaf o" d="M1150 200c-30 20-40 60-30 90 22-14 34-50 30-90Z"/>
  <path class="c-leaf-dk o" d="M1210 200c30 20 40 60 30 90-22-14-34-50-30-90Z"/>
  <path class="c-leaf o" d="M1180 206c-6 30 0 64 14 84 10-26 4-60-14-84Z"/>
  <!-- merdiven -->
  <path class="rung-out" d="M1584 180h70M1586 260h70M1589 340h69M1591 420h69M1594 500h68M1596 580h68M1598 660h68"/>
  <path class="rung" d="M1584 180h70M1586 260h70M1589 340h69M1591 420h69M1594 500h68M1596 580h68M1598 660h68"/>
  <path class="c-wood o" d="M1560 110h22l20 660h-22Z"/>
  <path class="c-wood o" d="M1650 110h22l-6 660h-22Z"/>
</svg>`;

export const ROOM_SVG = `
<svg class="room-svg" viewBox="0 0 1920 1080">
  <defs>
    <radialGradient id="glowG"><stop offset="0" stop-color="#ffd27a" stop-opacity=".8"/><stop offset="1" stop-color="#ffd27a" stop-opacity="0"/></radialGradient>
  </defs>
  <!-- zemin + halı -->
  <path class="c-floor o" d="M-40 770C600 736 1320 736 1960 770V1120H-40Z"/>
  <path class="plank-line" d="M-40 830C620 800 1300 800 1960 830M-40 910C620 878 1300 878 1960 910M-40 1000C620 966 1300 966 1960 1000"/>
  <path class="plank-line" d="M300 760v62M900 750v60M1500 758v62M600 812v76M1200 810v76M420 890v94M1050 882v92M1650 892v100"/>
  <ellipse class="c-rug o" cx="960" cy="985" rx="430" ry="78"/>
  <ellipse class="rug-in" cx="960" cy="985" rx="370" ry="58"/>

  <!-- kanepe -->
  <path class="c-couch o" d="M300 650c0-40 30-64 80-64h280c50 0 80 24 80 64v110H300Z"/>
  <rect class="c-cush1 o" x="350" y="620" width="120" height="96" rx="20" transform="rotate(-7 410 668)"/>
  <rect class="c-cush2 o" x="570" y="622" width="120" height="96" rx="20" transform="rotate(6 630 670)"/>
  <rect class="c-couch o" x="290" y="740" width="460" height="74" rx="28"/>
  <rect class="c-couch-dk o" x="258" y="672" width="74" height="160" rx="32"/>
  <rect class="c-couch-dk o" x="708" y="672" width="74" height="160" rx="32"/>
  <rect class="c-wood-dk o" x="300" y="828" width="22" height="34" rx="5"/>
  <rect class="c-wood-dk o" x="718" y="828" width="22" height="34" rx="5"/>

  <!-- Finn'in sırt çantası (dekor) -->
  <rect class="c-wood-dk o" x="678" y="392" width="44" height="16" rx="6"/>
  <rect class="c-pack o" x="650" y="414" width="100" height="124" rx="24"/>
  <path class="c-pack-dk o" d="M650 462c28 14 72 14 100 0v-22c0-14-12-26-26-26h-48c-14 0-26 12-26 26Z"/>
  <rect class="c-gold o" x="690" y="466" width="20" height="14" rx="3"/>

  <!-- Finn'in şapkası (askıda) -->
  <g class="obj" data-obj="hat" role="button" tabindex="0">
    <rect class="c-wood-dk o" x="558" y="384" width="44" height="16" rx="6"/>
    <circle class="c-hat o" cx="536" cy="418" r="15"/><circle class="c-hat o" cx="624" cy="418" r="15"/>
    <path class="c-hat o" d="M520 490c0-56 26-84 60-84s60 28 60 84v26c0 8-6 12-14 12h-92c-8 0-14-4-14-12Z"/>
    <path class="c-wall-dk o" d="M548 482c0-22 14-34 32-34s32 12 32 34v18h-64Z"/>
    <path class="c-hat o" d="M526 516v34c0 8 14 8 14 0v-34Z M620 516v34c0 8 14 8 14 0v-34Z"/>
  </g>

  <!-- altın kılıç -->
  <g class="obj" data-obj="sword" role="button" tabindex="0" transform="rotate(-28 1090 340)">
    <path class="c-gold o" d="M1082 196h16l8 210h-32Z"/>
    <path class="blade-line" d="M1090 214V392"/>
    <rect class="c-wood-dk o" x="1046" y="404" width="88" height="18" rx="8"/>
    <rect class="c-viola-dk o" x="1080" y="422" width="20" height="46" rx="6"/>
    <circle class="c-gem o" cx="1090" cy="476" r="12"/>
  </g>

  <!-- raf + Enchiridion -->
  <rect class="c-wood o" x="1190" y="470" width="340" height="24" rx="6"/>
  <path class="c-wood-dk o" d="M1220 494v42l34-42Z M1500 494v42l-34-42Z"/>
  <g class="obj" data-obj="book" role="button" tabindex="0">
    <rect class="c-paper o" x="1374" y="386" width="14" height="80" rx="3"/>
    <rect class="c-book o" x="1318" y="380" width="62" height="90" rx="6"/>
    <path class="gold-line" d="M1330 394h38M1330 456h38"/>
    <circle class="c-gem o" cx="1349" cy="425" r="13"/>
  </g>

  <!-- Jake'in violası -->
  <g class="obj" data-obj="viola" role="button" tabindex="0" transform="rotate(14 1500 760)">
    <rect class="c-ink" x="1494" y="560" width="12" height="150" rx="4"/>
    <path class="c-viola-dk o" d="M1488 548c0-18 24-18 24 0v20h-24Z"/>
    <path class="c-viola o" d="M1500 640c-34 0-50 22-44 50 4 20-14 30-14 54s18 34 14 56c-6 32 14 62 44 62s50-30 44-62c-4-22 14-32 14-56s-18-34-14-54c6-28-10-50-44-50Z"/>
    <path class="fhole" d="M1484 708c-4 16 0 30 0 42M1516 708c4 16 0 30 0 42"/>
    <rect class="c-wood-dk" x="1484" y="780" width="32" height="6" rx="2"/>
    <path class="strings" d="M1496 572V840M1500 572V840M1504 572V840"/>
  </g>

  <!-- hazine yığını -->
  <g class="obj" data-obj="gold" role="button" tabindex="0">
    <path class="c-gold o" d="M1430 950c10-50 50-80 90-80s80 30 90 80Z"/>
    <path class="coin-line" d="M1470 920h20M1530 910h22M1500 936h24M1560 930h16"/>
    <circle class="c-gem o" cx="1510" cy="898" r="12"/>
    <ellipse class="c-gold o" cx="1446" cy="948" rx="22" ry="9"/>
    <ellipse class="c-gold o" cx="1600" cy="950" rx="22" ry="9"/>
  </g>

  <!-- fenerler -->
  <path class="rope" d="M800 40V150"/>
  <rect class="c-wood-dk o" x="776" y="150" width="48" height="14" rx="4"/>
  <rect class="lamp-glass o" x="780" y="164" width="40" height="54" rx="8"/>
  <rect class="c-wood-dk o" x="776" y="218" width="48" height="12" rx="4"/>
  <circle class="glow" cx="800" cy="192" r="140" fill="url(#glowG)"/>
  <rect class="c-wood-dk o" x="1706" y="770" width="52" height="14" rx="4"/>
  <rect class="lamp-glass o" x="1710" y="784" width="44" height="60" rx="8"/>
  <rect class="c-wood-dk o" x="1702" y="844" width="60" height="14" rx="4"/>
  <circle class="glow" cx="1732" cy="814" r="170" fill="url(#glowG)" style="animation-delay:-1.1s"/>
</svg>`;

export const FRONT_SVG = `
<svg viewBox="0 0 1920 1080" aria-hidden="true">
  <g id="vineL">
    <!-- 16:10 ekranlarda kenar kırpmasından kurtulsun diye içeride (kullanıcı geri bildirimi) -->
    <g transform="translate(140 0)">
      <path class="vine-stem" d="M60-20C80 120 40 230 84 380C100 440 90 500 70 560"/>
      <ellipse class="c-leaf o" cx="92" cy="70" rx="34" ry="15" transform="rotate(28 92 70)"/>
      <ellipse class="c-leaf-dk o" cx="40" cy="150" rx="32" ry="14" transform="rotate(-30 40 150)"/>
      <ellipse class="c-leaf o" cx="96" cy="250" rx="36" ry="15" transform="rotate(24 96 250)"/>
      <ellipse class="c-leaf-dk o" cx="52" cy="340" rx="30" ry="13" transform="rotate(-26 52 340)"/>
      <ellipse class="c-leaf o" cx="104" cy="440" rx="30" ry="13" transform="rotate(30 104 440)"/>
      <ellipse class="c-leaf-dk o" cx="56" cy="530" rx="26" ry="12" transform="rotate(-20 56 530)"/>
    </g>
    <g transform="translate(90 0)">
      <path class="c-leaf-dk o" d="M-40 1120C40 980 130 930 220 950C150 1000 110 1060 100 1120Z"/>
      <path class="c-leaf o" d="M-40 1060C20 980 80 960 150 980C90 1010 50 1050 40 1100Z"/>
    </g>
  </g>
  <use href="#vineL" transform="translate(1920 0) scale(-1 1)"/>
</svg>`;

/* kasetlerin alt-orta noktası (sahne px) — projeler bu sırayla yerleşir */
export const SLOTS = [
  { x: 1255, y: 470, s: 0.9, r: -3 },   // raf
  { x: 1460, y: 470, s: 0.9, r: 4 },    // raf
  { x: 410, y: 752, s: 0.95, r: -5 },   // kanepe
  { x: 640, y: 752, s: 0.95, r: 4 },    // kanepe
  { x: 520, y: 1000, s: 1.1, r: -4 },   // halı sol
  { x: 720, y: 1045, s: 1.15, r: 3 },   // halı ön
  { x: 1230, y: 1040, s: 1.15, r: -3 }, // halı sağ
  { x: 1350, y: 965, s: 1.05, r: 5 },   // zemin sağ
  { x: 330, y: 965, s: 1.05, r: -6 },   // zemin sol
  { x: 1200, y: 890, s: 1.0, r: 2 },    // BMO'nun yanı
];

export const OBJECTS = ["hat", "viola", "sword", "book", "gold"];
