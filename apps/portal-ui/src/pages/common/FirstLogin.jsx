// src/pages/common/FirstLogin.jsx
import React, { useState } from "react";
import useChangePass from "../../hooks/auth/useChangePass";

export default function FirstLogin() {
  const { loading, changePass } = useChangePass();

  const [currPass, setCurrPass] = useState("");
  const [newPass, setNewPass] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    await changePass({ currPass, newPass });
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-50">
      <div className="w-full max-w-sm bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold mb-2">Đổi mật khẩu lần đầu</h1>

        <form onSubmit={onSubmit} className="grid gap-3">
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Mật khẩu hiện tại"
            type="password"
            value={currPass}
            onChange={(e) => setCurrPass(e.target.value)}
            required
            autoComplete="current-password"
            disabled={loading}
          />
          <input
            className="border rounded-xl px-3 py-2"
            placeholder="Mật khẩu mới (≥ 4 ký tự)"
            type="password"
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)}
            required
            minLength={4}
            autoComplete="new-password"
            disabled={loading}
          />
          <button
            className="bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
            disabled={loading || !currPass || !newPass}
            type="submit"
          >
            {loading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
