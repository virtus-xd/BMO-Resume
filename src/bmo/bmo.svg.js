/* BMO — yerel viewBox 300×420; ön yüz x 18–270 (merkez 144). Sahnede BMO_POS'a yerleşir. */
export const BMO_POS = { x: 816, y: 560, w: 300, h: 420 };
export const SCREEN_RECT = { x: BMO_POS.x + 44, y: BMO_POS.y + 36, w: 200, h: 146 };

export const BMO_SVG = `
<svg viewBox="0 0 300 420" role="img" aria-label="BMO">
  <ellipse class="bmo-shadow" cx="148" cy="404" rx="118" ry="12"/>
  <g id="bmo-leg-l" class="limb"><path d="M108 330V392h-20"/></g>
  <g id="bmo-leg-r" class="limb"><path d="M180 330V392h20"/></g>
  <g id="bmo-arm-l" class="limb"><path d="M20 190C-8 206-14 262-2 302"/></g>
  <g id="bmo-arm-r" class="limb"><path d="M270 190C298 206 304 262 292 302"/></g>
  <g id="bmo-body">
    <rect class="bmo-side" x="28" y="18" width="252" height="324" rx="20"/>
    <rect class="bmo-front o" x="18" y="10" width="252" height="324" rx="20"/>
    <rect id="bmo-screen-rect" class="bmo-screen o" x="44" y="36" width="200" height="146" rx="14"/>
    <g id="bmo-face"></g>
    <g id="bmo-slot">
      <rect id="bmo-slot-glow" x="58" y="192" width="172" height="46" rx="12"/>
      <rect class="bmo-slot-hole o" x="66" y="200" width="156" height="30" rx="6"/>
      <g id="bmo-reels" opacity="0">
        <rect class="reel-win" x="104" y="206" width="80" height="18" rx="9"/>
        <g class="reel" id="bmo-reel-l"><circle cx="118" cy="215" r="7"/><path d="M118 208v14M111 215h14"/></g>
        <g class="reel" id="bmo-reel-r"><circle cx="170" cy="215" r="7"/><path d="M170 208v14M163 215h14"/></g>
      </g>
      <rect id="bmo-lid" class="bmo-lid o" x="66" y="200" width="156" height="30" rx="6"/>
    </g>
    <path class="bmo-dpad o" d="M74 254h22v-22h22v22h22v22h-22v22h-22v-22h-22Z"/>
    <path class="bmo-tri o" d="M182 286l16-28 16 28Z"/>
    <circle class="bmo-green o" cx="238" cy="252" r="9"/>
    <circle class="bmo-red o" cx="234" cy="296" r="18"/>
    <path class="bmo-slit" d="M88 316h26M88 326h26"/>
  </g>
</svg>`;
