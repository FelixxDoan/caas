const auth_service = process.env.AUTH_SERVICE || "http://localhost:3001/auth";

const loginService = async ({ email, password }) => {
  const url = `${auth_service}/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && data.message) || `Auth error ${res.status}`;
    const err = new Error(message);
    err.httpStatus = res.status;
    err.payload = data;
    throw err;
  }

  return { status: res.status, data };
};

const logoutService = async (sub) => {
  const url = `${auth_service}/logout`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "X-User-Id": sub },
  });

  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  if (!res.ok) {
    const message = (data && data.message) || `Auth error ${res.status}`;
    const err = new Error(message);
    err.httpStatus = res.status;
    err.payload = data;
    throw err;
  }

  return { status: res.status, data };
};


export { loginService, logoutService };
