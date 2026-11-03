const BASE = (import.meta.env.VITE_API_URL || "http://localhost:3000").replace(/\/$/, "");

async function request(path, options) {
  const r = await fetch(BASE + path, options);
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(data.error || `Error ${r.status}`), { data });
  return data;
}

export const getLogins = () => request("/logins");
export const getHealth = () => request("/health");
export const postLogin = (email) =>
  request("/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) });
