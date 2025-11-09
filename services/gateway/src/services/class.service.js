// gateway/src/services/user.service.js
const class_service =
  process.env.CLASS_SERVICE || "http://localhost:3004/class";

export const allClassService = async () => {
  const url = `${class_service}/all`;
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

export const finClassService = async (code) => {
  const url = `${class_service}/${code}`;
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
}

export const actionClassByRoleService = async ({ action, role, code, sub }) => {
  const url = `${class_service}/${code}/${action}`;
  const r = await fetch(url, {
    method: "POST",
    headers: {
      "X-User-Role": role,
      "X-User-Profile": sub,
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
