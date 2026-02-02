import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useAuthStore, useClassStore } from "../../session/store";

import profile from "./../useProfile";

const gateway = import.meta.env.VITE_GATEWAY || "/api/auth";

const useLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const setRole = useAuthStore((s) => s.setRole);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch(`${gateway}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password }),
      });

      const { data } = await res.json();
      if (!res.ok) throw new Error(data?.message || "Login failed");

      const { passChange, role } = data;
      setRole(role);

      if (!passChange) {
        navigate("/first-login");
        return;
      }
      await profile();


      const rolePaths = {
        teacher: "/teacher",
        student: "/student",
      };
      navigate(rolePaths[role] || "/");

      // Nếu cần cập nhật profile sau đăng nhập:
      // await classData()
      return { ok: true };
    } catch (err) {
      console.error(err);
      return { ok: false, message: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { loading, login };
};

export default useLogin;
