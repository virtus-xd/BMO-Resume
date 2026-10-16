/* Modüller arası olay yayıcı + paylaşılan uygulama durumu */
export function createBus() {
  const map = new Map();
  return {
    on(type, fn) {
      if (!map.has(type)) map.set(type, new Set());
      map.get(type).add(fn);
      return () => map.get(type).delete(fn);
    },
    emit(type, detail) {
      (map.get(type) || []).forEach((fn) => fn(detail));
    },
  };
}

export const bus = createBus();

export const state = {
  current: null,   // takılı proje
  busy: false,     // koreografi sürüyor mu
  lang: "tr",
  sound: false,
  slice: "noon",
  narrow: false,
  zoomed: false,
};

/* gizli modda / engelli depolamada sessizce varsayılana düşer */
export const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* yok say */ } },
};
