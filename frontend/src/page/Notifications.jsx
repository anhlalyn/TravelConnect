import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { 
  Bell, Heart, MessageCircle, UserPlus, 
  CheckCircle2, Clock, Trash2, Bookmark 
} from "lucide-react";
import toast from "react-hot-toast";
import { buildUploadUrl } from "../config";

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
    } catch (err) {
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

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-20">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white rounded-[3rem] shadow-sm border border-gray-100 overflow-hidden">
            {/* Header thông báo */}
            <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                    <Bell size={24} className="animate-swing" />
                </div>
                <div>
                    <h2 className="text-2xl font-black italic text-slate-800 tracking-tighter">Thông báo</h2>
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Cập nhật mới nhất từ bạn bè</p>
                </div>
              </div>
              
              <button 
                onClick={handleMarkAllRead}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-blue-600 transition-all shadow-lg active:scale-95"
              >
                <CheckCircle2 size={14} /> Đánh dấu đã đọc
              </button>
            </div>

            {/* Danh sách thông báo */}
            <div className="p-4">
              {loading ? (
                <div className="py-20 text-center font-black text-slate-300 italic animate-pulse">ĐANG TẢI...</div>
              ) : notifications.length > 0 ? (
                <div className="space-y-2">
                  {notifications.map((noti) => (
                    <div 
                      key={noti.id} 
                      className={`flex items-center gap-4 p-5 rounded-[2rem] transition-all cursor-pointer border-2 ${
                        noti.da_xem 
                        ? 'bg-white border-transparent grayscale-[0.5] opacity-70' 
                        : 'bg-indigo-50/30 border-indigo-100 shadow-sm'
                      } hover:bg-slate-50 hover:border-slate-200 group`}
                    >
                      {/* Avatar người gửi */}
                      <div className="relative shrink-0">
                        <div className="w-14 h-14 rounded-2xl bg-blue-600 overflow-hidden border-4 border-white shadow-md">
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
                      <div className="flex-1">
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
                        <div className="w-3 h-3 bg-blue-600 rounded-full shadow-[0_0_10px_rgba(37,99,235,0.5)]"></div>
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
