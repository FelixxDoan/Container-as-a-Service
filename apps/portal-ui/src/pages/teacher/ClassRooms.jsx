import React, { useMemo, useState } from "react";
import { useAuthStore } from "../../session/store";
import { useFindClasses } from "../../hooks/class/useFindClasses";
import { useClassControl } from "../../hooks/class/useClassControl";

const HOST = import.meta.env.VITE_CLASS_HOST || "http://localhost";

/** ---------- UI atoms ---------- */
function Badge({ children, tone = "slate" }) {
  const tones = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    red: "bg-rose-50 text-rose-700 ring-rose-200",
    slate: "bg-slate-50 text-slate-700 ring-slate-200",
    amber: "bg-amber-50 text-amber-700 ring-amber-200",
    indigo: "bg-indigo-50 text-indigo-700 ring-indigo-200",
  };

  return (
    <span
      className={[
        "inline-flex items-center gap-1",
        "px-2 py-0.5 rounded-full text-[11px] ring-1",
        "whitespace-nowrap",
        tones[tone] || tones.slate,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
  tone = "primary",
  title,
  className = "",
}) {
  const tones = {
    primary:
      "bg-emerald-600 hover:bg-emerald-700 text-white ring-emerald-700/20",
    danger: "bg-rose-600 hover:bg-rose-700 text-white ring-rose-700/20",
    neutral:
      "bg-indigo-600 hover:bg-indigo-700 text-white ring-indigo-700/20",
    ghost:
      "bg-white hover:bg-slate-50 text-slate-700 ring-slate-200 border border-slate-200",
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={[
        "h-9 px-3 rounded-xl text-sm font-medium",
        "shadow-sm ring-1",
        "transition-colors whitespace-nowrap",
        "disabled:opacity-60 disabled:cursor-not-allowed",
        tones[tone] || tones.primary,
        className,
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function SectionRow({
  icon,
  label,
  isOn,
  port,
  working,
  disabledAll,
  onOpen,
  onStart,
  onStop,
  openTitle,
  startTitle,
}) {
  const canOpen = Boolean(port);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
        {/* LEFT */}
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <div className="font-semibold text-slate-900">{label}</div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge tone={isOn ? "green" : "slate"}>
              {isOn ? "Đang mở" : "Đã đóng"}
            </Badge>

            {port ? (
              <Badge tone="indigo">Port: {port}</Badge>
            ) : (
              <Badge tone="red">Chưa cấu hình port</Badge>
            )}

            {disabledAll && <Badge tone="amber">Bị vô hiệu hóa</Badge>}
          </div>
        </div>

        {/* RIGHT (actions: luôn xếp dọc để không tràn) */}
        <div className="flex flex-col gap-2 sm:items-end">
          {isOn ? (
            <>
              <ActionButton
                tone="ghost"
                onClick={onOpen}
                disabled={!canOpen}
                title={openTitle}
                className="w-full sm:w-auto"
              >
                Mở
              </ActionButton>

              <ActionButton
                tone="danger"
                onClick={onStop}
                disabled={working}
                className="w-full sm:w-auto"
              >
                {working ? "Đang dừng…" : "Dừng"}
              </ActionButton>
            </>
          ) : (
            <ActionButton
              tone="primary"
              onClick={onStart}
              disabled={working || disabledAll}
              title={startTitle}
              className="w-full sm:w-auto"
            >
              {working ? "Đang bật…" : "Khởi động"}
            </ActionButton>
          )}
        </div>
      </div>
    </div>
  );
}

/** ---------- Main ---------- */
export default function ClassRooms() {
  const user = useAuthStore((s) => s.user);

  const myClassIds = useMemo(
    () => (Array.isArray(user?.ref_class) ? user.ref_class.map(String) : []),
    [user]
  );

  const { classes, loading, error, refetch } = useFindClasses(myClassIds);
  const { startClass, stopClass } = useClassControl();

  const [busy, setBusy] = useState(null); // {id, type}

  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        Bạn chưa đăng nhập.
      </div>
    );
  }
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        Đang tải lớp học…
      </div>
    );
  }
  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow p-4 text-rose-600">
        {error}
      </div>
    );
  }
  if (!classes.length) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">
        Bạn chưa được phân công lớp.
      </div>
    );
  }

  function openRoom(port) {
    if (!port) return;
    window.open(`${HOST}:${port}/`, "_blank", "noopener,noreferrer");
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white shadow-sm p-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold text-xl flex items-center gap-2 text-slate-900">
            <span className="text-2xl">📚</span>
            <span>Lớp giảng dạy</span>
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Quản lý nhanh phòng Theory/Exam cho từng lớp (không bị tràn nút).
          </p>
        </div>

        <ActionButton tone="ghost" onClick={refetch} className="shrink-0">
          Làm mới
        </ActionButton>
      </div>

      {/* List */}
      <ul className="grid gap-5 mt-6 sm:grid-cols-2 xl:grid-cols-3">
        {classes.map((cls) => {
          const id = String(cls._id);
          const theoryOn = Boolean(cls.theoryStatus);
          const examOn = Boolean(cls.examStatus);

          const workingTheory = busy?.id === id && busy?.type === "theory";
          const workingExam = busy?.id === id && busy?.type === "exam";

          const disabledAll = cls.isActive === false;
          const studentsCount = cls.ref_students?.length || 0;

          return (
            <li
              key={id}
              className="rounded-3xl border border-slate-200 bg-white shadow-sm hover:shadow-md transition p-5"
            >
              {/* Class title */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-lg font-semibold text-slate-900 truncate">
                    {cls.name}
                  </h3>
                  <div className="mt-1 text-sm text-slate-600">
                    Mã lớp: <span className="font-medium">{cls.code}</span>
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <Badge tone="slate">
                    👥 {studentsCount}/{cls.capacity}
                  </Badge>
                  {disabledAll && <Badge tone="amber">Tạm khóa</Badge>}
                </div>
              </div>

              <div className="my-4 h-px bg-slate-100" />

              <div className="grid gap-3">
                {/* THEORY */}
                <SectionRow
                  icon="📘"
                  label="Theory"
                  isOn={theoryOn}
                  port={cls.theoryPort}
                  working={workingTheory}
                  disabledAll={disabledAll}
                  openTitle={
                    cls.theoryPort ? `${HOST}:${cls.theoryPort}/` : "Không có port"
                  }
                  startTitle={disabledAll ? "Lớp đang bị vô hiệu hóa" : undefined}
                  onOpen={() => openRoom(cls.theoryPort)}
                  onStart={() => {
                    setBusy({ id, type: "theory" });
                    startClass({
                      code: cls.code,
                      ref_students: cls.ref_students,
                      type: "theoryStatus",
                    })
                      .then(refetch)
                      .catch((e) =>
                        alert(e.message || "Không thể khởi động phòng")
                      )
                      .finally(() => setBusy(null));
                  }}
                  onStop={() => {
                    setBusy({ id, type: "theory" });
                    stopClass({ code: cls.code, type: "theoryStatus" })
                      .then(refetch)
                      .finally(() => setBusy(null));
                  }}
                />

                {/* EXAM */}
                <SectionRow
                  icon="🧪"
                  label="Exam"
                  isOn={examOn}
                  port={cls.examPort}
                  working={workingExam}
                  disabledAll={disabledAll}
                  openTitle={
                    cls.examPort ? `${HOST}:${cls.examPort}/` : "Không có port"
                  }
                  startTitle={disabledAll ? "Lớp đang bị vô hiệu hóa" : undefined}
                  onOpen={() => openRoom(cls.examPort)}
                  onStart={() => {
                    setBusy({ id, type: "exam" });
                    startClass({
                      code: cls.code,
                      ref_students: cls.ref_students,
                      type: "examStatus",
                    })
                      .then(refetch)
                      .catch((e) =>
                        alert(e.message || "Không thể khởi động phòng")
                      )
                      .finally(() => setBusy(null));
                  }}
                  onStop={() => {
                    setBusy({ id, type: "exam" });
                    stopClass({ code: cls.code, type: "examStatus" })
                      .then(refetch)
                      .finally(() => setBusy(null));
                  }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
