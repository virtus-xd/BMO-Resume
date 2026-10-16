export const STRINGS = {
  tr: {
    tagline: "Bilgisayar Müh. · Web & Oyun",
    hint: "[sürükle] kaseti BMO'ya tak · [tıkla] hızlı oynat",
    list: "Liste",
    time_aria: "Gün saatini değiştir",
    sound_aria: "Sesi aç/kapat",
    tray_aria: "Kasetler",
    tape_aria: "{t} kasetini oynat",
    loading: "Yükleniyor",
    welcome: "Merhaba! Ben BMO! Erdem'in projeleri bu kasetlerde. Birini kapıp bana tak!",
    empty: "Karnım boş! Bir kaseti sürükleyip bana tak.",
    ejected: "Kaset çıktı. Sıradaki hangisi?",
    miss: "Aww... ıskaladın. Tam buraya, yuvama!",
    idle: ["♪ hmm hmm hmm ♪", "Finn ile Jake yine maceraya gitti...", "Kim oyun oynamak ister?", "Bip bop! Kasetler beni bekliyor."],
    click: ["Hihihi! Gıdıklanıyorum!", "Ben BMO! Seninle oynayabilir miyim?", "Bir kaset tak, sana bir şey göstereyim!"],
    obj_hat: "Finn'in şapkası! Onsuz maceraya çıkmaz.",
    obj_viola: "Jake'in violası! ♪ Ding ding ding ♪",
    obj_sword: "Altın kılıç. Dokunma, Finn kızar!",
    obj_book: "Enchiridion! Kahramanlar için bir el kitabı.",
    obj_gold: "Hazine! Jake bunları sayarken uyuyakalmıştı.",
    status_live: "Yayında", status_dev: "Geliştiriliyor", status_design: "Tasarım", status_planning: "Planlama",
    side: "SIDE A",
    eject: "⏏ Çıkar",
    close: "Kapat",
    shots: "Ekran görüntüleri",
    list_title: "Erdem — Projeler",
    list_back: "✕ Odaya dön",
    cv: "CV indir (PDF)",
    contact: "İletişim",
    projects: "Projeler",
    footer_note: "BMO fan-art'ıdır. Adventure Time © Cartoon Network.",
    doc_title: "Erdem — Portfolyo",
    no3d: "Tarayıcın 3D sahneyi desteklemiyor; projeler burada.",
  },
  en: {
    tagline: "Computer Eng. · Web & Games",
    hint: "[drag] a tape into BMO · [click] quick play",
    list: "List",
    time_aria: "Change time of day",
    sound_aria: "Toggle sound",
    tray_aria: "Tapes",
    tape_aria: "Play the {t} tape",
    loading: "Loading",
    welcome: "Hi! I'm BMO! Erdem's projects are on these tapes. Grab one and put it in me!",
    empty: "My tummy is empty! Drag a tape into me.",
    ejected: "Tape out. Which one's next?",
    miss: "Aww... you missed. Right here, in my slot!",
    idle: ["♪ hmm hmm hmm ♪", "Finn and Jake went on another adventure...", "Who wants to play video games?", "Beep boop! The tapes are waiting."],
    click: ["Hehehe! That tickles!", "I am BMO! Can I play with you?", "Put in a tape, I'll show you something!"],
    obj_hat: "Finn's hat! He never goes adventuring without it.",
    obj_viola: "Jake's viola! ♪ Ding ding ding ♪",
    obj_sword: "The golden sword. Don't touch, Finn will be mad!",
    obj_book: "The Enchiridion! A handbook for heroes.",
    obj_gold: "Treasure! Jake fell asleep counting it.",
    status_live: "Live", status_dev: "In development", status_design: "Design", status_planning: "Planning",
    side: "SIDE A",
    eject: "⏏ Eject",
    close: "Close",
    shots: "Screenshots",
    list_title: "Erdem — Projects",
    list_back: "✕ Back to the room",
    cv: "Download CV (PDF)",
    contact: "Contact",
    projects: "Projects",
    footer_note: "BMO is fan art. Adventure Time © Cartoon Network.",
    doc_title: "Erdem — Portfolio",
    no3d: "Your browser doesn't support the 3D scene; here are the projects.",
  },
};

export function pickLang(saved, navLang) {
  if (saved === "tr" || saved === "en") return saved;
  return String(navLang || "").toLowerCase().startsWith("tr") ? "tr" : "en";
}

export function t(lang, key) {
  return STRINGS[lang]?.[key] ?? STRINGS.tr[key] ?? key;
}

export function line(lang, key, rand = Math.random) {
  const v = t(lang, key);
  return Array.isArray(v) ? v[Math.floor(rand() * v.length)] : v;
}

export function loc(lang, obj) {
  return obj?.[lang] ?? obj?.tr ?? "";
}

export function fmt(str, vars) {
  return str.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");
}

export function applyI18n(root, lang) {
  root.querySelectorAll("[data-i18n]").forEach((el) => { el.textContent = t(lang, el.dataset.i18n); });
  root.querySelectorAll("[data-i18n-aria]").forEach((el) => { el.setAttribute("aria-label", t(lang, el.dataset.i18nAria)); });
}
