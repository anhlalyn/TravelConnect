import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { 
  Bell, Heart, MessageCircle, UserPlus, 
  CheckCircle2, Clock 
} from "lucide-react";
import toast from "react-hot-toast";
import { buildUploadUrl } from "../config";
import { useNavigate } from "react-router-dom";

const formatNotificationTimestamp = (value) => {
  if (!value) return "--";

  const date = new Date(value);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const oneDayMs = 24 * 60 * 60 * 1000;

  if (diffMs < oneDayMs) {
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString("vi-VN");
};

const Notifications = ({ user }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.data || []);
    } catch (err) {
      console.error("Lỗi tải thông báo:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/mark-read");
      toast.success("Đã đánh dấu tất cả là đã xem");
      fetchNotifications();
    } catch {
      toast.error("Không thể cập nhật");
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Hàm render icon tương ứng với loại thông báo
  const renderIcon = (type) => {
    switch (type) {
      case "thich": return <div className="p-2 bg-red-100 text-red-500 rounded-xl"><Heart size={16} fill="currentColor"/></div>;
      case "binh_luan": return <div className="p-2 bg-blue-100 text-blue-500 rounded-xl"><MessageCircle size={16} fill="currentColor"/></div>;
      case "ket_ban": return <div className="p-2 bg-emerald-100 text-emerald-500 rounded-xl"><UserPlus size={16}/></div>;
      case "he_thong": return <div className="p-2 bg-amber-100 text-amber-500 rounded-xl"><Bell size={16}/></div>;
      default: return <div className="p-2 bg-slate-100 text-slate-500 rounded-xl"><Bell size={16}/></div>;
    }
  };

  const handleOpenNotification = (noti) => {
    if (["thich", "binh_luan", "he_thong"].includes(noti.loai_thong_bao) && noti.id_lien_ket) {
      navigate(`/post/${noti.id_lien_ket}`);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-4 px-3 pb-20 pt-4 sm:px-4 md:gap-6 md:pt-6">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9">
          <div className="overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-sm sm:rounded-[3rem]">
            {/* Header thông báo */}
            <div className="sticky top-0 z-10 flex flex-col gap-4 border-b border-gray-50 bg-white p-4 sm:flex-row sm:items-center sm:justify-between sm:p-8">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                    <Bell size={24} className="animate-swing" />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic text-slate-800 tracking-tighter">Thông báo</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cập nhật mới nhất từ bạn bè</p>
                </div>
              </div>
              
              <button 
                onClick={handleMarkAllRead}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-[10px] font-black uppercase tracking-wider text-white shadow-lg transition-all hover:bg-blue-600 active:scale-95 sm:w-auto sm:py-2.5"
              >
                <CheckCircle2 size={14} /> Đánh dấu đã đọc
              </button>
            </div>

            {/* Danh sách thông báo */}
            <div className="p-3 sm:p-4">
              {loading ? (
                <div className="py-20 text-center font-black text-slate-300 italic animate-pulse">ĐANG TẢI...</div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((noti) => (
                    <div 
                      key={noti.id} 
                      onClick={() => handleOpenNotification(noti)}
                      className={`flex cursor-pointer items-start gap-3 rounded-[1.5rem] border-2 p-3 transition-all sm:items-center sm:gap-4 sm:rounded-[2rem] sm:p-5 ${
                        noti.da_xem 
                        ? 'bg-white border-transparent grayscale-[0.5] opacity-70' 
                        : 'bg-indigo-50/30 border-indigo-100 shadow-sm'
                      } hover:bg-slate-50 hover:border-slate-200 group`}
                    >
                      {/* Avatar người gửi */}
                      <div className="relative shrink-0">
                        <div className="h-12 w-12 overflow-hidden rounded-2xl border-4 border-white bg-blue-600 shadow-md sm:h-14 sm:w-14">
                          {noti.anh_dai_dien ? (
                            <img src={buildUploadUrl(noti.anh_dai_dien)} className="w-full h-full object-cover" alt="user" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-white font-black text-xl">
                              {noti.ten_nguoi_gui?.charAt(0)}
                            </div>
                          )}
                        </div>
                        <div className="absolute -bottom-1 -right-1">
                          {renderIcon(noti.loai_thong_bao)}
                        </div>
                      </div>

                      {/* Nội dung thông báo */}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-slate-700 leading-snug">
                          <span className="font-black text-slate-900">{noti.ten_nguoi_gui}</span>{" "}
                          <span className="font-medium">{noti.noi_dung}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                          <Clock size={12} /> {formatNotificationTimestamp(noti.ngay_tao)}
                        </div>
                      </div>

                      {/* Chấm xanh nếu chưa xem */}
                      {!noti.da_xem && (
                        <div className="mt-2 h-3 w-3 shrink-0 rounded-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)] sm:mt-0"></div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-32 text-center">
                  <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-200">
                    <Bell size={40} />
                  </div>
                  <p className="text-sm font-black text-slate-300 uppercase tracking-[0.2em]">Không có thông báo mới</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;
