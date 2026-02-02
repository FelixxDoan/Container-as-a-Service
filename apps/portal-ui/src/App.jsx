// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// Common
import Login from "./pages/common/Login.jsx";
import FirstLogin from "./pages/common/FirstLogin.jsx";
import ProtectedRoute from "./components/protect/ProtectedRoute.jsx";
import RoleRedirect from "./components/protect/RoleRedirect.jsx";

// Student
import StudentLayout from "./pages/student/StudentLayout.jsx";
import Profile from "./pages/common/Profile.jsx";
import ExamRooms from "./pages/student/Homework.jsx";
import Learning from "./pages/student/Learning.jsx";

// Teacher (theo bộ JSX vừa xuất)
import TeacherLayout from "./pages/teacher/TeacherLayout";
import ClassRooms from "./pages/teacher/ClassRooms";
import TeacherProfile from "./pages/teacher/TeacherProfile.jsx";
import RepoViewer from "./pages/teacher/RepoViewer.jsx";

export default function App() {
  return (
    <Routes>
      {/* Auth */}
      <Route path="/login" element={<Login />} />
      <Route path="/first-login" element={<FirstLogin />} />

      {/* Trang gốc: nếu đã đăng nhập thì điều hướng theo role */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <RoleRedirect />
          </ProtectedRoute>
        }
      />

      {/* ===== Teacher ===== */}
      <Route
        path="/teacher"
        element={
          <ProtectedRoute roles={["teacher"]}>
            <TeacherLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />

        <Route path="classes" element={<Learning />} />
        <Route path="profile" element={<TeacherProfile />} />
        <Route path="classrooms" element={<ClassRooms />} />
        <Route path="repo" element={<RepoViewer />} />
      </Route>

      {/* ===== Student ===== */}
      <Route
        path="/student"
        element={
          <ProtectedRoute roles={["student"]}>
            <StudentLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="profile" replace />} />
        <Route path="profile" element={<Profile />} />
        <Route path="exam" element={<ExamRooms />} />
        <Route path="learning" element={<Learning />} />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
