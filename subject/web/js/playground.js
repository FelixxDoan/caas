// playground.js
import { $ } from "./utils.js";
import { STATE } from "./state.js";

let currentObjectUrl = null;

/**
 * Kết hợp HTML/CSS/JS thành một tài liệu hoàn chỉnh để chạy trong iframe (Blob URL)
 */
function buildHtml({ html = "", css = "", js = "" }) {
  // Cầu nối gửi console.log / warn / error và lỗi runtime ra trang chính
  const bridge = `
<script>
(function(){
  function post(type, payload){
    try { parent.postMessage({ __preview_console__: true, type, payload }, "*"); } catch(e){}
  }
  const _log = console.log, _warn = console.warn, _err = console.error;
  console.log = (...args)=>{ post("log", args.map(String)); _log.apply(console, args); };
  console.warn = (...args)=>{ post("warn", args.map(String)); _warn.apply(console, args); };
  console.error = (...args)=>{ post("error", args.map(String)); _err.apply(console, args); };

  window.addEventListener("error", function(e){
    post("error", [e.message + " (" + (e.filename||"") + ":" + (e.lineno||"") + ")"]);
  });

  window.addEventListener("unhandledrejection", function(e){
    const msg = e?.reason && (e.reason.stack || e.reason.message) || String(e.reason);
    post("error", ["UnhandledPromiseRejection: " + msg]);
  });
})();
<\/script>`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<style>
${css || ""}
</style>
</head>
<body>
${html || ""}
${bridge}
<script>
${(js || "").replace(/<\/script>/gi, "<\\/script>")}
<\/script>
</body>
</html>`;
}

/** Giải phóng Blob URL cũ để tránh rò rỉ bộ nhớ */
function revokeCurrentUrl() {
  if (currentObjectUrl) {
    URL.revokeObjectURL(currentObjectUrl);
    currentObjectUrl = null;
  }
}

/** Chạy nội dung (đã combine hoặc là raw HTML) vào iframe bằng Blob URL */
function runCodeInternal(args = {}, iframe = $("#preview")) {
  if (!iframe) return;

  revokeCurrentUrl();

  let fullHtml = "";
  if (typeof args.raw === "string") {
    fullHtml = args.raw;
  } else {
    fullHtml = buildHtml(args);
  }

  const blob = new Blob([fullHtml], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  currentObjectUrl = url;

  // Không dùng sandbox cho blob (đã cách ly origin)
  iframe.removeAttribute("sandbox");
  iframe.src = url;
}

/** Public API: chạy từ nội dung trong editor theo môn hiện tại */
export function runFromEditor() {
  const iframe = $("#preview");
  const code = $("#codeEditor")?.value || "";

  // Nếu là tài liệu HTML đầy đủ thì chạy luôn
  const isFullHtml = /<\s*html[\s>]/i.test(code);
  if (isFullHtml) {
    runCodeInternal({ raw: code }, iframe);
    return;
  }

  // Kết hợp theo môn hiện tại
  const subj = STATE.subject; // 'html' | 'css' | 'js'
  if (subj === "html") {
    runCodeInternal({ raw: code }, iframe);
  } else if (subj === "css") {
    runCodeInternal({ html: "<div id='app'></div>", css: code, js: "" }, iframe);
  } else if (subj === "js") {
    runCodeInternal({ html: "<div id='app'></div>", css: "", js: code }, iframe);
  } else {
    runCodeInternal({ raw: code }, iframe);
  }
}

/** Public API: reset iframe preview */
export function resetPreview(iframe = $("#preview")) {
  revokeCurrentUrl();
  if (iframe) {
    iframe.removeAttribute("sandbox");
    iframe.src = "about:blank";
  }
}

/**
 * Public API: nhận log từ iframe (blob) rồi chuyển cho UI handler
 * @param {(msg:{type:string,payload:string[]})=>void} onMessage
 */
export function initConsoleBridge(onMessage) {
  window.addEventListener("message", (ev) => {
    const data = ev?.data;
    if (!data || data.__preview_console__ !== true) return;
    if (typeof onMessage === "function") onMessage({ type: data.type, payload: data.payload });
  });
}

/* =========================
   Lưu / khôi phục code theo môn hiện tại
   ========================= */
function subjectKey(subj = STATE.subject) {
  return `playground:lastCode:${subj || "unknown"}`;
}

/** Public API: lưu code hiện tại từ editor vào localStorage */
export function saveFromEditor() {
  const ta = document.getElementById("codeEditor");
  if (!ta) return;
  try {
    localStorage.setItem(subjectKey(), String(ta.value ?? ""));
  } catch (_) {}
}

/** Public API: lấy code đã lưu của môn hiện tại */
export function loadSavedCode() {
  try {
    const val = localStorage.getItem(subjectKey());
    return typeof val === "string" ? val : "";
  } catch (_) { return ""; }
}

/** Public API: xoá code đã lưu của môn hiện tại */
export function clearSavedCode() {
  try { localStorage.removeItem(subjectKey()); } catch (_) {}
}
