import { t, loc, fmt } from "../data/i18n.js";

/* 3D kasetlerin üstünde duran şeffaf, erişilebilir düğmeler (v1 seçicisi: button.tape[data-id]).
   Geniş düzende yansıtılmış kaset kutusuna oturur (stage pikseli); dar düzende alttaki rafa geçer ve
   içinde kasetin bir kez render edilmiş küçük resmi görünür. */
export function createTapeButtons({ host, trayHost, projects, lang, rectOf, narrow, thumbOf }) {
  const isNarrow = typeof narrow === "function" ? narrow : () => narrow;
  const px = (v) => Math.round(v * 10) / 10 + "px";
  const buttons = {};

  projects.forEach((p) => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "tape"; b.dataset.id = p.id;
    const img = document.createElement("img");
    img.className = "thumb"; img.alt = ""; img.draggable = false;
    const name = document.createElement("span");
    name.className = "tape-name";
    b.append(img, name);
    buttons[p.id] = b;
  });

  function relabel(l) {
    projects.forEach((p) => {
      const b = buttons[p.id], title = loc(l, p.title);
      b.querySelector(".tape-name").textContent = title;
      b.setAttribute("aria-label", fmt(t(l, "tape_aria"), { t: title }));
      b.querySelector(".thumb").removeAttribute("src"); // küçük resim etiketi içerir: yeniden üretilsin
    });
    layout();
  }

  function layout() {
    const n = isNarrow();
    projects.forEach((p) => {
      const b = buttons[p.id];
      if (n) {
        if (b.parentElement !== trayHost) trayHost.appendChild(b);
        b.style.left = b.style.top = b.style.width = b.style.height = "";
        const img = b.querySelector(".thumb");
        if (!img.getAttribute("src")) { const src = thumbOf?.(p.id); if (src) img.setAttribute("src", src); }
      } else {
        if (b.parentElement !== host) host.appendChild(b);
        const r = rectOf(p.id);
        Object.assign(b.style, { left: px(r.left), top: px(r.top), width: px(r.width), height: px(r.height) });
      }
    });
  }

  function setGone(id, on) { buttons[id]?.classList.toggle("gone", on); }
  function focus(id) { buttons[id]?.focus({ preventScroll: true }); }

  relabel(lang);
  return { buttons, layout, relabel, setGone, focus };
}

/* Sürükleme: kıpırdamadan bırakmak dokunma (hızlı oynat); 7 px'ten fazla sürüklemek kaseti kaldırır.
   onDrag yakınlığı döndürür (BMO'nun yuvasına yakın mı); pointercancel / lostpointercapture ıskalamadır. */
export function bindDrag(el, id, { isBusy, onTap, onPick, onDrag, onDrop, onCancel, onReach }) {
  let active = false, dragging = false, near = false, sx = 0, sy = 0, lastX = 0, lastT = 0, pid = 0;

  const setNear = (v) => { if (v !== near) { near = v; onReach(v); } };
  function finish() {
    active = false;
    try { el.releasePointerCapture?.(pid); } catch { /* yok say */ }
  }

  el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || isBusy()) return;
    active = true; dragging = false; near = false;
    sx = lastX = e.clientX; sy = e.clientY; lastT = e.timeStamp; pid = e.pointerId;
    try { el.setPointerCapture?.(pid); } catch { /* yok say */ }
  });

  el.addEventListener("pointermove", (e) => {
    if (!active) return;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    if (!dragging) {
      /* raftaki yatay kaydırmayı engelleme */
      if (el.closest(".tray") && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 8) { finish(); return; }
      if (Math.hypot(dx, dy) < 7) return;
      dragging = true;
      onPick(id, e.clientX, e.clientY);
    }
    const dt = Math.max(1, e.timeStamp - lastT);
    const vx = (e.clientX - lastX) / dt;
    lastX = e.clientX; lastT = e.timeStamp;
    setNear(!!onDrag(id, e.clientX, e.clientY, vx));
  });

  el.addEventListener("pointerup", (e) => {
    if (!active) return;
    const wasDragging = dragging;
    dragging = false;
    finish();
    if (!wasDragging) { onTap(id); return; }
    setNear(false);
    onDrop(id, e.clientX, e.clientY);
  });

  const cancel = () => {
    if (!active) return;
    const wasDragging = dragging;
    dragging = false;
    finish();
    if (wasDragging) { setNear(false); onCancel(id); }
  };
  el.addEventListener("pointercancel", cancel);
  el.addEventListener("lostpointercapture", cancel);

  /* klavye (Enter/Space) tıklaması: detail === 0 */
  el.addEventListener("click", (e) => { if (e.detail === 0 && !isBusy()) onTap(id); });
}
