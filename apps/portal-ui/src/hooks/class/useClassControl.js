// src/hooks/useFindClasses.js

// trỏ thẳng tới gateway (KHÔNG qua 5173)
const gateway = import.meta.env.VITE_GATEWAY || "/api/room";

export function useClassControl() {
  const startClass = async ({ code, ref_students, type }) => {
    try {
      const res = await fetch(`${gateway}/up-class`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ref_students, type }),
      });

      if (!res.ok) throw new Error("Get class failed");
      const data = await res.json();
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };

  const stopClass = async ({ code, type }) => { 
    try {
      const res = await fetch(`${gateway}/down-class`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, type }),
      });

      if (!res.ok) throw new Error("Get class failed");
      const data = await res.json();
      return data;
    } catch (error) {
      console.log(error);
      throw error;
    }
  };
  return { startClass, stopClass };
}
