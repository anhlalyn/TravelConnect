import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ChevronLeft,
  MapPin,
  MessageSquare,
  PlayCircle,
  ShieldAlert,
  ShieldCheck,
  Star,
  Ticket,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import { buildUploadUrl } from "../config";

const PostDetail = ({ user }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const isOwner = Number(user?.id) === Number(data?.post?.id_nguoi_dung);
  const isTourist = user?.vai_tro === "khach_du_lich";

  const mediaList = useMemo(() => {
    const media = data?.post?.media_json;
    if (Array.isArray(media) && media.length) return media;
    return (data?.post?.hinh_anh_json || []).map((url) => ({ type: "image", url }));
  }, [data]);

  const heroMedia = mediaList[0] || null;
  const compliance = data?.post?.kiem_duyet_so_json || null;

  const fetchDetail = useCallback(async () => {
    try {
      const res = await api.get(`/posts/detail/${id}`);
      setData(res.data);
    } catch (err) {
      console.error("Lỗi gọi API chi tiết:", err);
      toast.error("Không thể tải chi tiết bài viết.");
    }
  }, [id]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const handleSubmitReview = async () => {
    if (!isTourist) {
      toast.error("Chỉ khách du lịch mới được đánh giá.");
      return;
    }

    if (!comment.trim()) {
      toast.error("Vui lòng nhập nội dung đánh giá.");
      return;
    }

    try {
      await api.post("/posts/review", {
        id_kdl: data?.post?.id_nguoi_dung,
        id_bai_viet: data?.post?.id,
        so_sao: rating,
        noi_dung: comment,
      });

      toast.success("Cảm ơn bạn đã đánh giá!");
      setComment("");
      fetchDetail();
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi khi gửi đánh giá.");
    }
  };

  const handleBooking = () => {
    if (!isTourist) {
      toast.error("Chỉ khách du lịch mới được đặt vé.");
      return;
    }
    navigate(`/booking/${data.post.id_nguoi_dung}`);
  };

  if (!data?.post) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F8FAFC]">
        <div className="space-y-4 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
            Đang tải trải nghiệm...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} />
      <div className="mx-auto max-w-4xl space-y-8 p-6 pb-20">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400 transition-all hover:text-blue-600"
        >
          <ChevronLeft size={20} /> Quay lại
        </button>

        <div className="overflow-hidden rounded-[3rem] border border-slate-100 bg-white shadow-sm">
          <div className="relative h-[450px] overflow-hidden bg-slate-100">
            {heroMedia ? (
              heroMedia.type === "video" ? (
                <>
                  <video
                    src={buildUploadUrl(heroMedia.url)}
                    className="h-full w-full object-cover"
                    controls
                    playsInline
                  />
                  <div className="absolute right-5 top-5 flex items-center gap-2 rounded-full bg-black/60 px-4 py-2 text-xs font-black uppercase text-white">
                    <PlayCircle size={14} /> Video
                  </div>
                </>
              ) : (
                <img
                  src={buildUploadUrl(heroMedia.url)}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  alt="Ảnh đại diện bài viết"
                />
              )
            ) : (
              <div className="flex h-full w-full items-center justify-center font-black text-slate-400">
                Bài viết chưa có media minh họa
              </div>
            )}
          </div>

          <div className="space-y-6 p-10">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-blue-50 px-3 py-1.5 text-xs font-black text-blue-700">
                {data.post.danh_muc || "Tổng hợp"}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-black text-amber-700">
                <Star size={13} fill="currentColor" />
                {Number(data.post.diem_danh_gia || 0).toFixed(1)} / 5
              </span>
              <span className="text-xs font-bold text-slate-400">
                {data.post.tong_danh_gia || 0} đánh giá
              </span>
            </div>

            {compliance && (
              <div
                className={`rounded-2xl border px-4 py-3 ${
                  compliance.ready
                    ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                    : "border-amber-100 bg-amber-50 text-amber-700"
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                  {compliance.ready ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                  <span>Chuẩn nền tảng số {compliance.score}/100</span>
                </div>
                <p className="mt-1 text-sm font-bold">{compliance.summary}</p>
              </div>
            )}

            <h1 className="text-4xl font-black italic leading-tight tracking-tighter text-slate-800">
              {data.post.tieu_de}
            </h1>

            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-500">
              <MapPin size={16} fill="currentColor" className="opacity-20" />
              {data.post.dia_chi_chi_tiet || data.post.tinh_thanh || "Địa điểm đang cập nhật"}
            </div>

            <p className="whitespace-pre-line text-lg font-medium leading-relaxed text-slate-600">
              {data.post.noi_dung}
            </p>

            {mediaList.length > 1 && (
              <div className="grid grid-cols-2 gap-4">
                {mediaList.slice(1).map((media, index) =>
                  media.type === "video" ? (
                    <video
                      key={`${media.url}-${index}`}
                      src={buildUploadUrl(media.url)}
                      className="h-52 w-full rounded-[1.5rem] bg-black object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      key={`${media.url}-${index}`}
                      src={buildUploadUrl(media.url)}
                      className="h-52 w-full rounded-[1.5rem] object-cover"
                      alt="Media bài viết"
                    />
                  ),
                )}
              </div>
            )}

            {!isOwner && (
              <button
                onClick={handleBooking}
                className="flex w-full items-center justify-center gap-3 rounded-[1.5rem] bg-blue-600 py-5 font-black uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all active:scale-95 hover:bg-slate-900"
              >
                <Ticket /> Đặt vé ngay tại đây
              </button>
            )}
          </div>
        </div>

        <div className="space-y-8 rounded-[3rem] border border-slate-100 bg-white p-10 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="flex items-center gap-3 text-2xl font-black italic text-slate-800">
              <MessageSquare className="text-blue-600" /> Đánh giá từ cộng đồng
            </h3>
            <div className="text-sm font-bold text-slate-500">
              Điểm trung bình:{" "}
              <span className="text-slate-900">{Number(data.post.diem_danh_gia || 0).toFixed(1)}</span>
            </div>
          </div>

          {!isOwner && isTourist && (
            <div className="space-y-4 rounded-[2rem] border border-slate-100 bg-slate-50 p-8">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                Trải nghiệm của bạn thế nào?
              </p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={28}
                    onClick={() => setRating(s)}
                    fill={s <= rating ? "#EAB308" : "none"}
                    className={`cursor-pointer transition-all ${
                      s <= rating ? "text-yellow-500" : "text-slate-200"
                    }`}
                  />
                ))}
              </div>
              <textarea
                className="w-full rounded-2xl border-none bg-white p-5 text-sm font-bold shadow-sm outline-none transition-all focus:ring-2 focus:ring-blue-100"
                placeholder="Chia sẻ cảm nhận chân thực của bạn về khu du lịch này..."
                rows={4}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button
                onClick={handleSubmitReview}
                className="rounded-2xl bg-blue-600 px-10 py-4 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-blue-100 transition-all active:scale-95 hover:bg-slate-900"
              >
                Gửi đánh giá trải nghiệm
              </button>
            </div>
          )}

          <div className="divide-y divide-slate-100">
            {data.reviews?.length > 0 ? (
              data.reviews.map((rev) => (
                <div key={rev.id} className="group flex gap-5 py-8 first:pt-0 last:pb-0">
                  <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-blue-50 shadow-sm">
                    {rev.anh_dai_dien ? (
                      <img
                        src={buildUploadUrl(rev.anh_dai_dien)}
                        className="h-full w-full object-cover"
                        alt={rev.ten}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xl font-black text-blue-600">
                        {rev.ten?.charAt(0)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-sm font-black italic text-slate-800">{rev.ten}</p>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={12}
                            fill={i < rev.so_sao ? "#EAB308" : "none"}
                            className={i < rev.so_sao ? "text-yellow-500" : "text-slate-200"}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="rounded-2xl border border-transparent bg-slate-50/50 p-4 text-sm font-medium leading-relaxed text-slate-500 transition-all group-hover:border-slate-100">
                      {rev.noi_dung}
                    </p>
                    <p className="text-[9px] font-black uppercase tracking-tighter text-slate-300">
                      {new Date(rev.ngay_tao).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="space-y-3 py-12 text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-200">
                  <MessageSquare size={32} />
                </div>
                <p className="text-sm font-bold italic text-slate-400">
                  Chưa có đánh giá nào. Hãy là người đầu tiên!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetail;
