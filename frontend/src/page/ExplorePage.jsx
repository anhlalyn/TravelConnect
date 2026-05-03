import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, PlayCircle, ShieldAlert, ShieldCheck, Video, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import ExplorePostCard from "../components/ExplorePostCard";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { EXPLORE_CATEGORIES } from "../constants/explore";

const ExplorePage = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [activeCategory, setActiveCategory] = useState("Tất cả");
  const [search, setSearch] = useState("");
  const [selectedMedia, setSelectedMedia] = useState([]);
  const [previewMedia, setPreviewMedia] = useState([]);
  const [compliance, setCompliance] = useState(null);
  const [form, setForm] = useState({
    tieu_de: "",
    danh_muc: "Nghỉ dưỡng",
    noi_dung: "",
  });

  const fileInputRef = useRef(null);
  const userRole = user?.role?.toLowerCase() || user?.vai_tro?.toLowerCase() || "";
  const isTourism = userRole === "khu_du_lich";
  const userInterests = useMemo(
    () => (Array.isArray(user?.so_thich_json) ? user.so_thich_json : []),
    [user?.so_thich_json],
  );

  const fetchExplorePosts = useCallback(async () => {
    try {
      const res = await api.get("/posts?mode=explore");
      const data = res.data.data || [];
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Lỗi hiển thị Khám phá:", err);
      toast.error("Không thể tải bài khám phá.");
      setPosts([]);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchExplorePosts();
      setLoading(false);
    };

    load();
  }, [fetchExplorePosts]);

  useEffect(() => {
    return () => {
      previewMedia.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previewMedia]);

  const personalizedCategories = useMemo(() => {
    const merged = [...EXPLORE_CATEGORIES];
    userInterests.forEach((interest) => {
      if (!merged.includes(interest)) merged.push(interest);
    });
    return merged;
  }, [userInterests]);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return posts.filter((post) => {
      const categoryMatch =
        activeCategory === "Tất cả" || (post.danh_muc || "Tổng hợp") === activeCategory;
      const text = `${post.tieu_de || ""} ${post.noi_dung || ""} ${post.ten_khu_du_lich || ""}`
        .toLowerCase()
        .trim();
      const searchMatch = !normalizedSearch || text.includes(normalizedSearch);

      return categoryMatch && searchMatch;
    });
  }, [activeCategory, posts, search]);

  const suggestedPosts = useMemo(() => {
    if (!userInterests.length) return filteredPosts;

    const preferred = filteredPosts.filter((post) => userInterests.includes(post.danh_muc));
    const others = filteredPosts.filter((post) => !userInterests.includes(post.danh_muc));

    return [...preferred, ...others];
  }, [filteredPosts, userInterests]);

  const handleFileChange = (e) => {
    const incomingFiles = Array.from(e.target.files || []);
    if (!incomingFiles.length) return;

    const limitedFiles = [...selectedMedia, ...incomingFiles].slice(0, 5);
    previewMedia.forEach((item) => URL.revokeObjectURL(item.url));
    setSelectedMedia(limitedFiles);
    setPreviewMedia(
      limitedFiles.map((file) => ({
        type: file.type.startsWith("video/") ? "video" : "image",
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    );
  };

  const removeMedia = (index) => {
    const nextFiles = selectedMedia.filter((_, i) => i !== index);
    previewMedia.forEach((item) => URL.revokeObjectURL(item.url));
    setSelectedMedia(nextFiles);
    setPreviewMedia(
      nextFiles.map((file) => ({
        type: file.type.startsWith("video/") ? "video" : "image",
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    );
  };

  const resetCreateForm = () => {
    previewMedia.forEach((item) => URL.revokeObjectURL(item.url));
    setForm({
      tieu_de: "",
      danh_muc: "Nghỉ dưỡng",
      noi_dung: "",
    });
    setSelectedMedia([]);
    setPreviewMedia([]);
    setCompliance(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();

    if (!form.noi_dung.trim() && selectedMedia.length === 0) {
      toast.error("Vui lòng nhập nội dung hoặc chọn ít nhất một media.");
      return;
    }

    try {
      setPosting(true);
      const formData = new FormData();
      formData.append("tieu_de", form.tieu_de || "Khám phá");
      formData.append("danh_muc", form.danh_muc);
      formData.append("noi_dung", form.noi_dung);
      selectedMedia.forEach((file) => formData.append("hinh_anh", file));

      const res = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setCompliance(res.data.compliance || null);
      toast.success("Đăng bài thành công.");
      await fetchExplorePosts();
      resetCreateForm();
    } catch (err) {
      toast.error(err.response?.data?.message || "Đăng bài thất bại.");
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-4 border-blue-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
            Đang tải Khám phá...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 pb-10 pt-6">
        <div className="col-span-3 hidden lg:block">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-6">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <h1 className="mb-2 text-3xl font-black text-slate-900">Khám phá</h1>
            <p className="text-sm text-slate-500">
              Bài viết du lịch được ưu tiên theo đánh giá cộng đồng, media và mức độ phù hợp với sở thích của bạn.
            </p>
          </div>

          {isTourism && (
            <form
              onSubmit={handleCreatePost}
              className="space-y-4 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-black text-slate-800">Đăng bài khám phá</h2>
                <span className="rounded-full bg-indigo-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  Khu du lịch
                </span>
              </div>

              <input
                value={form.tieu_de}
                onChange={(e) => setForm((prev) => ({ ...prev, tieu_de: e.target.value }))}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
                placeholder="Tiêu đề bài viết"
              />

              <select
                value={form.danh_muc}
                onChange={(e) => setForm((prev) => ({ ...prev, danh_muc: e.target.value }))}
                className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
              >
                {EXPLORE_CATEGORIES.filter((item) => item !== "Tất cả").map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>

              <textarea
                rows="4"
                value={form.noi_dung}
                onChange={(e) => setForm((prev) => ({ ...prev, noi_dung: e.target.value }))}
                className="w-full rounded-[1.6rem] border border-slate-100 bg-slate-50 px-5 py-4 font-medium text-slate-700 outline-none focus:border-blue-300"
                placeholder="Chia sẻ trải nghiệm, ưu đãi, hoạt động nổi bật..."
              />

              <div className="space-y-4 rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-black text-slate-700">Media bài khám phá</p>
                    <p className="text-xs text-slate-500">Bạn có thể đăng cả hình ảnh và video trong cùng một bài.</p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-blue-600 transition-all hover:bg-blue-50"
                    >
                      <ImagePlus size={16} /> Thêm ảnh
                    </button>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-black text-rose-600 transition-all hover:bg-rose-50"
                    >
                      <Video size={16} /> Đăng video
                    </button>
                  </div>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                />

                {previewMedia.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {previewMedia.map((item, index) => (
                      <div
                        key={`${item.name}-${index}`}
                        className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100"
                      >
                        {item.type === "video" ? (
                          <>
                            <video src={item.url} className="h-full w-full object-cover" muted playsInline />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="rounded-full bg-white/90 p-3 text-slate-900">
                                <PlayCircle size={24} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <img src={item.url} alt={`Xem trước ${index + 1}`} className="h-full w-full object-cover" />
                        )}
                        <div className="absolute bottom-2 left-2 rounded-full bg-slate-900/70 px-2 py-1 text-[10px] font-black uppercase text-white">
                          {item.type === "video" ? "Video" : "Ảnh"}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMedia(index)}
                          className="absolute right-2 top-2 rounded-full bg-slate-900/70 p-2 text-white opacity-0 transition-all group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
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
                    <span>{compliance.score}/100</span>
                  </div>
                  <p className="mt-1 text-sm font-bold">{compliance.summary}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={posting}
                className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition-all hover:bg-blue-700 disabled:opacity-60"
              >
                {posting ? "Đang đăng..." : "Đăng bài"}
              </button>
            </form>
          )}

          <div className="space-y-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-100 bg-slate-50 px-5 py-4 font-medium text-slate-700 outline-none focus:border-blue-300"
              placeholder="Tìm theo tiêu đề, nội dung hoặc tên khu du lịch"
            />

            <div className="flex flex-wrap gap-3">
              {personalizedCategories.map((category) => {
                const active = activeCategory === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setActiveCategory(category)}
                    className={`rounded-full border px-4 py-2.5 text-xs font-black transition-all ${
                      active
                        ? "border-slate-900 bg-slate-900 text-white"
                        : userInterests.includes(category)
                          ? "border-blue-200 bg-blue-50 text-blue-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-6">
            {suggestedPosts.length > 0 ? (
              suggestedPosts.map((post) => (
                <ExplorePostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onRefresh={fetchExplorePosts}
                />
              ))
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-white p-12 text-center text-slate-400 shadow-sm">
                <p className="mb-3 text-2xl">Không có bài phù hợp</p>
                <p className="text-sm">Hãy đổi danh mục hoặc từ khóa để xem thêm gợi ý.</p>
              </div>
            )}
          </div>
        </div>

        <div className="col-span-3 hidden space-y-6 xl:block">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
              Ưu tiên hiển thị
            </h2>
            <p className="text-sm leading-relaxed text-slate-600">
              Bài viết được ưu tiên theo điểm đánh giá cộng đồng, số lượng đánh giá, media và lượt thích.
            </p>
          </div>

          {userInterests.length > 0 && (
            <div className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                Sở thích của bạn
              </h2>
              <div className="flex flex-wrap gap-2">
                {userInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExplorePage;
