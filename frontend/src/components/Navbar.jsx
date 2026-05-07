import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  Calendar,
  ChevronDown,
  Home,
  LogOut,
  MessageSquare,
  Navigation,
  Search,
  Settings as SettingsIcon,
  ShieldCheck,
  Ticket,
  User,
  Wallet,
} from "lucide-react";
import api from "../api";
import { buildUploadUrl } from "../config";
import { getTrustBadge } from "../utils/trustBadge";

const Navbar = ({ user }) => {
  const navigate = useNavigate();
  const searchRef = useRef(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNoti, setShowNoti] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState({ users: [], posts: [] });

  useEffect(() => {
    if (!user) return;

    let active = true;

    const loadNotifications = async () => {
      try {
        const res = await api.get("/notifications");
        if (active && res.data.success) {
          setNotifications(res.data.data);
        }
      } catch (err) {
        console.error("Lỗi lấy thông báo:", err);
      }
    };

    loadNotifications();

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;

    const keyword = searchTerm.trim();
    if (!keyword) {
      setSearchResults({ users: [], posts: [] });
      setSearchLoading(false);
      return;
    }

    let active = true;
    setSearchLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await api.get("/users/search", { params: { q: keyword } });
        if (active && res.data.success) {
          setSearchResults(res.data.data || { users: [], posts: [] });
        }
      } catch (err) {
        if (active) {
          console.error("Lỗi tìm kiếm:", err);
          setSearchResults({ users: [], posts: [] });
        }
      } finally {
        if (active) setSearchLoading(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm, user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!searchRef.current?.contains(event.target)) {
        setShowSearchResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/mark-read");
      const res = await api.get("/notifications");
      if (res.data.success) setNotifications(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const unreadCount = notifications.filter((n) => !n.da_xem).length;
  const isTourist = user?.vai_tro === "khach_du_lich";
  const trustBadge = getTrustBadge(user?.diem_tin_cay);
  const totalSearchResults =
    (searchResults.users?.length || 0) + (searchResults.posts?.length || 0);
  const roleLabel =
    user?.vai_tro === "admin"
      ? "Quản trị hệ thống"
      : user?.vai_tro === "khu_du_lich"
        ? "Đối tác KDL"
        : "Khách du lịch";

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white px-6 py-2 shadow-sm">
      <div className="mx-auto flex h-14 max-w-[1600px] items-center">
        <div className="flex flex-1 items-center gap-4">
          <div
            className="group flex shrink-0 cursor-pointer items-center gap-2"
            onClick={() => navigate("/home")}
          >
            <div className="rounded-xl bg-blue-600 p-2 text-white shadow-lg shadow-blue-100 transition-transform group-hover:rotate-12">
              <Navigation size={22} fill="currentColor" />
            </div>
            <span className="hidden text-xl font-black italic tracking-tighter text-blue-600 lg:block">
              TravelConnect
            </span>
          </div>

          <div
            ref={searchRef}
            className="relative hidden w-full max-w-[360px] md:block"
          >
            <div className="flex items-center rounded-2xl border border-transparent bg-gray-50 px-4 py-2 transition-all focus-within:border-blue-200 focus-within:bg-white">
              <Search size={18} className="text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSearchResults(true);
                }}
                onFocus={() => setShowSearchResults(true)}
                placeholder="Tìm người dùng, khu du lịch, bài việt..."
                className="ml-2 w-full border-none bg-transparent text-sm font-bold text-slate-700 outline-none placeholder:text-gray-400"
              />
            </div>

            {showSearchResults && (
              <div className="absolute left-0 right-0 z-30 mt-3 overflow-hidden rounded-[2rem] border border-gray-100 bg-white py-3 shadow-2xl">
                {!searchTerm.trim() ? (
                  <div className="px-5 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Nhập từ khóa để tìm kiếm
                  </div>
                ) : searchLoading ? (
                  <div className="px-5 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Đang tìm kiếm...
                  </div>
                ) : totalSearchResults > 0 ? (
                  <div className="max-h-[420px] overflow-y-auto">
                    {searchResults.users?.length > 0 && (
                      <div className="mb-2">
                        <p className="px-5 pb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Người dùng và khu du lịch
                        </p>
                        {searchResults.users.map((item) => (
                          <button
                            key={`user-${item.id}`}
                            onClick={() => {
                              navigate(`/profile/${item.id}`);
                              setShowSearchResults(false);
                              setSearchTerm("");
                            }}
                            className="flex w-full items-center gap-3 px-5 py-3 text-left transition-all hover:bg-slate-50"
                          >
                            <div className="h-11 w-11 overflow-hidden rounded-xl bg-blue-600 shadow-sm">
                              {item.anh_dai_dien ? (
                                <img
                                  src={buildUploadUrl(item.anh_dai_dien)}
                                  className="h-full w-full object-cover"
                                  alt="avatar"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center font-black text-white">
                                  {(
                                    item.ten_khu_du_lich ||
                                    item.ten ||
                                    "U"
                                  ).charAt(0)}
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-slate-800">
                                {item.ten_khu_du_lich || item.ten}
                              </p>
                              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                {item.vai_tro === "khu_du_lich"
                                  ? item.tinh_thanh || "Khu du lịch"
                                  : "Người dùng"}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchResults.posts?.length > 0 && (
                      <div>
                        <p className="px-5 pb-2 pt-1 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          Bài việt
                        </p>
                        {searchResults.posts.map((item) => (
                          <button
                            key={`post-${item.id}`}
                            onClick={() => {
                              navigate(`/post/${item.id}`);
                              setShowSearchResults(false);
                              setSearchTerm("");
                            }}
                            className="flex w-full items-start gap-3 px-5 py-3 text-left transition-all hover:bg-slate-50"
                          >
                            <div className="h-11 w-11 overflow-hidden rounded-xl bg-slate-100 shadow-sm">
                              {item.hinh_anh_json?.[0] ? (
                                <img
                                  src={buildUploadUrl(item.hinh_anh_json[0])}
                                  className="h-full w-full object-cover"
                                  alt="post"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-slate-400">
                                  <Search size={16} />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-black text-slate-800">
                                {item.tieu_de || "Bài việt"}
                              </p>
                              <p className="truncate text-[11px] font-medium text-slate-500">
                                {item.ten_khu_du_lich || item.ten_nguoi_dang} •{" "}
                                {item.danh_muc || "Tổng hợp"}
                              </p>
                              <p className="line-clamp-1 text-[11px] text-slate-400">
                                {item.noi_dung}
                              </p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="px-5 py-6 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                    Không tìm thấy kết quả
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center gap-2 md:gap-8">
          <button
            onClick={() => navigate("/home")}
            className="group relative rounded-2xl p-3 text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
          >
            <Home size={26} />
          </button>

          <button
            onClick={() => navigate("/messages")}
            className="group relative rounded-2xl p-3 text-gray-500 transition-all hover:bg-blue-50 hover:text-blue-600"
          >
            <MessageSquare size={26} />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full border-2 border-white bg-red-500" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNoti(!showNoti);
                setShowDropdown(false);
              }}
              className={`relative rounded-2xl p-3 transition-all ${
                showNoti
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-500 hover:bg-gray-50"
              }`}
            >
              <Bell size={26} />
              {unreadCount > 0 && (
                <span className="absolute right-2.5 top-2 flex h-4 w-4 animate-bounce items-center justify-center rounded-full border-2 border-white bg-orange-500 text-[10px] font-bold text-white">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNoti && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowNoti(false)}
                />
                <div className="absolute left-1/2 z-20 mt-4 w-80 -translate-x-1/2 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white py-4 shadow-2xl md:w-96">
                  <div className="mb-2 flex items-center justify-between border-b border-gray-50 px-6 py-2">
                    <h3 className="text-[11px] font-black uppercase tracking-widest italic text-slate-800">
                      Thông báo
                    </h3>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[9px] font-black text-blue-600 hover:underline"
                    >
                      Đọc tất cả
                    </button>
                  </div>

                  <div className="custom-scrollbar max-h-[380px] overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((noti) => (
                        <div
                          key={noti.id}
                          className={`relative flex cursor-pointer gap-3 px-6 py-4 transition-all hover:bg-slate-50 ${
                            !noti.da_xem ? "bg-indigo-50/40" : ""
                          }`}
                          onClick={() => {
                            setShowNoti(false);
                            navigate(
                              noti.loai_thong_bao === "ket_ban"
                                ? "/friends"
                                : "/home",
                            );
                          }}
                        >
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-blue-600 shadow-sm">
                            {noti.anh_dai_dien ? (
                              <img
                                src={buildUploadUrl(noti.anh_dai_dien)}
                                className="h-full w-full object-cover"
                                alt="avatar"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-xs font-black text-white">
                                {noti.ten_nguoi_gui?.charAt(0)}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-[12.5px] leading-snug text-slate-700">
                              <span className="font-black text-slate-900">
                                {noti.ten_nguoi_gui}
                              </span>{" "}
                              {noti.noi_dung}
                            </p>
                            <p className="mt-1 text-[9px] font-bold uppercase italic tracking-tighter text-slate-400">
                              Vừa xong
                            </p>
                          </div>
                          {!noti.da_xem && (
                            <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                          )}
                        </div>
                      ))
                    ) : (
                      <div className="py-12 text-center text-[10px] font-black uppercase tracking-widest text-slate-300">
                        Chưa có thông báo
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      navigate("/notifications");
                      setShowNoti(false);
                    }}
                    className="mt-2 w-full border-t border-gray-50 pb-2 pt-4 text-center text-[10px] font-black uppercase tracking-widest text-slate-400 transition-all hover:text-blue-600"
                  >
                    Xem tất cả thông báo
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-end">
          <div className="relative">
            <button
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowNoti(false);
              }}
              className="flex items-center gap-3 rounded-2xl border border-transparent bg-gray-50 p-1.5 pl-3 shadow-sm transition-all hover:border-gray-200"
            >
              <div className="hidden text-right sm:block">
                <p className="text-[11px] font-black leading-none text-slate-800">
                  {user?.ten?.split(" ").pop() || "User"}
                </p>
                <p className="mt-1 text-[8px] font-bold uppercase italic tracking-tighter text-blue-500">
                  Trực tuyến
                </p>
              </div>
              <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl border-2 border-white bg-blue-600 shadow-sm">
                {user?.anh_dai_dien ? (
                  <img
                    src={buildUploadUrl(user.anh_dai_dien)}
                    className="h-full w-full object-cover"
                    alt="avatar"
                  />
                ) : (
                  <span className="flex h-full w-full items-center justify-center font-bold uppercase text-white">
                    {user?.ten?.charAt(0)}
                  </span>
                )}
              </div>
              <ChevronDown
                size={14}
                className={`text-gray-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
              />
            </button>

            {showDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 z-20 mt-3 w-60 rounded-[2rem] border border-gray-100 bg-white py-3 shadow-2xl">
                  <div className="border-b border-gray-50 px-6 py-4">
                    <p className="truncate text-sm font-black text-slate-800">
                      {user?.ten}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase italic tracking-wider text-blue-500">
                      {roleLabel}
                    </p>
                    {isTourist && (
                      <div
                        className={`mt-2 inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${trustBadge.className}`}
                      >
                        {trustBadge.icon}
                        <span>{trustBadge.label}</span>
                        <span className="opacity-70">
                          • {user?.diem_tin_cay || 0} diem
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1 p-2">
                    {user?.vai_tro === "admin" && (
                      <button
                        onClick={() => {
                          navigate("/admin");
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900"
                      >
                        <ShieldCheck size={18} /> Trung tâm Admin
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate(`/profile/${user.id}`);
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                    >
                      <User size={18} /> Hồ sơ
                    </button>
                    <button
                      onClick={() => {
                        navigate("/my-bookings");
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-blue-50 hover:text-blue-600"
                    >
                      <Ticket size={18} /> Vé của tôi
                    </button>
                    <button
                      onClick={() => {
                        navigate("/payment?action=withdraw");
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-emerald-50 hover:text-emerald-600"
                    >
                      <Wallet size={18} /> Rút tiền
                    </button>
                    {user?.vai_tro === "khu_du_lich" && (
                      <button
                        onClick={() => {
                          navigate("/booking-management");
                          setShowDropdown(false);
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-green-50 hover:text-green-600"
                      >
                        <Calendar size={18} /> Quản lý đặt vé
                      </button>
                    )}
                    <button
                      onClick={() => {
                        navigate("/settings");
                        setShowDropdown(false);
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-slate-600 transition-all hover:bg-gray-50"
                    >
                      <SettingsIcon size={18} /> Cài đặt
                    </button>
                    <div className="mx-4 my-1 h-px bg-gray-50" />
                    <button
                      onClick={() => {
                        localStorage.clear();
                        window.dispatchEvent(new Event("auth-change"));
                        navigate("/login");
                      }}
                      className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-bold text-red-500 transition-all hover:bg-red-50"
                    >
                      <LogOut size={18} /> Đăng xuất
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
