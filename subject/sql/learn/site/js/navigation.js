import { loadLesson } from "./render.js";

export function updateNav(prevLink, nextLink, currentIndex, lessons) {
  prevLink.onclick = (e) => {
    e.preventDefault();
    if (currentIndex > 1) loadLesson(currentIndex - 1);
  };

  nextLink.onclick = (e) => {
    e.preventDefault();
    if (currentIndex < lessons.length) loadLesson(currentIndex + 1);
  };
}
