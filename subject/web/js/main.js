// main.js
import { $, $$ } from "./utils.js";
import { applyTheme, toggleTheme, applyFont, fontPlus, fontMinus } from "./theme.js";
import {
  runFromEditor as runCode,
  resetPreview as resetCode,
  saveFromEditor as saveCode,
  clearSavedCode,
  initConsoleBridge,
  loadSavedCode,
} from "./playground.js";
import {
  appendToConsole,
  initPlaygroundConsole,
  setEditorValue,
} from "./render.js";
import { determineStartIndex, loadIndex, discoverLessons } from "./loader.js";
import { STATE } from "./state.js";

let switching = false;

export async function switchSubject(subj) {
  if (!subj || subj === STATE.subject || switching) return;
  switching = true;
  try {
    // Lưu code hiện tại trước khi chuyển môn
    saveCode();

    STATE.subject = subj;
    localStorage.setItem("subject", subj);

    // Cập nhật UI active
    document.querySelectorAll(".subject-item").forEach((b) => {
      const on = b.dataset.subject === subj;
      b.classList.toggle("is-active", on);
      if (on) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });

    // Dọn preview + console
    resetCode();
    initPlaygroundConsole();

    // Nạp index của môn mới
    await loadIndex();

    // Nạp code đã lưu của môn mới vào editor (nếu có)
    const saved = loadSavedCode();
    if (typeof saved === "string") setEditorValue(saved);
  } finally {
    switching = false;
  }
}

window.addEventListener("DOMContentLoaded", async () => {
  applyTheme();
  applyFont();
  $("#themeToggle")?.addEventListener("click", toggleTheme);
  $("#fontPlus")?.addEventListener("click", fontPlus);
  $("#fontMinus")?.addEventListener("click", fontMinus);

  // Nút Playground
  $("#runBtn")?.addEventListener("click", runCode);
  $("#resetBtn")?.addEventListener("click", resetCode);
  $("#saveCodeBtn")?.addEventListener("click", saveCode);
  $("#clearSaveBtn")?.addEventListener("click", clearSavedCode);

  // Cầu nối console từ iframe (blob) → UI
  initConsoleBridge(appendToConsole);
  initPlaygroundConsole();

  // Dò danh sách bài để TOC chạy chế độ "Bài học"
  await discoverLessons();

  const startIndex = determineStartIndex();
  await loadIndex(startIndex);

  // Điều hướng phím ← →
  window.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    if (e.key === "ArrowRight") loadIndex(STATE.index + 1, { remember: true });
    if (e.key === "ArrowLeft" && STATE.index > 1)
      loadIndex(STATE.index - 1, { remember: true });
  });

  // Tìm kiếm (lazy import)
  import("./search.js").then(({ applySearch }) => {
    $("#searchBox")?.addEventListener("input", (e) => applySearch(e.target.value));
  });

  // Set active ban đầu khi tải trang
  document.querySelectorAll(".subject-item").forEach((b) => {
    const on = b.dataset.subject === STATE.subject;
    b.classList.toggle("is-active", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });

  // Bắt click menu ngang chuyển môn
  const nav = document.querySelector(".subject-nav");
  if (nav) {
    nav.addEventListener("click", (e) => {
      const btn = e.target.closest(".subject-item");
      if (!btn) return;
      switchSubject(btn.dataset.subject)?.catch(console.error);
    });
  }
});
