import raw from "./projects.json";

export const STATUSES = ["live", "dev", "design", "planning"];
const REQUIRED = ["id", "status", "color", "title", "kind", "desc", "line"];
const LOCALIZED = ["title", "kind", "desc", "line"];

export function validateProjects(list) {
  const errors = [];
  list.forEach((p, i) => {
    const tag = `#${i} ${p.id ?? "?"}`;
    REQUIRED.forEach((f) => { if (p[f] == null) errors.push(`${tag}: '${f}' eksik`); });
    if (p.status != null && !STATUSES.includes(p.status)) errors.push(`${tag}: status '${p.status}' geçersiz`);
    LOCALIZED.forEach((f) => { if (p[f] && !p[f].tr) errors.push(`${tag}: '${f}.tr' eksik`); });
  });
  return errors;
}

export function usableLinks(p) {
  return (p.links || []).filter((l) => l.url && l.url !== "#");
}

export function assignSlots(list, slots) {
  return {
    placed: list.slice(0, slots.length).map((project, index) => ({ project, slot: slots[index], index })),
    overflow: list.slice(slots.length),
  };
}

export const PROJECTS = raw;

if (import.meta.env?.DEV) validateProjects(raw).forEach((m) => console.error("[projects]", m));
