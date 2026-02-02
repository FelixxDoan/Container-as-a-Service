import React, { useEffect, useMemo, useState } from "react";
import { useClassStore, useAuthStore } from "../../session/store";
import { useEnrollment } from "../../hooks/class/useClass";

export default function Learning() {
  const { classes, loading, error, fetchClasses } = useClassStore();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const { action } = useEnrollment();

  const [busy, setBusy] = useState(null);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const myClassIds = useMemo(
    () => (Array.isArray(user?.ref_class) ? user.ref_class.map(String) : []),
    [user]
  );

  const myClasses = useMemo(
    () => classes.filter((c) => myClassIds.includes(String(c._id))),
    [classes, myClassIds]
  );

  const isEnrolled = (cls) => myClassIds.includes(String(cls._id));

  const canEnroll = (cls) => {
    const count = Array.isArray(cls.ref_students) ? cls.ref_students.length : 0;
    const full = count >= Number(cls.capacity || 0);
    return cls.isActive && !full;
  };

  async function handleEnroll(cls) {
    if (!user) return alert("Vui lòng đăng nhập trước.");
    setBusy(String(cls._id));

    const prev = myClassIds;
    // optimistic update
    
    try {
      await action(cls.code, 'join'); // chỉ cần truyền code
      setUser({ ...user, ref_class: [...prev, String(cls._id)] });
    } catch (e) {
      // rollback
      setUser({ ...user, ref_class: prev });
      alert(e.message);
    } finally {
      setBusy(null);
      fetchClasses(); // làm tươi sĩ số
    }
  }

  async function handleLeave(cls) {
    if (!user) return alert("Vui lòng đăng nhập trước.");
    setBusy(String(cls._id));

    const prev = myClassIds;
    // optimistic update
    setUser({
      ...user,
      ref_class: prev.filter((id) => id !== String(cls._id)),
    });

    try {
      await action(cls.code, "leave"); // chỉ cần truyền code
    } catch (e) {
      // rollback
      setUser({ ...user, ref_class: prev });
      alert(e.message);
    } finally {
      setBusy(null);
      fetchClasses();
    }
  }
  if (loading)
    return (
      <div className="bg-white rounded-2xl shadow p-4">Đang tải lớp học…</div>
    );
  if (error)
    return (
      <div className="bg-white rounded-2xl shadow p-4 text-red-500">
        {error}
      </div>
    );

  return (
    <div className="bg-white rounded-2xl shadow p-4 grid gap-6">
      {/* Tất cả lớp */}
      <section>
        <h2 className="font-semibold text-lg">📚 Danh sách lớp học</h2>
        {classes.length === 0 ? (
          <p className="text-slate-600 mt-2">Chưa có lớp học nào.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4 mt-3">
            {classes.map((cls) => {
              const studentCount = Array.isArray(cls.ref_students)
                ? cls.ref_students.length
                : 0;
              const enrolled = isEnrolled(cls);
              const full = studentCount >= Number(cls.capacity || 0);
              const working = busy === String(cls._id);

              return (
                <li
                  key={cls._id}
                  className="border rounded-2xl p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
                        cls.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cls.isActive ? "Đang mở" : "Đã đóng"}
                    </span>
                  </div>

                  <p className="text-sm text-slate-600 mt-1">
                    Mã lớp: <span className="font-medium">{cls.code}</span>
                  </p>

                  <div className="text-sm text-slate-600 mt-2 space-y-1">
                    <p>
                      👥 Sĩ số:{" "}
                      <span className="font-medium">{studentCount}</span> /{" "}
                      <span className="font-medium">{cls.capacity}</span>
                      {full && (
                        <span className="ml-2 text-xs text-red-500">
                          (Đã đầy)
                        </span>
                      )}
                    </p>
                    <p>
                      📘 Môn học (ID):{" "}
                      <span className="font-mono">{cls.ref_subject}</span>
                    </p>
                    <p>
                      👩‍🏫 GV (ID):{" "}
                      <span className="font-mono">{cls.ref_teacher}</span>
                    </p>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    {enrolled ? (
                      <button
                        disabled={working}
                        onClick={() => handleLeave(cls)}
                        className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                      >
                        {working ? "Đang hủy…" : "Hủy đăng ký"}
                      </button>
                    ) : (
                      <button
                        disabled={working || !canEnroll(cls)}
                        onClick={() => handleEnroll(cls)}
                        className="px-3 py-1.5 text-sm rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-60"
                        title={
                          !cls.isActive
                            ? "Lớp đã đóng"
                            : full
                            ? "Lớp đã đầy"
                            : "Đăng ký lớp"
                        }
                      >
                        {working ? "Đang đăng ký…" : "Đăng ký"}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* Lớp của tôi */}
      <section>
        <h2 className="font-semibold text-lg">🎒 Lớp của tôi</h2>
        {!user ? (
          <p className="text-slate-600 mt-2">Bạn chưa đăng nhập.</p>
        ) : myClasses.length === 0 ? (
          <p className="text-slate-600 mt-2">Bạn chưa đăng ký lớp nào.</p>
        ) : (
          <ul className="grid md:grid-cols-2 gap-4 mt-3">
            {myClasses.map((cls) => {
              const studentCount = Array.isArray(cls.ref_students)
                ? cls.ref_students.length
                : 0;
              const working = busy === String(cls._id);
              return (
                <li
                  key={cls._id}
                  className="border rounded-2xl p-4 hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{cls.name}</h3>
                    <span
                      className={`ml-auto px-2 py-0.5 rounded-full text-xs ${
                        cls.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {cls.isActive ? "Đang mở" : "Đã đóng"}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">
                    Mã lớp: <span className="font-medium">{cls.code}</span>
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    👥 {studentCount}/{cls.capacity}
                  </p>

                  <div className="mt-3">
                    <button
                      disabled={working}
                      onClick={() => handleLeave(cls)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-60"
                    >
                      {working ? "Đang hủy…" : "Hủy đăng ký"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
