import React from "react";
import { useAuthStore } from "../../session/store";
import {
  User,
  Mail,
  Calendar,
  CheckCircle2,
  XCircle,
  GraduationCap,
  BookOpen,
  Users,
  Key,
} from "lucide-react";

/**
 * UI hồ sơ giảng viên – đồng bộ phong cách với Profile sinh viên
 * nhưng có khác biệt về thông tin hiển thị:
 * - Hiển thị trạng thái yêu cầu đổi mật khẩu (passChange)
 * - Danh sách môn phụ trách (subject[])
 * - Số lớp giảng dạy (ref_class.length)
 */
export default function TeacherProfile() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);
  if (!user) {
    return (
      <div className="bg-white rounded-2xl shadow p-4">Đang tải hồ sơ…</div>
    );
  }

  const accountEmail = user.email ?? "-";
  const isActive = user.isActive ?? true;
  const dob = user.dob ? new Date(user.dob).toLocaleDateString("vi-VN") : "-";

  const genderMap = {
    male: "Nam",
    female: "Nữ",
    other: "Khác",
  };
  const gender = genderMap[user.gender] || "-";

  const subjects = Array.isArray(user.subject) ? user.subject : [];
  const classCount = Array.isArray(user.ref_class) ? user.ref_class.length : 0;

  const passChange = Boolean(user.passChange);

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-2xl mx-auto">
      {/* Banner trạng thái mật khẩu (khác biệt so với sinh viên) */}
      {passChange && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3">
          <Key className="w-5 h-5 shrink-0" />
          <div>
            <p className="font-medium">Yêu cầu đổi mật khẩu</p>
            <p className="text-sm text-slate-600">
              Tài khoản của bạn đang được đánh dấu cần đổi mật khẩu. Vui lòng cập nhật để đảm bảo an toàn.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-purple-100 rounded-full p-3">
          <GraduationCap className="text-purple-700 w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-slate-500 capitalize">
            {role || "teacher"}
          </p>
        </div>
        <span
          className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"
          }`}
        >
          {isActive ? "Đang hoạt động" : "Ngưng"}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-3 text-slate-700 text-sm">
        <p className="flex items-center gap-2">
          <Mail size={16} className="text-slate-500" /> {accountEmail}
        </p>
        <p className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" /> Ngày sinh: {dob}
        </p>
        <p className="flex items-center gap-2">
          {isActive ? (
            <CheckCircle2 size={16} className="text-green-600" />
          ) : (
            <XCircle size={16} className="text-red-600" />
          )}
          Giới tính: {gender}
        </p>

        {/* Môn phụ trách (khác biệt so với sinh viên) */}
        <div className="flex items-start gap-2">
          <BookOpen size={16} className="text-slate-500 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">Môn phụ trách</span>
              <span className="text-xs text-slate-500">
                {subjects.length} môn
              </span>
            </div>
            {subjects.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {subjects.map((subj, idx) => (
                  <span
                    key={`${subj}-${idx}`}
                    className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-xs"
                  >
                    {subj}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">-</p>
            )}
          </div>
        </div>

        {/* Lớp đang giảng dạy */}
        <div className="flex items-center gap-2">
          <Users size={16} className="text-slate-500" />
          <span>
            Số lớp đang giảng dạy: <b>{classCount}</b>
          </span>
        </div>

        {/* Tùy chọn hiển thị thêm danh sách classId nếu cần */}
        {classCount > 0 && (
          <div className="pl-6">
            <ul className="list-disc list-inside text-slate-600 space-y-1">
              {user.ref_class.slice(0, 5).map((cid, i) => (
                <li key={cid} className="truncate">
                  <span className="font-mono text-xs">{cid}</span>
                  {i === 4 && user.ref_class.length > 5 && (
                    <span className="text-xs text-slate-400"> …và còn nữa</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Footer nhỏ để phân biệt thêm */}
      <div className="text-[12px] text-slate-500 border-t pt-3">
        <p className="flex items-center gap-2">
          <User size={14} /> Hồ sơ giảng viên – phiên bản dành cho quản lý lớp & môn.
        </p>
      </div>
    </div>
  );
}
