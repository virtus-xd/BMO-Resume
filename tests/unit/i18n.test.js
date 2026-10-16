import { describe, it, expect } from "vitest";
import { pickLang, t, line, loc, fmt, applyI18n, STRINGS } from "../../src/data/i18n.js";

describe("pickLang", () => {
  it("kayıtlı dil her şeyden önce gelir", () => expect(pickLang("en", "tr-TR")).toBe("en"));
  it("kayıt yoksa tr ile başlayan tarayıcı dili TR verir", () => expect(pickLang(null, "tr-TR")).toBe("tr"));
  it("diğer her durumda EN", () => {
    expect(pickLang(null, "de-DE")).toBe("en");
    expect(pickLang("xx", undefined)).toBe("en");
  });
});

describe("t / line / loc / fmt", () => {
  it("EN'de olmayan anahtar TR'ye düşer", () => {
    STRINGS.tr.__test = "sadece tr";
    expect(t("en", "__test")).toBe("sadece tr");
    delete STRINGS.tr.__test;
  });
  it("hiç olmayan anahtar anahtarın kendisini döner", () => expect(t("tr", "yok_boyle")).toBe("yok_boyle"));
  it("line dizi anahtarından rand ile seçer", () => {
    const arr = t("tr", "idle");
    expect(line("tr", "idle", () => 0)).toBe(arr[0]);
  });
  it("loc dil yoksa tr'yi döner", () => expect(loc("en", { tr: "Merhaba" })).toBe("Merhaba"));
  it("fmt {ad} yer tutucularını doldurur", () => expect(fmt("{t} kaseti", { t: "Okey" })).toBe("Okey kaseti"));
});

describe("applyI18n", () => {
  it("data-i18n metnini ve data-i18n-aria etiketini doldurur", () => {
    document.body.innerHTML = `<p data-i18n="list"></p><button data-i18n-aria="sound_aria"></button>`;
    applyI18n(document.body, "en");
    expect(document.querySelector("p").textContent).toBe(STRINGS.en.list);
    expect(document.querySelector("button").getAttribute("aria-label")).toBe(STRINGS.en.sound_aria);
  });
});
