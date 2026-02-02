import React, { useMemo, useState, useEffect } from "react";
import { useAuthStore } from "../../session/store";
import { useFindClasses } from "../../hooks/class/useFindClasses";
import { useEnterClass } from "../../hooks/class/useEnterClass";


function toUrlFromPort(port) {
  const check = false
  if (port === undefined || port === null) return null;
  const p = String(port).trim();
  if (!/^\d+$/.test(p)) return null;
  const url = check ? `http://localhost:${p}/` : `http://192.168.1.7:${p}/`;
  return url
}

function Modal({ open, onClose, title, src }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = original;
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-2"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title || "Room"}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-[95vw] md:w-[95vw] h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute top-0 left-0 right-0 h-12 flex items-center justify-between px-4 border-b bg-white/90">
          <div className="font-medium truncate pr-4">
            {title || "Phòng học"}
          </div>
          <button
            onClick={onClose}
            className="inline-flex w-8 h-8 rounded-full hover:bg-slate-100"
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>
        {/* key để reload iframe khi src đổi */}
        <iframe key={src || "blank"} src={src || ""} title={title || "Room"} className="w-full h-full pt-12" />
      </div>
    </div>
  );
}

export default function ExamRooms() {
  const user = useAuthStore((s) => s.user);
  const { enterClass } = useEnterClass();

  const myClassIds = useMemo(
    () => (Array.isArray(user?.ref_class) ? user.ref_class.map(String) : []),
    [user]
  );

  const { classes, loading, error } = useFindClasses(myClassIds);

  const [modal, setModal] = useState({
    open: false,
    href: null,
    title: "",
    type: "theory",
    classId: null,
  });

  const closeModal = () =>
    setModal({ open: false, href: null, title: "", type: "theory", classId: null });

  if (!user)
    return <div className="bg-white rounded-2xl shadow p-4">Bạn chưa đăng nhập.</div>;
  if (loading)
    return <div className="bg-white rounded-2xl shadow p-4">Đang tải lớp của bạn…</div>;
  if (error)
    return <div className="bg-white rounded-2xl shadow p-4 text-red-500">{error}</div>;
  if (!classes.length)
    return <div className="bg-white rounded-2xl shadow p-4">Bạn chưa có lớp nào.</div>;

  // Chỉ với EXAM của Web: gọi hook để lấy URL và mở trong iframe
  const handleEnterExam = async (cls, examURL, subjName) => {
    const isWeb = /\bweb\b/i.test(cls?.name || "");
    if (isWeb) {
      try {
        const result = await enterClass(cls.code); // dùng code để dựng host *.test
        setModal({
          open: true,
          href: result.host, // URL trả về từ hook
          classId: cls._id,
          title: `${subjName || "Môn"} — ${cls?.name} (Kiểm tra)`,
          type: "exam",
        });
      } catch (e) {
        console.error(e);
        alert(e?.message || "Không thể vào phòng kiểm tra Web");
      }
      return;
    }
    // Các môn khác giữ nguyên: dùng port -> URL local
    setModal({
      open: true,
      href: examURL,
      classId: cls._id,
      title: `${subjName || "Môn"} — ${cls?.name} (Kiểm tra)`,
      type: "exam",
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow p-4 grid gap-6">
      {/* LÝ THUYẾT */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">📘 Lý thuyết</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 border border-blue-200">
            Click lớp để mở nội dung lý thuyết
          </span>
        </div>

        <ul className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
          {classes.map((cls) => {
            const theoryURL = toUrlFromPort(cls?.theoryPort);
            const canOpen = cls.theoryStatus;

            return (
              <li
                key={cls._id}
                className={`relative border rounded-2xl p-4 hover:shadow-lg transition ${
                  canOpen ? "hover:bg-slate-50" : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{cls?.name || "Môn học"}</p>
                    <p className="text-sm text-slate-500">Lớp: {cls?.name}</p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 border">
                    theoryPort: {cls?.theoryPort ?? "-"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    disabled={!canOpen}
                    onClick={() =>
                      setModal({
                        open: true,
                        href: theoryURL,
                        classId: cls._id,
                        title: `${cls?.name || "Môn"} — ${cls?.name} (Lý thuyết)`,
                        type: "theory",
                      })
                    }
                    className={`px-3 py-1.5 rounded-xl text-sm border ${
                      canOpen
                        ? "bg-indigo-600 text-white border-indigo-600 hover:bg-indigo-700"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    }`}
                  >
                    Vào phòng
                  </button>
                  <span className="text-xs text-slate-500">
                    {canOpen ? "Sẵn sàng" : "Chưa có port"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* KIỂM TRA */}
      <section>
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-lg">🧪 Kiểm tra</h2>
          <span className="text-xs px-2 py-1 rounded-full bg-rose-50 border border-rose-200">
            Click lớp để làm bài kiểm tra (có thể mở lại nhiều lần)
          </span>
        </div>

        <ul className="grid md:grid-cols-2 xl:grid-cols-3 gap-4 mt-3">
          {classes.map((cls) => {
            const subj = typeof cls.ref_subject === "object" ? cls.ref_subject : null;
            const examURL = toUrlFromPort(cls?.examPort);
            const canOpen = cls.examStatus;

            return (
              <li
                key={`${cls._id}-exam`}
                className={`relative border rounded-2xl p-4 hover:shadow-lg transition ${
                  canOpen ? "hover:bg-slate-50" : "opacity-60"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{subj?.name || "Môn học"}</p>
                    <p className="text-sm text-slate-500">Lớp: {cls?.name}</p>
                  </div>
                  <span className="text-[11px] px-2 py-1 rounded-full bg-slate-100 border">
                    examPort: {cls?.examPort ?? "-"}
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <button
                    disabled={!canOpen}
                    onClick={() => handleEnterExam(cls, examURL, subj?.name)}
                    className={`px-3 py-1.5 rounded-xl text-sm border ${
                      canOpen
                        ? "bg-blue-600 text-white border-blue-600 hover:bg-blue-700"
                        : "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed"
                    }`}
                  >
                    {/* giờ không mở tab mới nữa */}
                    Vào phòng
                  </button>
                  <span className="text-xs text-slate-500">
                    {canOpen ? "Sẵn sàng" : "Chưa có port"}
                  </span>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      <Modal
        open={modal.open}
        onClose={closeModal}
        title={modal.title}
        src={modal.href}
      />
    </div>
  );
}
