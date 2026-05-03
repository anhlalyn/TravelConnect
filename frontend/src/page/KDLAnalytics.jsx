import React, { useEffect, useState } from "react";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import toast from "react-hot-toast";

const KDLAnalytics = ({ user }) => {
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get("/businesses/kdl/analytics");
        setAnalytics(res.data.data);
      } catch (err) {
        toast.error(err.response?.data?.message || "Không thể tải thống kê");
      }
    };

    fetchAnalytics();
  }, []);

  const statCards = analytics
    ? [
        { label: "Bài viết", value: analytics.posts?.tong_bai_viet || 0, color: "bg-blue-50 text-blue-700" },
        { label: "Lượt thích", value: analytics.engagement?.tong_luot_thich || 0, color: "bg-pink-50 text-pink-700" },
        { label: "Bình luận", value: analytics.engagement?.tong_binh_luan || 0, color: "bg-emerald-50 text-emerald-700" },
        { label: "Đánh giá", value: analytics.engagement?.tong_danh_gia || 0, color: "bg-amber-50 text-amber-700" },
        { label: "Doanh thu", value: `${Number(analytics.bookings?.tong_doanh_thu || 0).toLocaleString()}đ`, color: "bg-indigo-50 text-indigo-700" },
      ]
    : [];

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-10">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <h1 className="text-3xl font-black text-slate-900 mb-2">Thống kê khu du lịch</h1>
            <p className="text-sm text-slate-500">
              Theo dõi hiệu quả bài viết, tương tác và hiệu suất booking từ khách du lịch.
            </p>
          </div>

          {!analytics ? (
            <div className="bg-white rounded-[2rem] p-10 text-center text-slate-400 font-bold">
              Đang tải thống kê...
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
                {statCards.map((stat) => (
                  <div key={stat.label} className={`rounded-[1.8rem] p-5 ${stat.color}`}>
                    <p className="text-[11px] font-black uppercase tracking-widest">{stat.label}</p>
                    <p className="text-3xl font-black mt-3">{stat.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-black text-slate-800 mb-5">Trạng thái booking</h2>
                  <div className="space-y-4">
                    {[
                      ["Tổng booking", analytics.bookings?.tong_booking || 0],
                      ["Chờ xác nhận", analytics.bookings?.cho_xac_nhan || 0],
                      ["Đã xác nhận", analytics.bookings?.da_xac_nhan || 0],
                      ["Hoàn thành", analytics.bookings?.hoan_thanh || 0],
                      ["Đã hủy", analytics.bookings?.da_huy || 0],
                    ].map(([label, value]) => (
                      <div key={label} className="flex items-center justify-between">
                        <span className="text-slate-500 font-bold">{label}</span>
                        <span className="text-slate-900 font-black">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                  <h2 className="text-xl font-black text-slate-800 mb-5">Bài viết nổi bật</h2>
                  <div className="space-y-4">
                    {analytics.topPosts?.length ? (
                      analytics.topPosts.map((post) => (
                        <div key={post.id} className="rounded-[1.4rem] bg-slate-50 p-4">
                          <p className="font-black text-slate-800">{post.tieu_de}</p>
                          <div className="mt-2 flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                            <span>{Number(post.diem_danh_gia || 0).toFixed(1)} sao</span>
                            <span>{post.tong_danh_gia || 0} đánh giá</span>
                            <span>{post.tong_luot_thich || 0} lượt thích</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-slate-400 font-bold">Chưa có dữ liệu bài viết nổi bật.</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default KDLAnalytics;
