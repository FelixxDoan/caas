// theme.js
import { STATE } from "./state.js";
import { $ } from "./utils.js";

export function applyTheme() {
  document.documentElement.setAttribute("data-theme", STATE.theme);
  $("#themeToggle").textContent = STATE.theme === "light" ? "Tối" : "Sáng";
}
export function toggleTheme() {
  STATE.theme = STATE.theme === "light" ? "dark" : "light";
  localStorage.setItem("theme", STATE.theme);
  applyTheme();
}
export function applyFont() {
  document.documentElement.style.setProperty("--font-size", STATE.font + "px");
}
export function fontPlus() {
  STATE.font = Math.min(22, STATE.font + 1);
  localStorage.setItem("font", STATE.font);
  applyFont();
}
export function fontMinus() {
  STATE.font = Math.max(12, STATE.font - 1);
  localStorage.setItem("font", STATE.font);
  applyFont();
}
