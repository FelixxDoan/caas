// render.js
import { STATE } from "./state.js";
import { $, $$, escapeHTML, toast } from "./utils.js";
import { runFromEditor as runCode } from "./playground.js";
import { loadIndex, getTotalLessons } from "./loader.js";
import { resetPreview } from "./playground.js";

export function showHint(html) {
  $("#content").innerHTML = `<div class="empty-hint"><p>${html}</p></div>`;
  $("#tocList").innerHTML = "";
  $("#codeEditor").value = "";
  $("#preview").srcdoc = "";
  STATE.examples = [];
  STATE.currentExampleIdx = -1;
  STATE.lesson = null;
}

/* ========== Tiền xử lý JSON (bỏ object thứ 2 & 2 object cuối) ========== */
function sanitizeContent(data) {
  const cleaned = {
    ...data,
    content: Array.isArray(data.content) ? data.content.filter(block => {
      if (block.type === "other") {
        const t = (block.text || "").replace(/\s+/g, " ").trim(); // chuẩn hoá khoảng trắng
        // Điều kiện nhận diện các block cần bỏ
        if (
          t.includes("❮ Previous") && t.includes("Next ❯") ||
          t.includes("Track your progress - it's free!") && t.includes("Log in") && t.includes("Sign Up")
        ) {
          return false;
        }
      }
      return true;
    }) : [],
  };

  return cleaned;
}



/* ========== TOC Header + nút chuyển chế độ ========== */
function tocHeader() {
  const total = getTotalLessons();
  const mode = STATE.tocMode === "lessons" ? "lessons" : "headings";
  const nextModeLabel =
    mode === "headings" ? "Xem danh sách bài" : "Xem heading trong bài";
  return `
    <div class="toc-header">
      <div class="toc-row">
        <strong>Bài ${STATE.index} / ${total}</strong>
        <button id="tocModeBtn" class="toc-mode">${nextModeLabel}</button>
      </div>
    </div>
  `;
}

/* ========== TOC chế độ Headings ========== */
function renderTOCHeadings(data) {
  const toc = $("#tocList");
  toc.innerHTML = tocHeader();

  const items = data.content || [];
  items.forEach((block, idx) => {
    if (block.type === "heading") {
      const level = block.level || 2;
      const anchor = `h-${idx}`;
      const a = document.createElement("a");
      a.href = `#${anchor}`;
      a.textContent =
        (level === 1 ? "🧭 " : level === 2 ? "📘 " : "📗 ") +
        (block.text || `Heading ${idx}`);
      a.dataset.anchor = anchor;
      if (STATE.progress[block.text]) a.classList.add("done");
      toc.appendChild(a);
    }
  });

  bindTocModeSwitch();
  bindScrollSpy();
}

/* ========== TOC chế độ Danh sách bài ========== */
function renderTOCLessons() {
  const toc = $("#tocList");
  toc.innerHTML = tocHeader();

  const list = STATE.lessonList || [];
  list.forEach((item) => {
    // Ưu tiên lấy heading đầu tiên
    let displayTitle = item.title;
    if (Array.isArray(item.content) && item.content.length > 0) {
      const firstBlock = item.content.find(
        (b) => b.type === "heading" && b.text
      );
      if (firstBlock) displayTitle = firstBlock.text;
    }

    const a = document.createElement("a");
    a.href = "javascript:void(0)";
    a.textContent = displayTitle || "(Không tiêu đề)";
    a.title = `#${String(item.index).padStart(3, "0")} — ${displayTitle || ""}`;
    a.classList.toggle("current", item.index === STATE.index);
    a.addEventListener("click", () => loadIndex(item.index));
    toc.appendChild(a);
  });

  bindTocModeSwitch();
}

/* ========== Nút chuyển chế độ TOC ========== */
function bindTocModeSwitch() {
  const btn = $("#tocModeBtn");
  if (!btn) return;
  btn.addEventListener("click", () => {
    STATE.tocMode = STATE.tocMode === "headings" ? "lessons" : "headings";
    localStorage.setItem("tocMode", STATE.tocMode);
    renderTOC(STATE.lesson);
  });
}

/* ========== Scroll Spy ========== */
function bindScrollSpy() {
  if (STATE.tocMode !== "headings") return;
  const headings = $$("#content h1, #content h2, #content h3");

  const onScroll = () => {
    let current = null;
    const top = window.scrollY + 100;
    headings.forEach((h) => {
      const y = h.getBoundingClientRect().top + window.scrollY;
      if (y <= top) current = h.id;
    });
    if (current) {
      $$("#tocList a").forEach((a) => {
        a.classList.toggle("active", a.dataset.anchor === current);
      });
    }
  };

  window.removeEventListener("scroll", window.__tocSpy);
  window.__tocSpy = onScroll;
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ========== API export: renderTOC được gọi tùy mode ========== */
export function renderTOC(data) {
  if (STATE.tocMode === "lessons") renderTOCLessons();
  else renderTOCHeadings(data);
}

/* ========== Nút hành động dưới mỗi heading ========== */
function sectionActions(block) {
  const text = escapeHTML(block.text || "");
  return `<div class="actions">
    <button class="btn-done" data-heading="${text}" title="Đánh dấu đã học mục này">Đã hiểu ✔</button>
  </div>`;
}

/* ========== Thẻ ví dụ ========== */
function exampleCard(exId, lang, code) {
  const safeCode = escapeHTML(code);
  return `<div class="card">
    <div class="card-head">
      <div><strong>Ví dụ</strong> <span class="chip">${lang.toUpperCase()}</span></div>
      <div class="btns">
        <button class="btn-load" data-for="${exId}">Nạp vào Editor</button>
        <button class="btn-copy" data-for="${exId}">Copy</button>
      </div>
    </div>
    <pre id="${exId}"><code>${safeCode}</code></pre>
  </div>`;
}

/* ========== Nút điều hướng bài (đầu/cuối bài) ========== */
function navigationButtons() {
  return `
    <div class="nav-buttons">
      <button class="nav-prev">❮ Bài trước</button>
      <button class="nav-next">Bài sau ❯</button>
    </div>
  `;
}

/* ========== Render nội dung bài ========== */
export function renderContent(data) {
  const main = $("#content");

  const fragments = [];
  fragments.push(navigationButtons()); // đầu bài

  const items = data.content || [];
  STATE.examples = [];
  items.forEach((block, idx) => {
    switch (block.type) {
      case "heading": {
        const level = block.level || 2;
        const tag = level >= 1 && level <= 6 ? "h" + level : "h2";
        fragments.push(
          `<${tag} id="h-${idx}">${escapeHTML(block.text || "")}</${tag}>`
        );
        fragments.push(sectionActions(block));
        break;
      }
      case "paragraph": {
        fragments.push(`<p>${escapeHTML(block.text || "")}</p>`);
        break;
      }
      case "example": {
        const examples = (block.codes || [])
          .map((c, exi) => {
            const code = c.code || "";
            const lang = (c.language || "code").toLowerCase();
            const exId = `ex-${idx}-${exi}`;
            STATE.examples.push({ id: exId, code, lang });
            return exampleCard(exId, lang, code);
          })
          .join("");
        fragments.push(examples);
        break;
      }
      case "other": {
        fragments.push(
          `<div class="card"><div>${escapeHTML(block.text || "")}</div></div>`
        );
        break;
      }
      default:
        fragments.push(`<p>${escapeHTML(JSON.stringify(block))}</p>`);
    }
  });

  fragments.push(navigationButtons()); // cuối bài

  main.innerHTML = fragments.join("\n");

  // Nút điều hướng
  $$(".nav-prev").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (STATE.index > 1) loadIndex(STATE.index - 1);
    });
  });
  $$(".nav-next").forEach((btn) => {
    btn.addEventListener("click", () => loadIndex(STATE.index + 1));
  });

  // Nút trong thẻ ví dụ
  $$(".btn-copy").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-for");
      const pre = document.getElementById(id);
      navigator.clipboard
        .writeText(pre?.textContent || "")
        .then(() => toast("Đã copy code"));
    });
  });
  $$(".btn-load").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-for");
      const found = STATE.examples.find((x) => x.id === id);
      if (found) {
        $("#codeEditor").value = found.code;
        STATE.currentExampleIdx = STATE.examples.indexOf(found);
        toast("Đã nạp code vào Editor");
        runCode();
      }
    });
  });
  $$(".btn-done").forEach((btn) => {
    btn.addEventListener("click", () => {
      const heading = btn.getAttribute("data-heading");
      STATE.progress[heading] = true;
      localStorage.setItem("progress", JSON.stringify(STATE.progress));
      renderTOC(STATE.lesson);
      toast("Đã đánh dấu hoàn thành");
    });
  });
}

/* ========== Khi load bài xong ========== */
export function onLessonLoaded(data) {
  const sanitized = sanitizeContent(data);
  STATE.lesson = sanitized;
  renderTOC(sanitized);
  renderContent(sanitized);
  selectFirstExample();
  resetPreview();
  initPlaygroundConsole();
}

/* ========== Chọn ví dụ đầu tiên ========== */
export function selectFirstExample() {
  const firstHeading = $("#content h1, #content h2, #content h3");
  const headingText = firstHeading?.textContent || null;
  const saved = headingText && STATE.savedCode[headingText];
  const firstExample = STATE.examples[0];
  if (saved) {
    $("#codeEditor").value = saved;
  } else if (firstExample) {
    $("#codeEditor").value = firstExample.code;
  } else {
    $("#codeEditor").value = "";
  }
  if ($("#codeEditor").value.trim()) runCode();
}

export function appendToConsole({ type, payload }) {
  const box = $("#consolePanel");
  if (!box) return;
  const line = document.createElement("div");
  line.className = "console-line console-" + type;
  line.textContent = `[${type.toUpperCase()}] ${payload.join(" ")}`;
  box.appendChild(line);
  box.scrollTop = box.scrollHeight;
}

export function initPlaygroundConsole() {
   const box = $("#consolePanel");
  if (box) box.innerHTML = "";
}

/**
 * Gắn sự kiện cho nút Run
 * @param {Function} runHandler - hàm chạy code
 */
export function wireRunButton(runHandler) {
  const btn = $("#runBtn");
  if (btn && typeof runHandler === "function") {
    btn.addEventListener("click", () => {
      const box = $("#consolePanel");
      if (box) box.innerHTML = "";
      runHandler();
    });
  }
}

/**
 * Gán nội dung cho code editor
 */
export function setEditorValue(text) {
  const ta = $("#codeEditor");
  if (ta) ta.value = String(text ?? "");
}

/**
 * Nạp code đã lưu vào editor
 * @param {Function} loadFn - hàm trả về code đã lưu
 */
export function loadSavedToEditor(loadFn) {
  if (typeof loadFn !== "function") return;
  const code = loadFn();
  setEditorValue(code);
}

/**
 * Dọn preview + console khi đổi bài/môn
 * @param {Function} resetFn - hàm reset preview
 */
export function onLessonChange(resetFn) {
  if (typeof resetFn === "function") resetFn();
  initPlaygroundConsole();
}