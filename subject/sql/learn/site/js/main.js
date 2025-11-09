import { buildSidebar } from "./sidebar.js";

document.addEventListener("DOMContentLoaded", () => {
  const menu = document.getElementById("sidebar-menu");
  buildSidebar(menu);
});
