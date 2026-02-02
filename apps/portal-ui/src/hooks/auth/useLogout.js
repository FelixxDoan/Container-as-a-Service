import { useAuthStore } from "../../session/store";

const gateway = import.meta.env.VITE_GATEWAY || "/api/auth";

export async function logout() {
  try {
    await fetch(`${gateway}/logout`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });
  } finally {
    useAuthStore.getState().clearAuth();
  }
}
