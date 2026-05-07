import React, { useEffect, useState, useCallback } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";

// Import các Component
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import CreatePost from "../components/CreatePost";
import PostCard from "../components/PostCard";
import FriendSuggest from "../components/FriendSuggest";
import toast from "react-hot-toast";

const Home = () => {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [featuredPlaces, setFeaturedPlaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  // 1. Hàm lấy bài viết - Dùng mode=home
  const fetchPosts = useCallback(async () => {
    try {
      const res = await api.get("/posts?mode=home");
      console.log("Dữ liệu trang Home:", res.data);
      const incomingData = res.data.data || res.data || [];
      setPosts(Array.isArray(incomingData) ? incomingData : []);
    } catch (err) {
      console.error("Lỗi fetch bài viết:", err);
      setPosts([]);
    }
  }, []);

  // 2. Hàm lấy Profile
  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get("/auth/profile");
      const userData = res.data.data || res.data;
      setUser(userData);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  const fetchFeaturedPlaces = useCallback(async () => {
    try {
      const res = await api.get("/businesses/featured");
      const data = res.data.data || [];
      setFeaturedPlaces(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi tải địa điểm tiêu biểu:", err);
      setFeaturedPlaces([]);
    }
  }, []);

  // 3. Khởi tạo dữ liệu - Dùng useEffect với mảng phụ thuộc trống []
  // để đảm bảo CHỈ CHẠY 1 LẦN duy nhất khi mở trang
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchUserProfile(),
          fetchPosts(),
          fetchFeaturedPlaces(),
        ]);
      } catch (err) {
        console.error("Lỗi khởi tạo:", err);
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, []); // BẮT BUỘC ĐỂ TRỐNG [] Ở ĐÂY để tránh trắng trang

  // 4. Xử lý sau khi đăng bài thành công
  const handlePostSuccess = async () => {
    setRefreshing(true);
    await fetchPosts();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
          <p className="text-blue-600 font-black uppercase text-[10px] tracking-widest animate-pulse">
            Đang đồng bộ dữ liệu...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-6 space-y-6">
          <CreatePost user={user} onPostSuccess={handlePostSuccess} />

          <div
            className={`space-y-6 transition-all duration-300 ${refreshing ? "opacity-50 blur-[1px]" : "opacity-100"}`}
          >
            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  onRefresh={fetchPosts}
                  currentUser={user}
                />
              ))
            ) : (
              <div className="bg-white p-12 rounded-[2.5rem] text-center border-2 border-dashed border-gray-100 text-gray-400 font-bold shadow-sm">
                <p className="text-5xl mb-4">📸</p>
                <p className="text-sm">Chưa có bài đăng nào từ bạn bè.</p>
                <p className="text-[10px] text-blue-500 uppercase mt-2 tracking-widest">
                  Hãy chia sẻ chuyến đi đầu tiên của bạn!
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="hidden xl:block col-span-3 space-y-6 pb-12">
          <FriendSuggest />
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100">
            <h3 className="font-black text-slate-400 text-[10px] uppercase tracking-[0.2em] mb-6">
              Địa điểm tiêu biểu
            </h3>
            <div className="space-y-4">
              {featuredPlaces.length > 0 ? (
                featuredPlaces.slice(0, 4).map((place) => (
                  <div
                    key={place.id}
                    onClick={() => navigate(`/booking/${place.id}`)}
                    className="flex gap-4 items-center group cursor-pointer rounded-3xl border border-slate-100 p-4 transition-all hover:border-blue-200 hover:bg-slate-50"
                  >
                    <div className="w-14 h-14 rounded-3xl bg-blue-50 text-xl flex items-center justify-center text-blue-600 shadow-sm overflow-hidden">
                      {place.anh_dai_dien ? (
                        <img
                          src={place.anh_dai_dien}
                          alt={place.ten_khu_du_lich || place.ten}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span>🏞️</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-700 group-hover:text-blue-600 transition-colors">
                        {place.ten_khu_du_lich || place.ten || "Khu du lịch"}
                      </p>
                      <p className="text-[10px] text-blue-500 font-black tracking-widest uppercase">
                        {place.tinh_thanh || "Đang cập nhật"}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-3xl border border-dashed border-slate-200 p-6 text-center text-slate-400">
                  <p className="font-black uppercase tracking-[0.2em] text-[10px] mb-2">
                    Chưa có địa điểm nổi bật
                  </p>
                  <p className="text-[11px]">
                    Hãy thử đăng ký thêm khu du lịch hoặc kiểm tra lại sau.
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => navigate("/explore")}
              className="w-full mt-8 py-4 bg-slate-50 text-slate-500 text-[11px] font-black rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm uppercase tracking-wider"
            >
              Khám phá thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
