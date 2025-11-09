import getQuestion from "./fetchData.js";

async function genQuestion() {
  const { rows: questions } = await getQuestion();
  return questions
}

export default genQuestion;
