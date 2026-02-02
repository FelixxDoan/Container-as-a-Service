import { ensureValidAccessToken, refreshAccessToken } from "../session/token";

const API_SERVICE = import.meta.env.API_GATEWAY_SERVICE || "http://localhost:3003";

export async function apiFetch(path, opts = {}) {
  const token = await ensureValidAccessToken();

  const res = await fetch(`${API_SERVICE}${path}`, {
    ...opts,
    headers: {
      ...(opts.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      "Content-Type": "application/json",
    },
    credentials: "include",
  });

  if (res.status === 401) {
    const newAT = await refreshAccessToken();
    if (!newAT) return res;
    return fetch(`${API_SERVICE}${path}`, {
      ...opts,
      headers: {
        ...(opts.headers || {}),
        Authorization: `Bearer ${newAT}`,
        "Content-Type": "application/json",
      },
      credentials: "include",
    });
  }

  return res;
}
