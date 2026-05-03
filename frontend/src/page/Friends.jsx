import React, { useState, useEffect, useCallback } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { UserPlus, UserCheck, Users, MessageSquare, UserX, Search } from "lucide-react"; // Đã thêm UserX
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { buildUploadUrl } from "../config";

const Friends = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("suggest"); 
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const endpoint = activeTab === "suggest" ? "/friends/suggest" : activeTab === "requests" ? "/friends/requests" : "/friends/list";
      const res = await api.get(endpoint);
      setData(res.data.data || []);
      
      const userRes = await api.get("/auth/profile");
      setUser(userRes.data.data);
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleStartChat = async (targetUserId) => {
    try {
      const res = await api.post("/messages/create-room", { id_doi_phuong: targetUserId });
      if (res.data.success) navigate("/messages");
    } catch (err) { toast.error("Không thể mở cuộc trò chuyện"); }
  };

  const handleAddFriend = async (id) => {
    try { 
      await api.post("/friends/add", { id_nguoi_nhan: id }); 
      toast.success("Đã gửi lời mời!"); 
      setData(data.filter(i => i.id !== id)); 
    } catch (err) { toast.error("Lỗi gửi lời mời"); }
  };

  const handleAccept = async (id) => {
    try { 
      await api.post("/friends/accept", { id_nguoi_gui: id }); 
      toast.success("Hai bạn đã trở thành bạn bè!"); 
      setData(data.filter(i => i.id !== id)); 
    } catch (err) { toast.error("Lỗi chấp nhận"); }
  };

  const handleUnfriend = async (id) => {
    if(!window.confirm("Bạn có chắc muốn hủy kết bạn?")) return;
    try {
      await api.post("/friends/unfriend", { id_doi_phuong: id });
      toast.success("Đã hủy kết bạn");
      setData(data.filter(i => i.id !== id));
    } catch (err) { toast.error("Lỗi thực thi"); }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-20">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
              <h2 className="text-2xl font-black text-slate-800 italic tracking-tighter">Mối quan hệ</h2>
              
              {/* Tab Switcher */}
              <div className="flex gap-1 p-1.5 bg-slate-100 rounded-2xl w-fit">
                <button 
                  onClick={() => setActiveTab("suggest")} 
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'suggest' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <UserPlus size={16} /> Gợi ý
                </button>
                <button 
                  onClick={() => setActiveTab("requests")} 
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'requests' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <UserCheck size={16} /> Lời mời
                </button>
                <button 
                  onClick={() => setActiveTab("list")} 
                  className={`flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  <Users size={16} /> Bạn bè
                </button>
              </div>
            </div>

            {loading ? (
              <div className="py-20 text-center font-black text-slate-300 italic animate-pulse tracking-widest">ĐANG TẢI...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                {data.length > 0 ? data.map((item) => (
                  <div key={item.id} className="bg-white border border-slate-50 p-5 rounded-[2rem] flex flex-col items-center text-center group hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    
                    {/* Avatar */}
                    <div className="w-20 h-20 rounded-3xl bg-blue-600 overflow-hidden mb-4 shadow-lg border-4 border-white">
                      {item.anh_dai_dien ? (
                        <img src={buildUploadUrl(item.anh_dai_dien)} className="w-full h-full object-cover" alt="avatar" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-white font-black text-2xl uppercase">
                          {item.ten?.charAt(0)}
                        </div>
                      )}
                    </div>

                    <div className="w-full">
                      <p className="font-black text-slate-800 text-sm mb-1 truncate">{item.ten}</p>
                      <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest mb-4">
                        {item.vai_tro === 'khu_du_lich' ? 'Đối tác KDL' : 'Người du lịch'}
                      </p>
                      
                      <div className="flex gap-2 w-full">
                        {activeTab === "suggest" && (
                          <button 
                            onClick={() => handleAddFriend(item.id)} 
                            className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-md shadow-blue-100"
                          >
                            Kết bạn
                          </button>
                        )}
                        
                        {activeTab === "requests" && (
                          <button 
                            onClick={() => handleAccept(item.id)} 
                            className="w-full py-3 bg-orange-500 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-slate-900 transition-all shadow-md shadow-orange-100"
                          >
                            Chấp nhận
                          </button>
                        )}
                        
                        {activeTab === "list" && (
                          <>
                            <button 
                              onClick={() => handleStartChat(item.id)} 
                              className="flex-1 py-3 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-md"
                            >
                              <MessageSquare size={14}/> Chat
                            </button>
                            <button 
                              onClick={() => handleUnfriend(item.id)}
                              className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            >
                              <UserX size={16} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-full py-20 text-center">
                     <p className="text-sm font-black text-slate-300 uppercase tracking-widest italic">Không có dữ liệu trong danh sách này</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Friends;
