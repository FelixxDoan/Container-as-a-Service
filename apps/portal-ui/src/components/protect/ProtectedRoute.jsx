// src/components/protect/ProtectedRoute.jsx
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../../session/store";

export default function ProtectedRoute({ roles, children }) {
  const location = useLocation();

  // Lấy đúng kiểu boolean (đừng dùng hàm isAuthenticated trong store)
  const isAuthenticated = useAuthStore(s => Boolean(s.user));
  const role = useAuthStore(s => s.role);

  if (!isAuthenticated) {
    // chưa đăng nhập -> về /login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && roles.length > 0 && !roles.includes(role)) {
    // sai role -> về trang gốc cho RoleRedirect xử lý tiếp
    return <Navigate to="/" replace />;
  }

  // hỗ trợ cả 2 cách dùng: bọc children hoặc dùng như route element
  return children ?? <Outlet />;
}
