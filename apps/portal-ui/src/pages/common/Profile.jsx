import React from "react";
import { useAuthStore } from "../../session/store";
import {
  User,
  Mail,
  Calendar,
  CheckCircle,
  XCircle,
  BookOpen,
  FileText,
  Clock,
} from "lucide-react";

export default function Profile() {
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  if (!user) {
    return <div className="bg-white rounded-2xl shadow p-4">Đang tải hồ sơ…</div>;
  }

  const accountEmail = user.email ?? "-";
  const isActive = user.isActive ?? true;
  const dob = user.dob ? new Date(user.dob).toLocaleDateString("vi-VN") : "-";
  const enrollmentDate = user.enrollmentDate
    ? new Date(user.enrollmentDate).toLocaleDateString("vi-VN")
    : "-";

  const genderMap = {
    male: "Nam",
    female: "Nữ",
    other: "Khác",
  };
  const gender = genderMap[user.gender] || "-";

  const classCount = Array.isArray(user.ref_class) ? user.ref_class.length : 0;

  return (
    <div className="bg-white rounded-2xl shadow p-6 space-y-4 max-w-lg mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="bg-blue-100 rounded-full p-3">
          <User className="text-blue-600 w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{user.name}</h2>
          <p className="text-slate-500 capitalize">{role}</p>
        </div>
        <span
          className={`ml-auto px-3 py-1 rounded-full text-xs font-medium ${
            isActive ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
          }`}
        >
          {isActive ? "Đang hoạt động" : "Ngưng"}
        </span>
      </div>

      {/* Body */}
      <div className="space-y-2 text-slate-700 text-sm">
        <p className="flex items-center gap-2">
          <Mail size={16} className="text-slate-500" /> {accountEmail}
        </p>
        <p className="flex items-center gap-2">
          <Calendar size={16} className="text-slate-500" /> Ngày sinh: {dob}
        </p>
        <p className="flex items-center gap-2">
          <CheckCircle size={16} className="text-slate-500" /> Giới tính: {gender}
        </p>
        <p className="flex items-center gap-2">
          <Clock size={16} className="text-slate-500" /> Ngày nhập học: {enrollmentDate}
        </p>
        <p className="flex items-center gap-2">
          <BookOpen size={16} className="text-slate-500" /> Số lớp tham gia: {classCount}
        </p>
      </div>
    </div>
  );
}
