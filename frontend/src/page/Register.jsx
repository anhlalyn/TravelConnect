import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Building2, Lock, Mail, Navigation, User } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import AnimatedPage from "../components/AnimatedPage";
import { TRAVEL_INTEREST_OPTIONS } from "../constants/explore";
import { saveVerifyOtpContext } from "../utils/authFlowStorage";

const Register = () => {
  const [formData, setFormData] = useState({
    ten: "",
    email: "",
    mat_khau: "",
    vai_tro: "khach_du_lich",
    so_thich_json: [],
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const toggleInterest = (interest) => {
    setFormData((prev) => {
      const exists = prev.so_thich_json.includes(interest);
      return {
        ...prev,
        so_thich_json: exists
          ? prev.so_thich_json.filter((item) => item !== interest)
          : [...prev.so_thich_json, interest],
      };
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        so_thich_json:
          formData.vai_tro === "khach_du_lich" ? formData.so_thich_json : [],
      };

      const res = await api.post("/auth/register", payload);
      toast.success(res.data.message || "Đăng ký thành công!");
      saveVerifyOtpContext({ email: formData.email, type: "register", payload });
      navigate("/verify-otp", {
        state: { email: formData.email, type: "register" },
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatedPage>
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F1F5F9] p-4">
        <div className="absolute right-[-10%] top-[-10%] h-96 w-96 rounded-full bg-indigo-200/50 blur-[100px]" />

        <div className="relative z-10 w-full max-w-2xl">
          <div className="mb-8 text-center">
            <div className="mb-4 inline-flex rounded-2xl bg-white p-3 text-indigo-600 shadow-xl">
              <Navigation size={28} fill="currentColor" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter text-slate-800">
              Tham gia TravelConnect
            </h2>
            <p className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              Tạo hồ sơ phù hợp đúng nhu cầu khám phá của bạn
            </p>
          </div>

          <div className="rounded-[3rem] border border-white bg-white p-10 shadow-2xl shadow-slate-200">
            <div className="mb-8 flex rounded-[1.5rem] border border-slate-100 bg-slate-50 p-1.5">
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, vai_tro: "khach_du_lich" }))
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] py-3 text-[11px] font-black uppercase tracking-tighter transition-all ${
                  formData.vai_tro === "khach_du_lich"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <User size={14} /> Khách du lịch
              </button>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({ ...prev, vai_tro: "khu_du_lich" }))
                }
                className={`flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] py-3 text-[11px] font-black uppercase tracking-tighter transition-all ${
                  formData.vai_tro === "khu_du_lich"
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                <Building2 size={14} /> Khu du lịch
              </button>
            </div>

            <form onSubmit={handleRegister} className="space-y-5">
              <div className="group relative">
                <User
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                  size={18}
                />
                <input
                  type="text"
                  placeholder={
                    formData.vai_tro === "khu_du_lich"
                      ? "Tên khu du lịch / doanh nghiệp"
                      : "Họ và tên của bạn"
                  }
                  className="w-full rounded-2xl border-2 border-transparent bg-slate-50 py-4 pl-14 pr-6 font-bold text-slate-700 outline-none transition-all focus:border-indigo-100 focus:bg-white"
                  required
                  value={formData.ten}
                  onChange={(e) =>
                    setFormData({ ...formData, ten: e.target.value })
                  }
                />
              </div>

              <div className="group relative">
                <Mail
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                  size={18}
                />
                <input
                  type="email"
                  placeholder="Địa chỉ email"
                  className="w-full rounded-2xl border-2 border-transparent bg-slate-50 py-4 pl-14 pr-6 font-bold text-slate-700 outline-none transition-all focus:border-indigo-100 focus:bg-white"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div className="group relative">
                <Lock
                  className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-indigo-600"
                  size={18}
                />
                <input
                  type="password"
                  placeholder="Mật khẩu bảo mật"
                  className="w-full rounded-2xl border-2 border-transparent bg-slate-50 py-4 pl-14 pr-6 font-bold text-slate-700 outline-none transition-all focus:border-indigo-100 focus:bg-white"
                  required
                  value={formData.mat_khau}
                  onChange={(e) =>
                    setFormData({ ...formData, mat_khau: e.target.value })
                  }
                />
              </div>

              {formData.vai_tro === "khach_du_lich" && (
                <div className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6">
                  <p className="mb-4 text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                    Bạn quan tâm nội dung nào?
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {TRAVEL_INTEREST_OPTIONS.map((interest) => {
                      const active = formData.so_thich_json.includes(interest);
                      return (
                        <button
                          key={interest}
                          type="button"
                          onClick={() => toggleInterest(interest)}
                          className={`rounded-full border px-4 py-2.5 text-xs font-black transition-all ${
                            active
                              ? "border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-100"
                              : "border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                          }`}
                        >
                          {interest}
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-400">
                    Các mục này sẽ dùng để gợi ý bài viết phù hợp hơn ở trang khám phá.
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-indigo-600 py-5 text-xs font-black uppercase tracking-[0.2em] text-white shadow-xl shadow-indigo-100 transition-all active:scale-95 hover:bg-slate-900 disabled:opacity-50"
              >
                {loading ? "Đang xử lý..." : <>Tạo tài khoản ngay <ArrowRight size={18} /></>}
              </button>
            </form>

            <p className="mt-8 text-center text-sm font-medium text-slate-400">
              Đã có tài khoản?{" "}
              <Link to="/login" className="font-black text-indigo-600 hover:underline">
                Đăng nhập
              </Link>
            </p>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Register;
