// src/hooks/auth/useChangePass.js
import { useState } from "react";
import { logout } from "./useLogout";
import { useNavigate } from "react-router-dom";

// Có thể cấu hình qua .env cho linh hoạt
const gateway = import.meta.env.VITE_USER_GATEWAY || "/api/user";

const useChangePass = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const changePass = async ({ newPass, currPass }) => {
    setLoading(true);
    try {
      // 1) Đổi mật khẩu
      await fetch(`${gateway}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ newPass, currPass }),
      });

      await logout();
        navigate("/login");

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return { loading, changePass };
};

export default useChangePass;
