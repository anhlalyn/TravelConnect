import React from "react";
import {
  BarChart3,
  Bookmark,
  ClipboardList,
  Compass,
  Layers,
  Map,
  Radio,
  ShieldCheck,
  Star,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { buildUploadUrl } from "../config";
import { getTrustBadge } from "../utils/trustBadge";

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path) => location.pathname === path;
  const isTourist = user?.vai_tro === "khach_du_lich";
  const trustBadge = getTrustBadge(user?.diem_tin_cay);

  const userMenu = [
    {
      icon: <Compass size={20} />,
      label: "Khám Phá",
      path: "/explore",
      color: "text-purple-600",
      activeBg: "bg-purple-50",
    },
    {
      icon: <Users size={20} />,
      label: "Bạn Bè",
      path: "/friends",
      color: "text-orange-600",
      activeBg: "bg-orange-50",
    },
    {
      icon: <Map size={20} />,
      label: "Lịch Trình",
      path: "/trips",
      color: "text-red-600",
      activeBg: "bg-red-50",
    },
    {
      icon: <Radio size={20} />,
      label: "Live Stream",
      path: "/live",
      color: "text-pink-600",
      activeBg: "bg-pink-50",
    },
    {
      icon: <Wallet size={20} />,
      label: "Ví & Thanh Toán",
      path: "/payment",
      color: "text-emerald-600",
      activeBg: "bg-emerald-50",
    },
    {
      icon: <Bookmark size={20} />,
      label: "Đã Lưu",
      path: "/saved-posts",
      color: "text-amber-600",
      activeBg: "bg-amber-50",
    },
  ];

  const businessMenu = [
    {
      icon: <Compass size={20} />,
      label: "Khám Phá",
      path: "/explore",
      color: "text-purple-600",
      activeBg: "bg-purple-50",
    },
    {
      icon: <Users size={20} />,
      label: "Bạn Bè",
      path: "/friends",
      color: "text-orange-600",
      activeBg: "bg-orange-50",
    },
    {
      icon: <Map size={20} />,
      label: "Lịch Trình",
      path: "/trips",
      color: "text-red-600",
      activeBg: "bg-red-50",
    },
    {
      icon: <Radio size={20} />,
      label: "Live Stream",
      path: "/live",
      color: "text-pink-600",
      activeBg: "bg-pink-50",
    },
    {
      icon: <ClipboardList size={20} />,
      label: "Quản Lý Đặt Vé",
      path: "/booking-management",
      color: "text-orange-600",
      activeBg: "bg-orange-50",
      badge: true,
    },
    {
      icon: <Layers size={20} />,
      label: "Gói Dịch Vụ",
      path: "/kdl/services",
      color: "text-blue-600",
      activeBg: "bg-blue-50",
    },
    {
      icon: <Wallet size={20} />,
      label: "Doanh Thu & Rút Tiền",
      path: "/payment",
      color: "text-emerald-600",
      activeBg: "bg-emerald-50",
    },
    {
      icon: <Star size={20} />,
      label: "Đánh Giá Khách",
      path: "/kdl/reviews",
      color: "text-amber-500",
      activeBg: "bg-amber-50",
    },
    {
      icon: <BarChart3 size={20} />,
      label: "Thống Kê",
      path: "/analytics",
      color: "text-cyan-600",
      activeBg: "bg-cyan-50",
    },
  ];

  const adminMenu = [
    {
      icon: <BarChart3 size={20} />,
      label: "Trung Tâm Admin",
      path: "/admin",
      color: "text-slate-700",
      activeBg: "bg-slate-100",
    },
    ...businessMenu,
  ];

  const currentMenu =
    user?.vai_tro === "admin"
      ? adminMenu
      : user?.vai_tro === "khu_du_lich"
        ? businessMenu
        : userMenu;

  const roleLabel =
    user?.vai_tro === "admin"
      ? "Quản trị hệ thống"
      : user?.vai_tro === "khu_du_lich"
        ? "Đối tác KDL"
        : "Khách du lịch";

  return (
    <div className="sticky top-20 space-y-4">
      <div className="flex flex-col items-center gap-3 rounded-[2.5rem] border border-gray-100 bg-white p-6 text-center shadow-sm transition-all hover:shadow-md">
        <div
          className={`relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.8rem] shadow-xl transition-transform hover:rotate-3 ${
            user?.vai_tro === "khu_du_lich" ? "bg-indigo-600" : "bg-blue-600"
          }`}
        >
          {user?.anh_dai_dien ? (
            <img
              src={buildUploadUrl(user.anh_dai_dien)}
              className="h-full w-full object-cover"
              alt="Avatar"
            />
          ) : (
            <span className="text-3xl font-black uppercase text-white">
              {user?.ten?.charAt(0) || "U"}
            </span>
          )}

          {(user?.vai_tro === "khu_du_lich" || user?.vai_tro === "admin") && (
            <div className="absolute bottom-1 right-1 rounded-full bg-white p-0.5 shadow-sm">
              <ShieldCheck
                size={14}
                className="text-indigo-600"
                fill="currentColor"
                stroke="white"
              />
            </div>
          )}
        </div>

        <div className="mt-2 space-y-2">
          <p className="max-w-[180px] truncate text-base font-black text-slate-800">
            {user?.ten || "Người dùng"}
          </p>

          <div className="flex justify-center">
            <span
              className={`rounded-full border px-3 py-1 text-[9px] font-black uppercase tracking-widest ${
                user?.vai_tro === "khu_du_lich"
                  ? "border-indigo-100 bg-indigo-50 text-indigo-500"
                  : "border-blue-100 bg-blue-50 text-blue-500"
              }`}
            >
              {roleLabel}
            </span>
          </div>

          {isTourist && (
            <div
              className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-wide ${trustBadge.className}`}
            >
              {trustBadge.icon}
              <span>{trustBadge.label}</span>
              <span className="opacity-70">
                • {user?.diem_tin_cay || 0} diem
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-1 rounded-[2.5rem] border border-gray-100 bg-white p-3 shadow-sm">
        {currentMenu.map((item, index) => {
          const active = isActive(item.path);

          return (
            <button
              key={index}
              onClick={() => navigate(item.path)}
              className={`group flex w-full items-center justify-between rounded-2xl p-4 text-[12px] font-black uppercase tracking-tight transition-all ${
                active
                  ? `${item.activeBg} ${item.color} translate-x-1 shadow-sm`
                  : "text-slate-500 hover:bg-gray-50 hover:text-slate-800"
              }`}
            >
              <div className="flex items-center gap-3">
                <span
                  className={`${active ? item.color : "text-slate-400 group-hover:text-slate-600"} transition-colors`}
                >
                  {item.icon}
                </span>
                {item.label}
              </div>

              {item.badge && (
                <span
                  className={`flex h-2 w-2 rounded-full ${active ? "bg-current" : "animate-pulse bg-red-500"}`}
                />
              )}
            </button>
          );
        })}
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white">
        <p className="mb-1 text-[10px] font-black uppercase opacity-50">
          Can ho tro?
        </p>
        <p className="relative z-10 text-xs font-bold leading-relaxed">
          Lien he tong dai TravelConnect 24/7
        </p>
        <Zap
          size={60}
          className="absolute -bottom-4 -right-4 rotate-12 text-white/5"
        />
      </div>
    </div>
  );
};

export default Sidebar;
