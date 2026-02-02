import { useAuthStore } from "./store";

const auth_service = import.meta.env.API_GATEWAY_SERVICE || "http://localhost:3001";
const LEAD_MS = 60_000;
const SKEW_MS = 10_000;
let REFRESH_PROMISE = null;

function parseJwt(token) {
  try {
    const [, body] = token.split(".");
    return JSON.parse(atob(body));
  } catch {
    return null;
  }
}

async function doRefreshOnce() {
  const res = await fetch(`${auth_service}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.data?.accessToken || data?.accessToken || null;
}

export function refreshAccessToken() {
  if (!REFRESH_PROMISE) {
    REFRESH_PROMISE = (async () => {
      const newAT = await doRefreshOnce();
      if (newAT) {
        useAuthStore.getState().setAuth(newAT);
      } else {
        useAuthStore.getState().clearAuth();
      }
      return newAT;
    })().finally(() => {
      REFRESH_PROMISE = null;
    });
  }
  return REFRESH_PROMISE;
}

export async function ensureValidAccessToken() {
  const at = useAuthStore.getState().accessToken;
  if (!at) return await refreshAccessToken();

  const payload = parseJwt(at);
  const expMs = payload?.exp ? payload.exp * 1000 : 0;
  const now = Date.now() + SKEW_MS;

  if (!expMs || expMs - now <= LEAD_MS) {
    return await refreshAccessToken();
  }
  return at;
}
