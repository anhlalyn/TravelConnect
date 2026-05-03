import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail, Navigation, Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";

const Login = ({ setUser }) => {
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [statusMessage, setStatusMessage] = useState("");
  const navigate = useNavigate();

  const validateForm = () => {
    const nextErrors = {};
    const normalizedAccount = account.trim().toLowerCase();

    if (!normalizedAccount) {
      nextErrors.account = "Vui lòng nhập tài khoản đăng nhập.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedAccount)) {
      nextErrors.account = "Tài khoản hiện tại sử dụng định dạng email.";
    }

    if (!password.trim()) {
      nextErrors.password = "Vui lòng nhập mật khẩu.";
    } else if (password.length < 6) {
      nextErrors.password = "Mật khẩu phải có ít nhất 6 ký tự.";
    }

    setErrors(nextErrors);
    return { isValid: Object.keys(nextErrors).length === 0, normalizedAccount };
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const { isValid, normalizedAccount } = validateForm();

    if (!isValid) {
      setStatusMessage("Thông tin đăng nhập chưa hợp lệ. Vui lòng kiểm tra lại.");
      return;
    }

    setLoading(true);
    setStatusMessage("Đang kiểm tra tài khoản và mật khẩu...");

    try {
      const res = await api.post("/auth/login", {
        email: normalizedAccount,
        mat_khau: password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      window.dispatchEvent(new Event("auth-change"));
      setUser(res.data.user);
      setErrors({});
      setStatusMessage("Đăng nhập thành công. Hệ thống đang chuyển hướng...");

      toast.success("Đăng nhập thành công!");
      navigate("/home");
    } catch (err) {
      const message = err.response?.data?.message || "Sai tài khoản hoặc mật khẩu.";
      setStatusMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] p-4">
      <div className="absolute left-[-10%] top-[-10%] h-96 w-96 rounded-full bg-indigo-200/50 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-blue-200/50 blur-[100px]" />

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-4 rotate-3 rounded-2xl bg-indigo-600 p-3 text-white shadow-xl shadow-indigo-200">
            <Navigation size={32} fill="currentColor" />
          </div>
          <h1 className="text-3xl font-black italic tracking-tighter text-slate-800">
            TravelConnect
          </h1>
          <p className="mt-2 text-xs font-bold uppercase tracking-[0.2em] text-slate-400">
            Bắt đầu hành trình mới
          </p>
        </div>

        <form
          onSubmit={handleLogin}
          className="space-y-6 rounded-[3rem] border border-white bg-white p-10 shadow-2xl shadow-slate-200"
        >
          <div className="space-y-2 pb-2 text-center">
            <h2 className="text-2xl font-black tracking-tight text-slate-800">Đăng nhập</h2>
            <p className="text-sm font-medium italic text-slate-400">
              Vui lòng nhập thông tin tài khoản của bạn
            </p>
          </div>

          {statusMessage && (
            <div className="rounded-[1.5rem] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-bold text-blue-700">
              {statusMessage}
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="ml-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                Tài khoản đăng nhập
              </label>
              <div className="group relative">
                <Mail
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                  size={20}
                />
                <input
                  type="email"
                  placeholder="name@example.com"
                  value={account}
                  className={`w-full rounded-[1.5rem] border-2 bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-700 shadow-inner outline-none transition-all focus:bg-white ${
                    errors.account
                      ? "border-red-200 focus:border-red-300"
                      : "border-transparent focus:border-indigo-100"
                  }`}
                  required
                  onChange={(e) => {
                    setAccount(e.target.value);
                    setErrors((prev) => ({ ...prev, account: "" }));
                  }}
                />
              </div>
              {errors.account && <p className="px-4 text-xs font-bold text-red-500">{errors.account}</p>}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between px-4">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Mật khẩu
                </label>
                <Link
                  to="/forgot-password"
                  className="text-[10px] font-bold uppercase text-indigo-500 transition-colors hover:text-indigo-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>
              <div className="group relative">
                <Lock
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                  size={20}
                />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  className={`w-full rounded-[1.5rem] border-2 bg-slate-50 py-4 pl-12 pr-4 font-bold text-slate-700 shadow-inner outline-none transition-all focus:bg-white ${
                    errors.password
                      ? "border-red-200 focus:border-red-300"
                      : "border-transparent focus:border-indigo-100"
                  }`}
                  required
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setErrors((prev) => ({ ...prev, password: "" }));
                  }}
                />
              </div>
              {errors.password && <p className="px-4 text-xs font-bold text-red-500">{errors.password}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900 disabled:opacity-50"
          >
            {loading ? "Đang xác thực..." : <>Đăng nhập ngay <ArrowRight size={18} /></>}
          </button>

          <div className="pt-4 text-center">
            <p className="text-sm font-medium text-slate-400">
              Bạn mới đến đây?{" "}
              <Link
                to="/register"
                className="inline-flex items-center gap-1 font-black text-indigo-600 transition-colors hover:text-indigo-800"
              >
                Đăng ký tài khoản <Sparkles size={14} />
              </Link>
            </p>
          </div>
        </form>

        <p className="mt-10 text-center text-[10px] font-bold uppercase tracking-widest text-slate-400">
          &copy; 2026 TravelConnect Ecosystem
        </p>
      </div>
    </div>
  );
};

export default Login;
