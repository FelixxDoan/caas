import { getResult, runQuery, getScore, getTable } from "./fetchData.js";
import genQuestion from "./generateQuestion.js";
import { clearResult, showRunResult, showSampleResult } from "./result.js";

const qList = document.getElementById("questionList");
const sqlInput = document.getElementById("sqlInput");
let questions;
const runBtn = document.getElementById("run");
const tableList = document.getElementById("tableList");
        tableList.innerHTML = "";

document.addEventListener("DOMContentLoaded", async () => {
  questions = await genQuestion();
  renderQuestions(questions);
RenderTable()

});

async function RenderTable() {
  const {rows: tables} = await getTable()
 tables.forEach(tbl => {
            const li = document.createElement("li");
            li.textContent = tbl.table_name;
            li.style.cursor = "pointer";
            li.addEventListener("click", () => {
                document.querySelector("textarea").value = `SELECT * FROM ${tbl.table_name};`;
                runSQL(`SELECT * FROM ${tbl.table_name};`);
            });
            tableList.appendChild(li);
        });
}

let currentQuestionId = null;
let saved = {};

function renderQuestions(questions) {
  questions.forEach((q, i) => {
    let li = document.createElement("li");
    li.textContent = q.question_text;
    li.onclick = async () => {
      currentQuestionId = q.question_id;
      sqlInput.value = "-- " + q.question_text + "\n";
      const data = await getResult(q.question_id);
      clearResult();
      const html = genDataResult(data);
      showSampleResult(html);
    };
    qList.appendChild(li);
  });
}

runBtn.onclick = async () => {
  const runInput = sqlInput.value
    .split("\n")
    .filter((line) => !line.trim().startsWith("--"))
    .join("\n")
    .trim();

  if (!runInput) {
    alert("Bạn chưa nhập câu lệnh SQL!");
    return;
  }
  saved[currentQuestionId] = runInput;
  await runSQL(runInput);
};

async function runSQL(query) {
  const data = await runQuery(query);
  if (!data || !data.rows || data.rows.length === 0) {
    showRunResult("<p>No result.</p>");
    return;
  }

  const html = genDataResult(data);
  // Hiển thị kết quả
  showRunResult(html);
}

function genDataResult(data) {
  let html = "<table border='1' cellpadding='5'><tr>";

  // Header
  data.fields.forEach((field) => {
    html += `<th>${field}</th>`;
  });
  html += "</tr>";

  // Rows
  data.rows.forEach((row) => {
    html += "<tr>";
    data.fields.forEach((field) => {
      html += `<td>${row[field]}</td>`;
    });
    html += "</tr>";
  });

  html += "</table>";

  return html;
}

async function submit(saved) {
  lockUI();
  document.getElementById("gradingModal").style.display = "flex";
  const score = await getScore(saved);
  document.getElementById("gradingModal").style.display = "none"; // ẩn modal chấm
  document.getElementById(
    "scoreText"
  ).innerHTML = `Bạn đạt <b>${score}</b> / 15 điểm`;
  document.getElementById("scoreModal").style.display = "flex";
}

const submitBtn = document.getElementById("submitBtn");
submitBtn.onclick = async () => await submit(saved);

// Countdown 45 phút
let timeLeft = 45 * 60;
const timerEl = document.getElementById("timer");
const timer = setInterval(async () => {
  const m = Math.floor(timeLeft / 60);
  const s = timeLeft % 60;
  timerEl.textContent = `${m}:${s.toString().padStart(2, "0")}`;
  if (timeLeft <= 0) {
    clearInterval(timer);
    await submit(saved);
  }
  timeLeft--;
}, 1000);

function lockUI() {
  clearInterval(timer);
  // Khóa textarea và nút Run
  document.getElementById("sqlInput").disabled = true;
 
  document.getElementById("submitBtn").disabled = true;

  // Ngăn click chọn câu hỏi
  document.querySelectorAll("#questionList li").forEach((li) => {
    li.style.pointerEvents = "none";
    li.style.opacity = 0.5;
  });
}

const tabBtn = document.querySelectorAll(".tab-btn");
tabBtn.forEach((btn) => {
  btn.addEventListener("click", () => {
    // Remove active from all buttons
    document
      .querySelectorAll(".tab-btn")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    // Hide all results
    document
      .querySelectorAll(".result-box")
      .forEach((box) => (box.style.display = "none"));

    // Show selected
    document.getElementById(btn.dataset.target).style.display = "block";
  });
});


