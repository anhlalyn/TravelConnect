import React, { useEffect, useState } from "react";
import api from "../api";
import { UserPlus, Building2, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const FriendSuggest = () => {
  const [suggests, setSuggests] = useState([]);
  const navigate = useNavigate();

  const fetchSuggests = async () => {
    try {
      const res = await api.get("/friends/suggest");
      setSuggests(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchSuggests(); }, []);

  // Logic Tạo phòng chat và chuyển sang trang tin nhắn
  const handleStartChat = async (targetUserId) => {
    try {
      const res = await api.post("/messages/create-room", { id_doi_phuong: targetUserId });
      if (res.data.success) navigate("/messages");
    } catch (err) { toast.error("Không thể mở cuộc trò chuyện"); }
  };

  const handleAddFriend = async (id, role) => {
    try {
      await api.post("/friends/add", { id_nguoi_nhan: id });
      toast.success(role === 'khu_du_lich' ? "Đã gửi yêu cầu theo dõi!" : "Đã gửi lời mời kết bạn!");
      setSuggests(suggests.filter(s => s.id !== id));
    } catch (err) { toast.error("Thao tác thất bại"); }
  };

  return (
    <div className="bg-white p-5 rounded-3xl shadow-sm border border-gray-100">
      <h3 className="font-bold text-slate-800 text-sm mb-4 flex items-center gap-2 uppercase tracking-tight">
        <UserPlus size={18} className="text-blue-600" /> Gợi ý kết nối
      </h3>
      <div className="space-y-4">
        {suggests.map((s) => (
          <div key={s.id} className="flex items-center justify-between group animate-in fade-in duration-500">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs uppercase border flex-shrink-0 ${
                s.vai_tro === "khu_du_lich" ? 'bg-indigo-50 border-indigo-100 text-indigo-600' : 'bg-gray-50 border-gray-100 text-blue-600'
              }`}>
                {s.vai_tro === "khu_du_lich" ? <Building2 size={16} /> : s.ten.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-[13px] font-bold text-slate-700 truncate">{s.ten}</p>
                <p className="text-[9px] font-bold uppercase text-gray-400">
                  {s.vai_tro === "khu_du_lich" ? 'Khu du lịch' : 'Khách du lịch'}
                </p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => handleStartChat(s.id)} className="p-2 bg-gray-50 text-gray-400 rounded-lg hover:bg-blue-50 hover:text-blue-600 transition-all">
                <MessageSquare size={14} />
              </button>
              <button onClick={() => handleAddFriend(s.id, s.vai_tro)} className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm shadow-blue-100">
                <UserPlus size={15} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FriendSuggest;