import React, { useCallback, useEffect, useState } from "react";
import { AtSign, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import PostCard from "../components/PostCard";
import Sidebar from "../components/Sidebar";

const KDLTaggedPosts = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTaggedPosts = useCallback(async () => {
    try {
      const res = await api.get("/posts/tagged-me");
      const data = res.data.data || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Loi tai bai viet duoc tag:", err);
      toast.error(err.response?.data?.message || "Khong the tai bai viet duoc gan the.");
      setPosts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchTaggedPosts();
  }, [fetchTaggedPosts]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchTaggedPosts();
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 pb-20 pt-6">
        <div className="col-span-3 hidden lg:block">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-6">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-7 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl bg-indigo-50 p-3 text-indigo-600">
                  <AtSign size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900">Bai viet nhac den ban</h1>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Theo doi bai chia se cua khach du lich da gan the khu du lich cua ban.
                  </p>
                </div>
              </div>

              <button
                onClick={handleRefresh}
                className="rounded-2xl bg-slate-900 p-3 text-white transition-all hover:bg-blue-600 disabled:opacity-50"
                disabled={refreshing}
                title="Tai lai"
              >
                <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-12 text-center text-sm font-black uppercase tracking-widest text-slate-300 shadow-sm">
              Dang tai bai viet...
            </div>
          ) : posts.length > 0 ? (
            <div className={refreshing ? "opacity-60" : "opacity-100"}>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onRefresh={fetchTaggedPosts}
                />
              ))}
            </div>
          ) : (
            <div className="rounded-[2.5rem] border-2 border-dashed border-gray-100 bg-white p-12 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                <AtSign size={30} />
              </div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                Chua co bai viet nao tag ban
              </p>
              <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500">
                Khi khach du lich gan the khu du lich trong bai viet, bai do se xuat hien tai day de ban phan hoi.
              </p>
            </div>
          )}
        </div>

        <div className="col-span-3 hidden xl:block">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-3 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Goi y phan hoi
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Uu tien tra loi cac bai review co hinh anh, cau hoi ve dich vu, hoac phan anh can xu ly som.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KDLTaggedPosts;
