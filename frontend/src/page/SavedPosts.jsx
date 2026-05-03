import React, { useState, useEffect } from "react";
import api from "../api";
import PostCard from "../components/PostCard";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const SavedPosts = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSaved = async () => {
    try {
      const res = await api.get("/posts/saved-list");
      setPosts(res.data.data || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchSaved(); }, []);

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />
      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4">
        <div className="col-span-3 hidden lg:block"><Sidebar user={user} /></div>
        <div className="col-span-12 lg:col-span-9 space-y-6">
          <h2 className="text-2xl font-black italic text-slate-800">Bài viết đã lưu</h2>
          {loading ? <p>Đang tải...</p> : posts.length > 0 ? (
            posts.map(post => <PostCard key={post.id} post={post} currentUser={user} onRefresh={fetchSaved} />)
          ) : (
            <div className="bg-white p-20 rounded-[3rem] text-center text-slate-300 font-black uppercase">Chưa có bài lưu nào</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SavedPosts;
