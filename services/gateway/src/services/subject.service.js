const subject_service =
  process.env.SUBJECT_SERVICE || "http://localhost:3004/subject";

export const findSubjectService = async (id) => {
  const url = `${subject_service}/find?id=${id}`;
  const r = await fetch(url, {
    method: "GET",
  });

  const text = await r.text();
  const data = text ? JSON.parse(text) : null;

  if (!r.ok) {
    const message = (data && data.message) || `User service error ${r.status}`;
    const err = new Error(message);
    err.httpStatus = r.status;
    err.payload = data;
    throw err;
  }
  return { status: r.status || 200, data };
};