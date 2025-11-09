// search.js
import { $, $$ } from "./utils.js";

export function applySearch(q) {
  q = (q || "").trim().toLowerCase();
  const items = $$("#content p, #content .card, #content h1, #content h2, #content h3, #content pre");
  items.forEach(el => {
    const text = el.textContent.toLowerCase();
    el.style.display = q && !text.includes(q) ? "none" : "";
  });
  $$("#tocList a").forEach(a => {
    const t = a.textContent.toLowerCase();
    a.style.display = q && !t.includes(q) ? "none" : "";
  });
}
