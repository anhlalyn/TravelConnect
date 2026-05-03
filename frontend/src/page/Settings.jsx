import React, { useState } from "react";
import {
  AlignLeft,
  Bell,
  Camera,
  ChevronRight,
  Globe,
  Lock,
  Save,
  Smartphone,
  Sparkles,
  User,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import { buildUploadUrl } from "../config";

const Settings = ({ user, setUser }) => {
  const [activeTab, setActiveTab] = useState("profile");
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const [formData, setFormData] = useState({
    ten: user?.ten || "",
    tinh_thanh: user?.tinh_thanh || "",
    mo_ta_tong_quan: user?.mo_ta_tong_quan || "",
  });

  const [passwordData, setPasswordData] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);

    const data = new FormData();
    data.append("ten", formData.ten);
    data.append("tinh_thanh", formData.tinh_thanh);
    data.append("mo_ta_tong_quan", formData.mo_ta_tong_quan);
    if (file) data.append("anh_dai_dien", file);

    try {
      const res = await api.put("/users/profile/update", data);
      if (res.data.success) {
        toast.success("Hồ sơ đã được lưu thành công!");
        const updatedUser = {
          ...user,
          ...formData,
          anh_dai_dien: res.data.newAvatar || user.anh_dai_dien,
        };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }
    } catch {
      toast.error("Lỗi cập nhật hồ sơ.");
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      return toast.error("Vui lòng nhập đầy đủ thông tin mật khẩu.");
    }

    if (passwordData.newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp.");
    }

    setPasswordLoading(true);
    try {
      const res = await api.put("/users/change-password", {
        oldPassword: passwordData.oldPassword,
        newPassword: passwordData.newPassword,
      });

      if (res.data.success) {
        toast.success(res.data.message || "Đổi mật khẩu thành công.");
        setPasswordData({
          oldPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể đổi mật khẩu.");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
        <Navbar user={user} />

        <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 pb-20 pt-6">
          <div className="col-span-12 space-y-4 lg:col-span-4">
            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-4 shadow-sm">
              <div className="mb-2 border-b border-gray-50 p-4">
                <h2 className="flex items-center gap-2 text-xl font-black uppercase italic tracking-tighter text-slate-800">
                  <Sparkles size={20} className="text-blue-600" /> Cài đặt
                </h2>
              </div>

              <div className="space-y-1">
                {[
                  { id: "profile", icon: <User size={18} />, label: "Hồ sơ cá nhân" },
                  { id: "password", icon: <Lock size={18} />, label: "Mật khẩu và bảo mật" },
                  { id: "noti", icon: <Bell size={18} />, label: "Thông báo" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`group flex w-full items-center justify-between rounded-2xl px-6 py-4 text-sm font-bold transition-all ${
                      activeTab === item.id ? "bg-blue-50/50 text-blue-600" : "text-slate-400 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{item.icon}</span>
                      {item.label}
                    </div>
                    <ChevronRight size={14} className={activeTab === item.id ? "opacity-100" : "opacity-0"} />
                  </button>
                ))}
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-[2.5rem] bg-slate-900 p-7 text-white shadow-xl">
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest opacity-40">Tài khoản</p>
                <p className="mt-1 text-lg font-black italic tracking-tighter">
                  {user?.vai_tro === "admin"
                    ? "Quản trị hệ thống"
                    : user?.vai_tro === "khu_du_lich"
                      ? "Đối tác đã xác minh"
                      : "Khách du lịch"}
                </p>
              </div>
              <Globe
                size={100}
                className="absolute -bottom-8 -right-8 text-white/5 transition-transform duration-1000 group-hover:rotate-45"
              />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8">
            <div className="min-h-[650px] overflow-hidden rounded-[3rem] border border-gray-100 bg-white shadow-sm">
              {activeTab === "profile" && (
                <div>
                  <div className="relative h-32 bg-gradient-to-r from-blue-600 to-indigo-700" />

                  <div className="px-10 pb-10">
                    <div className="relative z-10 mb-8 -mt-12 flex flex-col items-end gap-6 md:flex-row">
                      <div className="group relative h-32 w-32 rounded-[2.5rem] bg-white p-1.5 shadow-2xl">
                        <div className="flex h-full w-full items-center justify-center overflow-hidden rounded-[2.2rem] border border-gray-100 bg-slate-100">
                          {preview ? (
                            <img src={preview} className="h-full w-full object-cover" alt="Xem trước" />
                          ) : user?.anh_dai_dien ? (
                            <img src={buildUploadUrl(user.anh_dai_dien)} className="h-full w-full object-cover" alt="Ảnh đại diện" />
                          ) : (
                            <span className="text-4xl font-black uppercase text-blue-600">
                              {user?.ten?.charAt(0)}
                            </span>
                          )}
                        </div>
                        <label className="absolute inset-2 flex cursor-pointer flex-col items-center justify-center rounded-[2rem] bg-black/60 opacity-0 transition-all duration-300 group-hover:opacity-100">
                          <Camera size={24} className="mb-1 text-white" />
                          <input type="file" hidden onChange={handleFileChange} accept="image/*" />
                        </label>
                      </div>
                      <div className="pb-2">
                        <h3 className="text-2xl font-black italic tracking-tighter text-slate-800">{user?.ten}</h3>
                        <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-blue-500">
                          <Smartphone size={12} /> Cập nhật ảnh đại diện tại đây
                        </p>
                      </div>
                    </div>

                    <form onSubmit={handleUpdateProfile} className="space-y-8">
                      <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="ml-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <User size={12} /> Họ và tên
                          </label>
                          <input
                            required
                            className="w-full rounded-2xl border border-transparent bg-slate-50 p-4 font-bold shadow-inner outline-none transition-all focus:border-blue-200 focus:bg-white"
                            value={formData.ten}
                            onChange={(e) => setFormData({ ...formData, ten: e.target.value })}
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="ml-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                            <Globe size={12} /> Tỉnh / thành phố
                          </label>
                          <input
                            className="w-full rounded-2xl border border-transparent bg-slate-50 p-4 font-bold shadow-inner outline-none transition-all focus:border-blue-200 focus:bg-white"
                            value={formData.tinh_thanh}
                            placeholder="Ví dụ: Đà Lạt"
                            onChange={(e) => setFormData({ ...formData, tinh_thanh: e.target.value })}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="ml-4 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <AlignLeft size={12} /> Giới thiệu ngắn
                        </label>
                        <textarea
                          rows="4"
                          className="w-full rounded-[2.5rem] border border-transparent bg-slate-50 p-5 text-[14px] font-bold leading-relaxed shadow-inner outline-none transition-all focus:border-blue-200 focus:bg-white"
                          value={formData.mo_ta_tong_quan}
                          onChange={(e) => setFormData({ ...formData, mo_ta_tong_quan: e.target.value })}
                          placeholder="Chia sẻ một chút về bạn hoặc khu du lịch của bạn..."
                        />
                      </div>

                      <div className="pt-4">
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-3 rounded-2xl bg-blue-600 px-12 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                          {loading ? "Đang lưu..." : <><Save size={20} /> Lưu thay đổi hồ sơ</>}
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === "password" && (
                <div className="p-10">
                  <h3 className="mb-8 text-2xl font-black italic tracking-tighter text-slate-800">
                    Bảo mật tài khoản
                  </h3>
                  <form onSubmit={handleChangePassword} className="max-w-md space-y-6">
                    <div className="space-y-2">
                      <label className="ml-2 text-[10px] font-black uppercase text-slate-400">
                        Mật khẩu hiện tại
                      </label>
                      <input
                        type="password"
                        value={passwordData.oldPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-gray-100 bg-slate-50 p-4 font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-2 text-[10px] font-black uppercase text-slate-400">
                        Mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-gray-100 bg-slate-50 p-4 font-bold outline-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="ml-2 text-[10px] font-black uppercase text-slate-400">
                        Xác nhận mật khẩu mới
                      </label>
                      <input
                        type="password"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        placeholder="••••••••"
                        className="w-full rounded-2xl border border-gray-100 bg-slate-50 p-4 font-bold outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={passwordLoading}
                      className="w-full rounded-2xl bg-slate-900 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:bg-slate-800 disabled:opacity-50"
                    >
                      {passwordLoading ? "Đang đổi mật khẩu..." : "Đổi mật khẩu"}
                    </button>
                  </form>
                </div>
              )}

              {activeTab === "noti" && (
                <div className="p-10">
                  <h3 className="mb-4 text-2xl font-black italic tracking-tighter text-slate-800">
                    Thông báo nền tảng
                  </h3>
                  <p className="max-w-2xl leading-relaxed text-slate-500">
                    Khu vực này hiện dùng hệ thống thông báo chung của TravelConnect. Bạn có thể xem toàn bộ thông báo ở biểu tượng chuông trên thanh điều hướng.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  );
};

export default Settings;
