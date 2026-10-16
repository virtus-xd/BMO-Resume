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

  relabel(lang);
  return { buttons, layout, relabel, setGone };
}
