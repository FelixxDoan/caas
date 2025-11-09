// state.js
export const STATE = {
  index: null,           // bài hiện tại (1-based)
  lesson: null,          // dữ liệu JSON đã render
  examples: [],          // các ví dụ flatten
  currentExampleIdx: -1,
 subject: localStorage.getItem('subject') || 'html',
  theme: localStorage.getItem("theme") || "light",
  font: Number(localStorage.getItem("font") || 16),

  progress: JSON.parse(localStorage.getItem("progress") || "{}"),
  savedCode: {},

  // TOC
  tocMode: localStorage.getItem("tocMode") || "headings", // 'headings' | 'lessons'
  lessonList: [], // [{ index, title }]
};

try { STATE.savedCode = JSON.parse(localStorage.getItem("savedCode") || "{}"); }
catch (_) { STATE.savedCode = {}; }
