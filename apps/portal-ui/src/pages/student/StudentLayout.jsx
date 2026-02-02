// src/layouts/StudentLayout.jsx
import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../hooks/auth/useLogout";

import { useAuthStore } from "../../session/store";
import fetchProfile from "../../hooks/useProfile"; // hàm async lấy profile và set vào store

/** Lấy object profile cho student từ store.user, bất kể shape */
function pickProfile(user) {
  if (!user) return null;
  // Trường hợp user đầy đủ: { ..., role, ref_profile: {...} }
  if (user.ref_profile && typeof user.ref_profile === "object") {
    return user.ref_profile;
  }
  // Trường hợp user chính là ref_profile đã populate
  // Dấu hiệu: có các field đặc trưng của profile
  const looksLikeProfile =
    typeof user === "object" &&
    ("name" in user || "isActive" in user || "ref_submit" in user);
  if (looksLikeProfile) return user;

  return null;
}

export default function StudentLayout() {
  const nav = useNavigate();

  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user) ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Rút gọn object profile (hoặc null nếu chưa có)
  const studentProfile = useMemo(() => pickProfile(user), [user]);

  // Tên hiển thị: ưu tiên tên trong profile, sau đó email trong profile, rồi đến email trong user (nếu có)
  const displayName =
    studentProfile?.name ?? studentProfile?.email ?? user?.email ?? "";

  // Khi vào layout student mà chưa có profile -> tự fetch
  useEffect(() => {
    let mounted = true;

    async function ensureProfile() {
      // Chỉ fetch khi đúng role student và chưa có profile
      if (role !== "student" || studentProfile) return;
      setLoading(true);
      setError("");
      try {
        await fetchProfile(); // sẽ setStore user/ref_profile bên trong
      } catch (e) {
        if (mounted) setError("Không thể tải hồ sơ");
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    ensureProfile();
    return () => {
      mounted = false;
    };
  }, [role, studentProfile]);

  async function handleLogout() {
    try {
      await logout();
      nav("/login");
    } catch (e) {
      console.error(e);
    }
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr]">
      <header className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold">Student Portal</h1>

          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-slate-500 text-sm italic">
                Đang tải hồ sơ…
              </span>
            ) : error ? (
              <button
                onClick={fetchProfile}
                className="text-rose-600 text-sm underline underline-offset-2"
                title="Thử tải lại hồ sơ"
              >
                Không thể tải hồ sơ — Thử lại
              </button>
            ) : (
              <span className="text-slate-700">{displayName}</span>
            )}
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-lg border hover:bg-slate-50"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6 grid md:grid-cols-[220px_1fr] gap-6 w-full">
        <nav className="bg-white rounded-2xl shadow p-3 h-fit sticky top-20">
          <ul className="space-y-1 text-sm">
            <li>
              <NavLink
                to="profile"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"
                  }`
                }
              >
                Hồ sơ
              </NavLink>
            </li>
            <li>
              <NavLink
                to="exam"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"
                  }`
                }
              >
                Học
              </NavLink>
            </li>
            <li>
              <NavLink
                to="learning"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"
                  }`
                }
              >
                Danh sách lớp
              </NavLink>
            </li>
          </ul>
        </nav>

        <main className="min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
