const API_BASE = "/api";

async function getQuestion() {
  try {
    const res = await fetch(`${API_BASE}/subject/sql/exam/question`, {
      method: "GET",
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("error: ", error);
  }
}

export async function getResult(id) {
  try {
    const res = await fetch(`${API_BASE}/subject/sql/exam/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("error: ", error);
  }
}

export async function runQuery(query) {
  try {
    const res = await fetch(
      `${API_BASE}/subject/sql/exam/query-run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query }),
      }
    );

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("loi: ", error);
  }
}

function generateId() {
  return Math.floor(Math.random() * 1000).toString();
}

export async function getScore(saved) {
  const studentId = generateId()

  try {
    const res = await fetch(`${API_BASE}/subject/sql/exam/submit`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ saved, studentId }),
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("loi: ", error);
  }
}

export async function getTable() {
  try {
    const res = await fetch(`${API_BASE}/subject/sql/exam/table`, {
      method: "GET",
    });

    const data = await res.json();
    return data;
  } catch (error) {
    console.log("loi: ", error);
  }
}

export default getQuestion;
