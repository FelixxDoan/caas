// utils.js
export const $ = (sel, ctx = document) => ctx.querySelector(sel);
export const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

export function escapeHTML(str) {
  return (str || "").replace(/[&<>"']/g, s => ({
    "&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"
  }[s]));
}

export function toast(msg) {
  const el = document.createElement("div");
  el.className = "toast";
  el.textContent = msg;
  Object.assign(el.style, {
    position: "fixed", bottom: "16px", right: "16px", zIndex: 50,
    padding: "10px 12px", borderRadius: "10px",
    border: "1px solid var(--border)", background: "var(--panel)", color: "var(--text)",
    boxShadow: "0 4px 16px rgba(0,0,0,.15)"
  });
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1500);
}

export function debounce(fn, delay = 300) {
  let t = null;
  return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); };
}
