// src/hooks/class/useEnterClass.js

const gateway = import.meta.env.VITE_GATEWAY || "/api/room";
const DOMAIN_SUFFIX = (import.meta.env.VITE_DOMAIN_SUFFIX || "kinghappy.id.vn")
  .trim()
  .replace(/\.$/, "")
  .toLowerCase();

/** chỉ cho DNS label an toàn: a-z0-9- */
function slug(v) {
  return String(v ?? "")
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")        // "_" và space -> "-"
    .replace(/[^a-z0-9-]+/g, "-")   // ký tự lạ -> "-"
    .replace(/-+/g, "-")            // gộp "--"
    .replace(/^-|-$/g, "");         // bỏ "-" đầu/cuối
}

/** Trả về URL để nhúng vào iframe (KHÔNG mở tab mới) */
export function useEnterClass() {
  const enterClass = async (classId) => {
    const res = await fetch(`${gateway}/enter-class`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Enter class failed");

    const { sub } = data || {};
    if (!sub) throw new Error("Missing sub from server");

    const fqdn = `${slug(sub)}-${slug(classId)}-ide.${DOMAIN_SUFFIX}`;
    const host = `https://${fqdn}`;

    console.log("host:", host);
    return { ok: true, host };
  };

  return { enterClass };
}
