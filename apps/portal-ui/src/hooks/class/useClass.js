const gateway = import.meta.env.VITE_GATEWAY || "/api/class";

export function useEnrollment() {

  const action = async (classCode, action ) => {
    const res = await fetch(`${gateway}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ classCode, action }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data?.message || "Không thể đăng ký lớp.");
    return data; // nếu backend trả message/data thì trả ra cho UI dùng
  };

  return { action };
}
