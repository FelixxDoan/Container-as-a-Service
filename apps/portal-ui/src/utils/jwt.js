export function parseJwt(token) {
  try {
    const payload = token?.split(".")[1];
    if (!payload) return null;
    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "===".slice((base64.length + 3) % 4);
    const json = atob(padded);
    const utf8 = decodeURIComponent(
      Array.from(json).map(c => `%${c.charCodeAt(0).toString(16).padStart(2,"0")}`).join("")
    );
    return JSON.parse(utf8);
  } catch {
    return null;
  }
}
