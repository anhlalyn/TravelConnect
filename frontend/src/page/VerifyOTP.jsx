import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, MailSearch, RefreshCw, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import AnimatedPage from "../components/AnimatedPage";
import {
  clearVerifyOtpContext,
  getVerifyOtpContext,
  saveResetPasswordContext,
  saveVerifyOtpContext,
} from "../utils/authFlowStorage";

const VerifyOTP = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const storedContext = getVerifyOtpContext();
  const otpContext = useMemo(
    () => (state?.email ? { ...storedContext, ...state } : storedContext),
    [state, storedContext],
  );

  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(null);

  useEffect(() => {
    if (state?.email && state?.type) {
      saveVerifyOtpContext({ ...storedContext, ...state });
      return;
    }

    if (!otpContext?.email || !otpContext?.type) {
      toast.error("Không tìm thấy thông tin xác thực, vui lòng thao tác lại.");
      navigate("/login");
    }
  }, [navigate, otpContext?.email, otpContext?.type, state, storedContext]);

  const handleVerify = async (e) => {
    e.preventDefault();

    if (otp.length < 6) {
      toast.error("Vui lòng nhập đủ 6 chữ số OTP.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/auth/verify-otp", {
        email: otpContext?.email,
        otp,
        type: otpContext?.type,
      });

      if (otpContext?.type === "forgot") {
        saveResetPasswordContext({ email: otpContext.email, otp });
        clearVerifyOtpContext();
        setSuccessState({
          title: "Xác thực thành công",
          message: res.data?.message || "Mã OTP hợp lệ. Vui lòng chọn tiếp tục để đặt lại mật khẩu.",
          buttonLabel: "Tiếp tục đặt lại mật khẩu",
          action: () => navigate("/reset-password", { state: { email: otpContext.email, otp } }),
        });
        return;
      }

      clearVerifyOtpContext();
      setSuccessState({
        title: "Tài khoản đã được xác thực",
        message: res.data?.message || "Tài khoản của bạn đã được xác thực, vui lòng chọn tiếp tục để đăng nhập.",
        buttonLabel: "Tiếp tục đăng nhập",
        action: () => navigate("/login"),
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Mã xác thực không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!otpContext?.email || !otpContext?.type) return;

    setLoading(true);
    try {
      if (otpContext.type === "forgot") {
        await api.post("/auth/forgot-password", { email: otpContext.email });
      } else if (otpContext.payload) {
        await api.post("/auth/register", otpContext.payload);
      } else {
        throw new Error("missing_register_payload");
      }

      toast.success("Mã OTP mới đã được gửi.");
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Không thể gửi lại mã OTP, vui lòng thử lại từ bước trước.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] p-4">
        <div className="absolute bottom-[-10%] left-[-10%] h-96 w-96 rounded-full bg-blue-200/50 blur-[100px]" />

        <div className="relative z-10 w-full max-w-md rounded-[3rem] border border-white bg-white p-10 text-center shadow-2xl shadow-slate-200">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-indigo-50 text-indigo-600 shadow-inner">
            <MailSearch size={40} />
          </div>

          {successState ? (
            <div className="space-y-6">
              <h2 className="text-2xl font-black italic tracking-tighter text-slate-800">
                {successState.title}
              </h2>
              <p className="px-4 text-sm font-medium leading-relaxed text-slate-500">
                {successState.message}
              </p>
              <button
                type="button"
                onClick={successState.action}
                className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900"
              >
                {successState.buttonLabel} <ArrowRight size={18} />
              </button>
            </div>
          ) : (
            <>
              <h2 className="mb-2 text-2xl font-black italic tracking-tighter text-slate-800">
                Xác thực tài khoản
              </h2>
              <p className="mb-8 px-4 text-sm font-medium leading-relaxed text-slate-400">
                Mã OTP gồm 6 chữ số đã được gửi đến hộp thư
                <br />
                <span className="font-black text-indigo-600">{otpContext?.email || "email của bạn"}</span>
              </p>

              <form onSubmit={handleVerify} className="space-y-8">
                <input
                  type="text"
                  maxLength="6"
                  value={otp}
                  placeholder="000000"
                  className="w-full rounded-[2rem] border-2 border-transparent bg-slate-50 p-5 text-center text-5xl font-black tracking-[15px] text-indigo-600 shadow-inner outline-none transition-all placeholder:text-slate-200 focus:border-indigo-100 focus:bg-white"
                  onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                />

                <div className="space-y-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900 disabled:opacity-50"
                  >
                    {loading ? "Đang kiểm tra..." : <>Xác nhận mã <ArrowRight size={18} /></>}
                  </button>

                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 transition-colors hover:text-indigo-600 disabled:opacity-50"
                  >
                    <RefreshCw size={14} /> Gửi lại mã mới
                  </button>
                </div>
              </form>
            </>
          )}

          <p className="mt-10 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-tighter text-slate-300">
            <ShieldCheck size={14} className="text-emerald-500/50" /> Bảo mật theo tiêu chuẩn TravelConnect
          </p>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default VerifyOTP;
