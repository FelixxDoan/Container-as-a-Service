import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { logout } from "../../hooks/auth/useLogout";
import { useAuthStore } from "../../session/store";
import fetchProfile from "../../hooks/useProfile";

function pickProfile(user) {
  if (!user) return null;
  if (user.ref_profile && typeof user.ref_profile === "object") {
    return user.ref_profile;
  }
  const looksLikeProfile =
    typeof user === "object" && ("name" in user || "isActive" in user);
  return looksLikeProfile ? user : null;
}

export default function TeacherLayout() {
  const nav = useNavigate();

  const role = useAuthStore((s) => s.role);
  const user = useAuthStore((s) => s.user) ?? null;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const teacherProfile = useMemo(() => pickProfile(user), [user]);

  const displayName =
    teacherProfile?.name ?? teacherProfile?.email ?? user?.email ?? "";

  useEffect(() => {
    let mounted = true;
    async function ensureProfile() {
      if (role !== "teacher" || teacherProfile) return;
      setLoading(true);
      setError("");
      try {
        await fetchProfile();
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
  }, [role, teacherProfile]);

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
          <h1 className="font-bold">Teacher Portal</h1>
          <div className="flex items-center gap-3">
            {loading ? (
              <span className="text-slate-500 text-sm italic">
                Đang tải hồ sơ…
              </span>
            ) : error ? (
              <button
                onClick={fetchProfile}
                className="text-rose-600 text-sm underline underline-offset-2"
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
                to="classrooms"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"
                  }`
                }
              >
                Lớp học của tôi
              </NavLink>
            </li>
            <li>
                          <NavLink
                            to="classes"
                            className={({ isActive }) =>
                              `block px-3 py-2 rounded-lg ${
                                isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"
                              }`
                            }
                          >
                            Danh sách lớp
                          </NavLink>
                        </li>
            <li>
              <NavLink
                to="repo"
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-lg ${
                    isActive ? "bg-blue-600 text-white" : "hover:bg-slate-50"
                  }`
                }
              >
                Kho code
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
