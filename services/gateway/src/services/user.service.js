// gateway/src/services/user.service.js
const user_service = process.env.USER_SERVICE || "http://localhost:3003/user";

// Lấy hồ sơ (user-service)
export const userProfileService = async (sub) => {
  const url = `${user_service}/profile`;
  const r = await fetch(url, {
    method: "GET",
    headers: { "X-User-Id": sub, "Content-Type": "application/json" },
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

export const userChangePassService = async ({ user_id, currPass, newPass }) => {
  if (!currPass || !newPass) {
    const err = new Error("Missing params");
    err.httpStatus = 400;
    throw err;
  }

  const url = `${user_service}/change-password`;

  const r = await fetch(url, {
    method: "PUT",
    headers: {
      "X-User-Id": user_id,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ currPass, newPass }),
  });

  const text = await r.text();
  const data = text ? JSON.parse(text) : null;

  if (!r.ok) {
    const message = (data && data.message) || `Change pass error ${r.status}`;
    const err = new Error(message);
    err.httpStatus = r.status;
    err.payload = data;
    throw err;
  }

  return { status: r.status || 200, data };
};
