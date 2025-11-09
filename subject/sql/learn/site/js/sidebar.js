import { fetchJson } from "./dataLoader.js";
import { loadLesson } from "./render.js";

export let lessons = [];

export function buildSidebar(menu) {
  let promises = [];

  for (let i = 1; i <= 99; i++) {
    promises.push(
      fetchJson(i)
        .then((data) => {
          const name = data.content?.[0]?.text || `Lesson ${i}`;
          lessons.push({ index: i, title: name });
        })
        .catch(() => {})
    );
  }

  Promise.all(promises).then(() => {
    lessons.sort((a, b) => a.index - b.index);

    lessons.forEach((lesson) => {
      const li = document.createElement("li");
      const a = document.createElement("a");

      a.href = "#";
      a.textContent = lesson.title;
      a.onclick = (e) => {
        e.preventDefault();
        loadLesson(lesson.index);
      };

      li.appendChild(a);
      menu.appendChild(li);
    });

    if (lessons.length > 0) {
      loadLesson(lessons[0].index);
    }
  });
}
