// loader.js (patched)
import { STATE } from "./state.js";
import { toast } from "./utils.js";
import { onLessonLoaded, showHint } from "./render.js";

function fileNameOf(x) {
  if (x == null || x === "index") return "index.json";
  const s = String(x).replace(/\.json$/i, "");
  return /^\d+$/.test(s) ? s.padStart(3, "0") + ".json" : s + ".json";
}

export async function fetchJson(name, { signal } = {}) {
  const base = `./data/${STATE.subject}/`;
  const url = base + fileNameOf(name);
  const res = await fetch(url, { cache: "no-store", signal });
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return await res.json();
}

const cacheByIndex = new Map();

/** Tự dò bài: từ 001 đến khi 404 */
export async function discoverLessons({ limit = 500 } = {}) {
  const list = [];
  for (let i = 1; i <= limit; i++) {
    try {
      const data = cacheByIndex.get(i) || await fetchJson(i);
      if (!cacheByIndex.has(i)) cacheByIndex.set(i, data);
      list.push({ index: i, title: data?.content?.[0]?.text || `Bài ${i}` });
    } catch {
      break;
    }
  }
  STATE.lessonList = list;
  return list.length;
}

export function getTotalLessons() {
  return STATE.lessonList?.length || 1;
}

let _tocAbort;
let _tocVersion = 0;
export async function loadTOC() {
  const myVersion = ++_tocVersion;
  _tocAbort?.abort();
  _tocAbort = new AbortController();
  try {
    // Ưu tiên index.json, nếu không có thì discover
    let toc;
    try {
      toc = await fetchJson("index", { signal: _tocAbort.signal });
      STATE.lessonList = Array.isArray(toc.lessons) ? toc.lessons : [];
    } catch {
      await discoverLessons();
    }
    if (myVersion !== _tocVersion) return;
  } catch (err) {
    console.warn("Load TOC fail:", err);
  }
}

let _indexAbort;
let _indexVersion = 0;

export async function loadIndex(i, { remember = true } = {}) {
  if (!Number.isFinite(i) || i < 1) i = 1;
  const myVersion = ++_indexVersion;
  _indexAbort?.abort();
  _indexAbort = new AbortController();

  try {
    STATE.index = i;
    if (remember) localStorage.setItem("lastIndex", String(i));

    const cached = cacheByIndex.get(i);
    const data = cached || await fetchJson(i, { signal: _indexAbort.signal });
    if (!cached) cacheByIndex.set(i, data);

    if (myVersion !== _indexVersion) return;

    onLessonLoaded(data);
    toast?.(`Đã nạp: ${fileNameOf(i)} (${STATE.subject})`);

    // Prefetch bài kế cho mượt
    const next = i + 1;
    if (!cacheByIndex.has(next)) {
      fetchJson(next).then(d => cacheByIndex.set(next, d)).catch(() => {});
    }
  } catch (err) {
    console.warn("Load index fail:", i, err);
    const base = `./data/${STATE.subject}/`;
    showHint?.(`Không đọc được <code>${fileNameOf(i)}</code> trong <code>${base}</code>.`);
  }
}

export function determineStartIndex() {
  const params = new URLSearchParams(location.search);
  const paramIndex = Number(params.get("i") || params.get("index"));
  const lastIndex = Number(localStorage.getItem("lastIndex"));
  if (Number.isFinite(paramIndex) && paramIndex >= 1) return paramIndex;
  if (Number.isFinite(lastIndex) && lastIndex >= 1) return lastIndex;
  return 1; // 001.json
}

// Trung tâm đổi môn
let _switching = false;
export async function switchSubject(subject) {
  if (!subject || subject === STATE.subject || _switching) return;
  _switching = true;
  try {
    STATE.subject = subject;
    localStorage.setItem("subject", subject);
    cacheByIndex.clear();
    STATE.lessonList = [];

    await loadTOC();
    await loadIndex(1, { remember: false });
  } finally {
    _switching = false;
  }
}

// Gắn handler nav ngay tại đây để đảm bảo luôn bắt được click
document.addEventListener("DOMContentLoaded", () => {
  const nav = document.querySelector(".subject-nav");
  if (!nav) return;
  nav.addEventListener("click", (e) => {
    const btn = e.target.closest(".subject-item");
    if (!btn) return;
    switchSubject(btn.dataset.subject);
    // cập nhật active state
    nav.querySelectorAll(".subject-item").forEach(b => {
      const on = b.dataset.subject === STATE.subject;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
  });
});
