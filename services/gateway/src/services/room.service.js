// gateway/src/services/user.service.js
const room_service = process.env.ROOM_SERVICE || "http://localhost:3004/room";

export const upClassService = async ({ classId, students, type }) => {
  const url = `${room_service}/up-class`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ classId, students, type }),
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

export const downClassService = async ({classId, type}) => {
  const url = `${room_service}/down-class?classId=${classId}&type=${type}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
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
