// src/hooks/useFindClasses.js
import { useCallback, useEffect, useState } from "react";

// trỏ thẳng tới gateway (KHÔNG qua 5173)
const gateway = import.meta.env.VITE_GATEWAY || "/api/subject";

export function useFindClasses(ids) {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(Boolean(ids?.length));
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    if (!Array.isArray(ids) || ids.length === 0) {
      setClasses([]);
      setLoading(false);
      setError("");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const uniqueIds = [...new Set(ids.map(String))];

      const results = await Promise.allSettled(
        uniqueIds.map(async (id) => {
          const res = await fetch(`${gateway}/find?id=${id}`, {
            method: "GET",
            credentials: "include",
          });
          const { data } = await res.json().catch(() => ({}));
          if (!res.ok)
            throw new Error(data?.message || `Không tìm được lớp ${id}`);

          if (Array.isArray(data?.classes)) return data.classes[0] ?? null;
          if (data?.class) return data.class;
          return data; // object trực tiếp
        })
      );

      const ok = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => r.value);
      setClasses(ok);

      const fails = results.filter((r) => r.status === "rejected").length;
      if (fails) setError(`Không tải được ${fails}/${uniqueIds.length} lớp.`);
    } catch (e) {
      setError(e.message || "Lỗi khi tải lớp.");
      setClasses([]);
    } finally {
      setLoading(false);
    }
  }, [ids]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);
  return { classes, loading, error, refetch: fetchAll };
}
