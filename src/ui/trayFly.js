import { gsap } from "gsap";

/* Telefonda kasetin rafa dönüşü: raftaki küçük resmin bir kopyası 3D kasetin ekrandaki yerinden (from, istemci px)
   kavis çizerek raftaki yerine uçar; yeri görünmüyorsa raf o yere kayar. Hedef her karede yeniden okunur (raf
   kayarken de tam yerine iner). İnince kopya kalkar, raftaki resim hafifçe zıplar. */
export function flyToTray(button, from, { duration = 0.55, onLand } = {}) {
  const thumb = button.querySelector(".thumb"), src = thumb?.getAttribute("src");
  revealInTray(button);
  const land = () => {
    onLand?.();
    /* oturduğu yerden hafifçe sekip yerleşir (kopyanın bıraktığı yerden sıçramadan) */
    if (thumb) gsap.to(thumb, { keyframes: [{ y: -8, duration: 0.12, ease: "power2.out" }, { y: 0, duration: 0.36, ease: "bounce.out" }], clearProps: "transform" });
  };
  if (!src) { land(); return Promise.resolve(); } // küçük resim henüz üretilmedi: uçuş yok

  const img = document.createElement("img");
  img.className = "tape-fly"; img.alt = ""; img.draggable = false;
  img.setAttribute("aria-hidden", "true"); img.setAttribute("src", src);
  document.body.appendChild(img);
  const tilt = parseFloat(getComputedStyle(button).getPropertyValue("--tilt")) || 0;
  const k = { t: 0 };
  function place() {
    const to = thumb.getBoundingClientRect(), t = k.t, mix = (a, b) => a + (b - a) * t;
    const w = mix(from.width, to.width), h = mix(from.height, to.height);
    const fx = from.left + from.width / 2, tx = to.left + to.width / 2;
    const hop = 4 * t * (1 - t) * Math.max(30, (to.top - from.top) * 0.25); // önce hafif yukarı, sonra rafa
    Object.assign(img.style, {
      left: mix(fx, tx) - w / 2 + "px",
      top: mix(from.top + from.height / 2, to.top + to.height / 2) - h / 2 - hop + "px",
      width: w + "px", height: h + "px",
      transform: `rotate(${mix(0, tilt) + Math.sin(Math.PI * t) * 10 * (Math.sign(tx - fx) || 1)}deg)`,
    });
  }
  place();
  return new Promise((resolve) => gsap.to(k, {
    t: 1, duration, ease: "power1.inOut", onUpdate: place,
    onComplete: () => { place(); land(); img.remove(); resolve(); },
  }));
}

/* raftaki yer görünmüyorsa raf oraya kayar (uçuştan önce çağrılırsa kayma inişe kadar biter) */
export function revealInTray(button) {
  const tray = button.parentElement, b = button.getBoundingClientRect(), r = tray.getBoundingClientRect();
  if (b.left >= r.left && b.right <= r.right) return;
  tray.scrollTo?.({ left: button.offsetLeft + button.offsetWidth / 2 - tray.clientWidth / 2, behavior: "smooth" });
}
