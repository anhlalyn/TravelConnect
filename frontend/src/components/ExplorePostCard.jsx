import React from "react";
import { MessageCircle, Bookmark, Ticket, MapPin, Star, PlayCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import { buildUploadUrl } from "../config";

const ExplorePostCard = ({ post, currentUser, onRefresh }) => {
  const navigate = useNavigate();
  const isTourist = currentUser?.vai_tro === "khach_du_lich";
  const mediaList =
    Array.isArray(post?.media_json) && post.media_json.length
      ? post.media_json
      : (post?.hinh_anh_json || []).map((url) => ({ type: "image", url }));
  const heroMedia = mediaList[0];

  const goToDetail = () => {
    navigate(`/post/${post.id}`);
  };

  const handleBooking = (e) => {
    e.stopPropagation();
    if (!isTourist) {
      toast.error("Chỉ khách du lịch mới có thể đặt vé");
      return;
    }
    navigate(`/booking/${post.id_nguoi_dung}`);
  };

  const handleChat = (e) => {
    e.stopPropagation();
    navigate(`/messages?to=${post.id_nguoi_dung}`);
  };

  const handleToggleSave = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.post("/posts/save", { id_bai_viet: post.id });
      toast.success(res.data.message);
      if (onRefresh) onRefresh();
    } catch {
      toast.error("Lỗi khi lưu bài viết");
    }
  };

  return (
    <div
      onClick={goToDetail}
      className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group flex flex-col h-full cursor-pointer"
    >
      <div className="h-60 relative overflow-hidden bg-slate-100">
        {heroMedia?.type === "video" ? (
          <>
            <video
              src={buildUploadUrl(heroMedia.url)}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              muted
              playsInline
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="rounded-full bg-white/90 p-4 text-slate-900 shadow-xl">
                <PlayCircle size={34} />
              </div>
            </div>
          </>
        ) : (
          <img
            src={heroMedia?.url ? buildUploadUrl(heroMedia.url) : "https://via.placeholder.com/400x300"}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            alt={post.tieu_de}
          />
        )}
        <div className="absolute top-4 left-4 flex gap-2 flex-wrap">
          <span className="bg-white/90 backdrop-blur-md px-3 py-1 rounded-xl font-black text-[10px] text-blue-600 shadow-sm">
            {post.danh_muc || "Tổng hợp"}
          </span>
          <span className="bg-slate-900/85 text-white px-3 py-1 rounded-xl font-black text-[10px] shadow-sm flex items-center gap-1.5">
            <Star size={12} fill="currentColor" />
            {Number(post.diem_danh_gia || 0).toFixed(1)} • {post.tong_danh_gia || 0} đánh giá
          </span>
          {heroMedia?.type === "video" && (
            <span className="bg-rose-500/90 text-white px-3 py-1 rounded-xl font-black text-[10px] shadow-sm">
              Video
            </span>
          )}
        </div>
      </div>

      <div className="p-6 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 pr-2">
            <h3 className="font-black text-lg text-slate-800 leading-tight mb-1 line-clamp-1">
              {post.tieu_de}
            </h3>
            <div className="flex items-center gap-1 text-slate-400">
              <MapPin size={12} className="text-blue-500" />
              <span className="text-[10px] font-black uppercase tracking-widest truncate">
                {post.ten_khu_du_lich || post.ten_nguoi_dang || "Cơ sở du lịch"}
              </span>
            </div>
          </div>
          <button
            onClick={handleToggleSave}
            className={`p-2.5 rounded-2xl transition-all ${
              post.da_luu
                ? "bg-amber-50 text-amber-500"
                : "bg-slate-50 text-slate-300 hover:text-slate-500"
            }`}
          >
            <Bookmark size={20} fill={post.da_luu ? "currentColor" : "none"} />
          </button>
        </div>

        <p className="text-sm text-slate-500 line-clamp-3 mb-4 flex-1 leading-relaxed">
          {post.noi_dung}
        </p>

        <div className="flex items-center gap-4 text-xs font-bold text-slate-400 mb-5">
          <span>{post.tong_luot_thich || 0} lượt thích</span>
          <span>{post.tong_binh_luan || 0} bình luận</span>
        </div>

        <div className="grid grid-cols-12 gap-2 mt-auto">
          <button
            onClick={handleChat}
            className="col-span-3 flex items-center justify-center py-3.5 bg-slate-100 text-slate-600 rounded-2xl hover:bg-slate-200 transition-all active:scale-95"
            title="Nhắn tin tư vấn"
          >
            <MessageCircle size={20} />
          </button>

          <button
            onClick={handleBooking}
            className="col-span-9 flex items-center justify-center gap-2 py-3.5 bg-blue-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-[0.1em] shadow-lg shadow-blue-100 hover:bg-slate-900 transition-all active:scale-95"
          >
            <Ticket size={18} /> {isTourist ? "Đặt vé ngay" : "Xem chi tiết"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExplorePostCard;
