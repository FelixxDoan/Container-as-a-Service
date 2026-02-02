import React, { useState } from "react";
import Spinner from "../../components/Spinner";
import useLogin from "../../hooks/auth/useLogin";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { loading, login } = useLogin();

  async function handleLogin(e) {
    e.preventDefault();
    await login(email, password);
  }

  return (
    <div className="min-h-screen grid place-items-center">
      <div className="w-full max-w-sm bg-white shadow-md rounded-2xl p-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-1">Đăng nhập</h1>
        <p className="text-slate-500 mb-6">Vào cổng học tập</p>
        <form onSubmit={handleLogin} className="grid gap-3">
          <input
            className="border rounded-xl px-3 py-2"
            name="username"
            placeholder="Tên đăng nhập"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="border rounded-xl px-3 py-2"
            name="password"
            placeholder="Mật khẩu"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button className="bg-blue-600 text-white rounded-xl py-2 hover:bg-blue-700">
            {loading ? <Spinner /> : "Đăng nhập"}
          </button>
        </form>
      </div>
    </div>
  );
}
