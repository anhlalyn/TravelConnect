import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import {
  clearResetPasswordContext,
  getResetPasswordContext,
  saveResetPasswordContext,
} from "../utils/authFlowStorage";

const ResetPassword = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const storedContext = getResetPasswordContext();
  const resetContext = useMemo(
    () => (state?.email && state?.otp ? state : storedContext),
    [state, storedContext],
  );

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (state?.email && state?.otp) {
      saveResetPasswordContext({ email: state.email, otp: state.otp });
      return;
    }

    if (!resetContext?.email || !resetContext?.otp) {
      toast.error("Phiên đặt lại mật khẩu đã hết, vui lòng thao tác lại.");
      navigate("/forgot-password");
    }
  }, [navigate, resetContext?.email, resetContext?.otp, state]);

  const handleReset = async (e) => {
    e.preventDefault();

    if (!resetContext?.email || !resetContext?.otp) {
      toast.error("Không tìm thấy thông tin xác thực để đặt lại mật khẩu.");
      navigate("/forgot-password");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    if (password.length < 6) {
      toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/reset-password", {
        email: resetContext.email,
        otp: resetContext.otp,
        mat_khau_moi: password,
      });

      clearResetPasswordContext();
      toast.success(res.data?.message || "Đặt lại mật khẩu thành công.");
      setSuccess(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Đã có lỗi xảy ra, vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] p-4">
        <div className="absolute left-[-5%] top-[-5%] h-80 w-80 rounded-full bg-indigo-200/40 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <div className="space-y-8 rounded-[3rem] border border-white bg-white p-10 shadow-2xl shadow-slate-200">
            <div className="space-y-3 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                <Lock size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-slate-800">
                {success ? "Cập nhật thành công" : "Mật khẩu mới"}
              </h2>
              <p className="px-4 text-sm font-medium leading-relaxed text-slate-400">
                {success ? (
                  "Mật khẩu của bạn đã được cập nhật. Vui lòng chọn tiếp tục để đăng nhập."
                ) : (
                  <>
                    Thiết lập mật khẩu mới cho tài khoản
                    <br />
                    <span className="font-bold text-indigo-600">{resetContext?.email}</span>
                  </>
                )}
              </p>
            </div>

            {success ? (
              <button
                type="button"
                onClick={() => navigate("/login")}
                className="flex w-full items-center justify-center gap-3 rounded-[1.8rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900"
              >
                Tiếp tục đăng nhập <ArrowRight size={18} />
              </button>
            ) : (
              <form onSubmit={handleReset} className="space-y-8">
                <div className="space-y-4">
                  <div className="group space-y-2">
                    <label className="ml-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Mật khẩu mới
                    </label>
                    <div className="relative">
                      <input
                        type={showPass ? "text" : "password"}
                        value={password}
                        className="w-full rounded-[1.8rem] border-2 border-transparent bg-slate-50 py-5 pl-6 pr-12 font-bold text-slate-700 shadow-inner outline-none transition-all focus:border-indigo-100 focus:bg-white"
                        placeholder="Nhập mật khẩu ít nhất 6 ký tự"
                        required
                        onChange={(e) => setPassword(e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPass((prev) => !prev)}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600"
                      >
                        {showPass ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="ml-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                      Xác nhận lại
                    </label>
                    <input
                      type={showPass ? "text" : "password"}
                      value={confirmPassword}
                      className="w-full rounded-[1.8rem] border-2 border-transparent bg-slate-50 px-6 py-5 font-bold text-slate-700 shadow-inner outline-none transition-all focus:border-indigo-100 focus:bg-white"
                      placeholder="Nhập lại mật khẩu phía trên"
                      required
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-3 rounded-[1.8rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900 disabled:opacity-50"
                >
                  {loading ? "Đang xử lý..." : <>Hoàn tất đổi mật khẩu <ArrowRight size={18} /></>}
                </button>
              </form>
            )}

            <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-slate-300">
              <ShieldCheck size={14} className="text-emerald-500/50" /> Bảo mật thông tin đa lớp
            </p>
          </div>
        </div>
      </div>
  );
};

export default ResetPassword;
