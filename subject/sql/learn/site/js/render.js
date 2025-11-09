import { fetchJson } from "./dataLoader.js";
import { updateNav } from "./navigation.js";
import { lessons } from "./sidebar.js";
import { formatSQL } from "./sqlFormatter.js";

let currentIndex = 0;
const skipText = [
  "❮ Previous", "Next ❯", "Track your progress", "Sign Up", "Log in", "★"
];

export function loadLesson(index) {
  const contentContainer = document.getElementById("content-container");
  const pageTitle = document.getElementById("page-title");
  const prevLink = document.getElementById("prev-link");
  const nextLink = document.getElementById("next-link");

  fetchJson(index)
    .then((jsonData) => {
      currentIndex = index;
      renderContent(jsonData, contentContainer, pageTitle);
      updateNav(prevLink, nextLink, currentIndex, lessons);
    })
    .catch(() => {
      contentContainer.innerHTML = "<p class='loading'>Không thể tải nội dung.</p>";
    });
}

function renderContent(jsonData, contentContainer, pageTitle) {
  pageTitle.textContent = jsonData.title.trim();
  contentContainer.innerHTML = "";

  for (let i = 0; i < jsonData.content.length - 2; i++) {
    const item = jsonData.content[i];
    let el = null;

    if (item.type === "other" && skipText.some((txt) => item.text.includes(txt))) continue;

    if (item.type === "heading") {
      el = document.createElement("h2");
      el.textContent = item.text.trim();
    }
    else if (item.type === "paragraph") {
      el = document.createElement("p");
      el.textContent = item.text.trim();
    }
    else if (item.type === "code") {
      el = document.createElement("pre");
      el.className = "syntax-box";
      el.textContent = formatSQL(item.text.trim()).trim();
    }
    else if (item.type === "other") {
      const text = item.text.trim();

      if (text.includes("Try it Yourself")) {
        el = buildExampleBlock(text);
      }
      else if (/^(SELECT|UPDATE|DELETE|INSERT)/i.test(text)) {
        el = document.createElement("pre");
        el.className = "syntax-box";
        el.textContent = formatSQL(text).trim();
      }
      else {
        el = document.createElement("p");
        el.textContent = text;
      }
    }

    if (el) contentContainer.appendChild(el);
  }
}

function buildExampleBlock(text) {
  const wrapper = document.createElement("div");
  wrapper.className = "example-box";

  const trySplit = text.split("Try it Yourself");
  const raw = trySplit[0].trim();
  const lines = raw.split("\n");

  let description = "";
  let codeLines = [];

  if (lines[0].trim() === "Example") {
    description = lines[1] || "";
    codeLines = lines.slice(2);
  } else {
    codeLines = lines;
  }

  if (description) {
    const p = document.createElement("p");
    p.textContent = description.trim();
    wrapper.appendChild(p);
  }

  const sqlCode = codeLines.join("\n").trim();
  const codeBox = document.createElement("pre");
  codeBox.className = "syntax-box";
  codeBox.textContent = formatSQL(sqlCode).trim();
  wrapper.appendChild(codeBox);

  const btn = document.createElement("a");
  btn.href = "#";
  btn.className = "try-btn";
  btn.textContent = "Try it Yourself »";

  btn.addEventListener("click", function (e) {
    e.preventDefault();
    const modal = document.querySelector(".modal");
    modal.style.display = "flex";
    modal.querySelector(".sql-editor").value = codeBox.textContent.trim();
  });

  wrapper.appendChild(btn);
  return wrapper;
}
