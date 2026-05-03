import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import AnimatedPage from "../components/AnimatedPage";
import { saveVerifyOtpContext } from "../utils/authFlowStorage";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const navigate = useNavigate();

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post("/auth/forgot-password", { email });
      saveVerifyOtpContext({ email, type: "forgot" });
      toast.success(res.data?.message || "Mã OTP đã được gửi.");
      setOtpSent(true);
    } catch (err) {
      toast.error(err.response?.data?.message || "Email không tồn tại trên hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] p-4">
        <div className="absolute right-[-5%] top-[-5%] h-80 w-80 rounded-full bg-indigo-200/40 blur-[100px]" />
        <div className="absolute bottom-[-5%] left-[-5%] h-80 w-80 rounded-full bg-blue-200/40 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md">
          <Link
            to="/login"
            className="group mb-8 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 transition-colors hover:text-indigo-600"
          >
            <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
            Quay lại đăng nhập
          </Link>

          <div className="space-y-8 rounded-[3rem] border border-white bg-white p-10 shadow-2xl shadow-slate-200">
            <div className="space-y-3 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600 shadow-inner">
                <KeyRound size={32} />
              </div>
              <h2 className="text-2xl font-black italic tracking-tighter text-slate-800">Khôi phục mật khẩu</h2>
              <p className="px-4 text-sm font-medium leading-relaxed text-slate-400">
                {otpSent
                  ? "Mã OTP đã được gửi thành công. Vui lòng chọn tiếp tục để sang bước xác thực."
                  : "Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để bạn đặt lại mật khẩu."}
              </p>
            </div>

            {otpSent ? (
              <div className="space-y-4">
                <div className="rounded-[1.8rem] bg-slate-50 px-6 py-5 text-sm font-bold text-slate-600">
                  Email nhận mã: <span className="text-indigo-600">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => navigate("/verify-otp", { state: { email, type: "forgot" } })}
                  className="flex w-full items-center justify-center gap-3 rounded-[1.8rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900"
                >
                  Tiếp tục xác thực <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleSendOTP} className="space-y-8">
                <div className="space-y-2">
                  <label className="ml-5 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Địa chỉ email
                  </label>
                  <div className="group relative">
                    <Mail
                      className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                      size={20}
                    />
                    <input
                      type="email"
                      placeholder="name@example.com"
                      className="w-full rounded-[1.8rem] border-2 border-transparent bg-slate-50 py-5 pl-14 pr-6 font-bold text-slate-700 shadow-inner outline-none transition-all focus:border-indigo-100 focus:bg-white"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-[1.8rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900 disabled:opacity-50"
                  >
                    {loading ? "Đang gửi mã..." : <>Gửi mã xác nhận <ArrowRight size={18} /></>}
                  </button>

                  <p className="flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-slate-300">
                    <ShieldCheck size={14} className="text-emerald-500/50" /> Bảo mật thông tin người dùng
                  </p>
                </div>
              </form>
            )}
          </div>

          <p className="mt-8 text-center text-[11px] font-medium text-slate-400">
            Gặp khó khăn?{" "}
            <span className="cursor-pointer font-bold text-indigo-600 hover:underline">Liên hệ hỗ trợ</span>
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default ForgotPassword;
