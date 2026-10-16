import { t, loc } from "../data/i18n.js";
import { usableLinks } from "../data/projects.js";
import { esc } from "./html.js";

const linkA = (l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`;

function card(p, lang) {
  const links = usableLinks(p), shot = p.shots?.[0];
  return `<article class="lv-card" style="--lab:${esc(p.color.label)}">
    ${shot ? `<img src="${esc(shot)}" alt="${esc(loc(lang, p.title))}" loading="lazy" decoding="async" onerror="this.remove()">` : ""}
    <div class="lv-card-top"><h4>${esc(loc(lang, p.title))}</h4><span class="chip${p.status === "live" ? " live" : ""}">${esc(t(lang, "status_" + p.status))}</span></div>
    <div class="lv-kind">${esc(loc(lang, p.kind))}</div>
    <p>${esc(loc(lang, p.desc))}</p>
    <ul class="lv-stack">${(p.stack || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    ${links.length ? `<p class="lv-links">${links.map(linkA).join("")}</p>` : ""}
  </article>`;
}

export function renderList(projects, profile, lang) {
  const about = projects.find((p) => p.id === "hakkimda");
  const rest = projects.filter((p) => p.id !== "hakkimda");
  const cv = profile.cv?.[lang];
  const contacts = [
    profile.email && `<a href="mailto:${esc(profile.email)}">✉ ${esc(profile.email)}</a>`,
    profile.github && linkA({ url: profile.github, label: "GitHub" }),
    profile.linkedin && linkA({ url: profile.linkedin, label: "LinkedIn" }),
  ].filter(Boolean);
  return `<div class="lv-inner">
    <header class="lv-head"><h2 id="lvTitle" tabindex="-1">${esc(t(lang, "list_title"))}</h2><button type="button" class="lv-close" data-act="close">${esc(t(lang, "list_back"))}</button></header>
    ${about ? `<p class="lv-about">${esc(loc(lang, about.desc))}</p>` : ""}
    ${cv ? `<p><a class="lv-cv" href="${esc(cv)}" download>${esc(t(lang, "cv"))}</a></p>` : ""}
    ${contacts.length ? `<section><h3>${esc(t(lang, "contact"))}</h3><p class="lv-contacts">${contacts.join("")}</p></section>` : ""}
    <section><h3>${esc(t(lang, "projects"))}</h3><div class="lv-grid">${rest.map((p) => card(p, lang)).join("")}</div></section>
    <footer class="lv-foot">${esc(t(lang, "footer_note"))}</footer>
  </div>`;
}

/* liste açıkken arkadaki her şey etkileşimsiz: odak ve tıklama listeden kaçmasın */
const BEHIND = ["topbar", "room", "tray", "screenUi", "screenBackdrop", "fanart"];

export function initListview({ el, state, bus, projects, profile }) {
  let openedInApp = false, lastFocus = null;
  const render = () => { el.innerHTML = renderList(projects, profile, state.lang); };

  function sync() {
    const open = location.hash === "#liste";
    if (open === !el.hidden) return;
    el.hidden = !open;
    document.body.classList.toggle("list-open", open);
    BEHIND.forEach((id) => document.getElementById(id)?.toggleAttribute("inert", open));
    if (open) { lastFocus = document.activeElement; el.scrollTop = 0; el.querySelector("#lvTitle").focus(); }
    else lastFocus?.focus?.({ preventScroll: true });
  }
  function open() { openedInApp = true; location.hash = "liste"; }
  function close() {
    if (openedInApp) { openedInApp = false; history.back(); }
    else { history.replaceState(null, "", location.pathname + location.search); sync(); }
  }

  el.addEventListener("click", (e) => { if (e.target.closest("[data-act=close]")) close(); });
  /* capture: BMO ekranının Esc dinleyicisinden önce yakalar */
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !el.hidden) { e.stopPropagation(); close(); } }, true);
  addEventListener("hashchange", sync);
  bus.on("lang:change", render);
  render();
  sync();
  return { open, close };
}
