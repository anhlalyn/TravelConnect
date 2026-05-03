import React, { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { Star } from "lucide-react";
import toast from "react-hot-toast";
import { buildUploadUrl } from "../config";

const KDLReviews = ({ user }) => {
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ tong_danh_gia: 0, diem_trung_binh: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const res = await api.get("/businesses/kdl/reviews");
        setReviews(res.data.data || []);
        setSummary(res.data.summary || { tong_danh_gia: 0, diem_trung_binh: 0 });
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể tải đánh giá");
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-10">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Đánh giá khách hàng</h1>
            <div className="flex flex-wrap gap-4 mt-4">
              <div className="px-5 py-4 rounded-[1.6rem] bg-amber-50 text-amber-700">
                <p className="text-[11px] font-black uppercase tracking-widest">Điểm trung bình</p>
                <p className="text-3xl font-black">{Number(summary.diem_trung_binh || 0).toFixed(1)}</p>
              </div>
              <div className="px-5 py-4 rounded-[1.6rem] bg-blue-50 text-blue-700">
                <p className="text-[11px] font-black uppercase tracking-widest">Tổng đánh giá</p>
                <p className="text-3xl font-black">{summary.tong_danh_gia || 0}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {loading ? (
              <div className="bg-white rounded-[2rem] p-10 text-center text-slate-400 font-bold">
                Đang tải đánh giá...
              </div>
            ) : reviews.length ? (
              reviews.map((review) => (
                <div key={review.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex gap-4">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden bg-blue-50 flex items-center justify-center">
                        {review.anh_dai_dien ? (
                          <img
                            src={buildUploadUrl(review.anh_dai_dien)}
                            className="w-full h-full object-cover"
                            alt={review.ten}
                          />
                        ) : (
                          <span className="font-black text-blue-700 text-lg">{review.ten?.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-black text-slate-800">{review.ten}</h3>
                        <p className="text-sm text-slate-400 font-bold mt-1">
                          {review.tieu_de || "Đánh giá tổng quan"}
                        </p>
                        <div className="flex gap-1 mt-3">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              fill={i < review.so_sao ? "#EAB308" : "none"}
                              className={i < review.so_sao ? "text-yellow-500" : "text-slate-200"}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-400">
                      {new Date(review.ngay_tao).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <p className="mt-5 text-slate-600 leading-relaxed bg-slate-50 rounded-[1.5rem] p-4">
                    {review.noi_dung}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white rounded-[2rem] p-10 text-center text-slate-400 font-bold">
                Chưa có đánh giá nào cho khu du lịch này.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDLReviews;
