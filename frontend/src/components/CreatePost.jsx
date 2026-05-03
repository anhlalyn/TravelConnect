import React, { useEffect, useRef, useState } from "react";
import { Check, ImagePlus, MapPin, Search, Sparkles, Video, X } from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import { buildUploadUrl } from "../config";

const CreatePost = ({ user, onPostSuccess }) => {
  const [noiDung, setNoiDung] = useState("");
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [searchKdl, setSearchKdl] = useState("");
  const [listKdl, setListKdl] = useState([]);
  const [selectedKdl, setSelectedKdl] = useState(null);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (showLocationModal) {
      api
        .get("/users/suggest-kdl")
        .then((res) => {
          setListKdl(res.data.data || []);
        })
        .catch(() => toast.error("Không thể tải danh sách địa điểm."));
    }
  }, [showLocationModal]);

  useEffect(() => {
    return () => {
      previews.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, [previews]);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    const limitedFiles = [...files, ...selectedFiles].slice(0, 5);

    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setFiles(limitedFiles);
    setPreviews(
      limitedFiles.map((file) => ({
        type: file.type.startsWith("video/") ? "video" : "image",
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    );
  };

  const removeMedia = (index) => {
    const nextFiles = files.filter((_, i) => i !== index);
    previews.forEach((item) => URL.revokeObjectURL(item.url));
    setFiles(nextFiles);
    setPreviews(
      nextFiles.map((file) => ({
        type: file.type.startsWith("video/") ? "video" : "image",
        url: URL.createObjectURL(file),
        name: file.name,
      })),
    );
  };

  const handlePublish = async () => {
    if (!noiDung.trim() && files.length === 0) return;

    try {
      const formData = new FormData();
      formData.append("tieu_de", "Khám phá");
      formData.append("noi_dung", noiDung);

      if (selectedKdl) {
        formData.append("id_kdl_gan_the", selectedKdl.id);
        formData.append("ten_kdl_gan_the", selectedKdl.ten_khu_du_lich || selectedKdl.ten);
      }

      files.forEach((file) => formData.append("hinh_anh", file));

      const res = await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.data.success) {
        toast.success("Đăng bài thành công.");
        previews.forEach((item) => URL.revokeObjectURL(item.url));
        setNoiDung("");
        setFiles([]);
        setPreviews([]);
        setSelectedKdl(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (onPostSuccess) onPostSuccess();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể đăng bài.");
    }
  };

  return (
    <div className="mb-6 rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-4 flex gap-4">
        <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-white bg-blue-600 shadow-sm">
          {user?.anh_dai_dien ? (
            <img src={buildUploadUrl(user.anh_dai_dien)} className="h-full w-full object-cover" alt="Người dùng" />
          ) : (
            <span className="flex h-full w-full items-center justify-center font-black text-white">
              {user?.ten?.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex-1 space-y-3">
          <textarea
            className="min-h-[120px] w-full resize-none rounded-[1.8rem] bg-gray-50 p-5 text-[15px] outline-none transition-all focus:bg-white focus:ring-4 focus:ring-blue-50"
            placeholder={`${user?.ten || "Bạn"} ơi, hôm nay đi đâu thế?`}
            value={noiDung}
            onChange={(e) => setNoiDung(e.target.value)}
          />

          {selectedKdl && (
            <div className="inline-flex items-center gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-2 text-blue-600">
              <MapPin size={14} />
              <span className="text-xs font-black uppercase tracking-tight">
                {selectedKdl.ten_khu_du_lich || selectedKdl.ten}
              </span>
              <button onClick={() => setSelectedKdl(null)} className="transition-colors hover:text-red-500">
                <X size={14} />
              </button>
            </div>
          )}

        </div>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3 px-2 pb-4 md:grid-cols-4">
          {previews.map((item, index) => (
            <div key={`${item.name}-${index}`} className="group relative h-28 overflow-hidden rounded-2xl bg-slate-100 shadow-md">
              {item.type === "video" ? (
                <video src={item.url} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={item.url} className="h-full w-full object-cover" alt="Xem trước" />
              )}
              <div className="absolute bottom-2 left-2 rounded-lg bg-slate-900/70 px-2 py-1 text-[10px] font-black uppercase text-white">
                {item.type === "video" ? "Video" : "Ảnh"}
              </div>
              <button
                onClick={() => removeMedia(index)}
                className="absolute right-1 top-1 rounded-lg bg-black/50 p-1 text-white opacity-0 transition-all group-hover:opacity-100"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-gray-50 pt-4">
        <div className="flex flex-wrap gap-2">
          <input
            type="file"
            hidden
            ref={fileInputRef}
            multiple
            accept="image/*,video/*"
            onChange={handleFileChange}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
          >
            <ImagePlus size={20} />
            <span className="hidden sm:inline">Thêm ảnh</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold text-gray-500 transition-all hover:bg-rose-50 hover:text-rose-600"
          >
            <Video size={20} />
            <span className="hidden sm:inline">Đăng video</span>
          </button>

          <button
            onClick={() => setShowLocationModal(true)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-all ${
              selectedKdl ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <MapPin size={20} />
            <span className="hidden sm:inline">Gắn thẻ địa điểm</span>
          </button>
        </div>

        <button
          onClick={handlePublish}
          disabled={!noiDung.trim() && files.length === 0}
          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-8 py-2.5 text-sm font-black text-white shadow-lg shadow-blue-100 transition-all active:scale-95 hover:bg-slate-900 disabled:opacity-30"
        >
          Đăng bài <Sparkles size={16} />
        </button>
      </div>

      {showLocationModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md overflow-hidden rounded-[2.5rem] bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 bg-gray-50/50 p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                Chọn địa điểm du lịch
              </h3>
              <button onClick={() => setShowLocationModal(false)} className="rounded-full p-2 transition-colors hover:bg-gray-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-4">
              <div className="relative mb-4">
                <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm tên khu du lịch..."
                  className="w-full rounded-2xl border-2 border-transparent bg-gray-100 py-3 pl-12 pr-4 text-sm font-bold outline-none transition-all focus:border-blue-100 focus:bg-white"
                  value={searchKdl}
                  onChange={(e) => setSearchKdl(e.target.value)}
                />
              </div>

              <div className="max-h-[300px] space-y-2 overflow-y-auto">
                {listKdl
                  .filter((item) => (item.ten_khu_du_lich || item.ten).toLowerCase().includes(searchKdl.toLowerCase()))
                  .map((item) => (
                    <button
                      key={item.id}
                      onClick={() => {
                        setSelectedKdl(item);
                        setShowLocationModal(false);
                      }}
                      className="group flex w-full items-center justify-between rounded-2xl p-4 transition-all hover:bg-blue-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="rounded-xl bg-white p-2 shadow-sm transition-colors group-hover:text-blue-600">
                          <MapPin size={16} />
                        </div>
                        <span className="text-sm font-bold text-slate-700">{item.ten_khu_du_lich || item.ten}</span>
                      </div>
                      {selectedKdl?.id === item.id && <Check size={18} className="text-blue-600" />}
                    </button>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreatePost;
