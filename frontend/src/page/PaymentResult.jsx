import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  Clock3,
  Download,
  MapPin,
  ShieldCheck,
  Ticket,
  Wallet,
} from "lucide-react";
import Navbar from "../components/Navbar";
import AnimatedPage from "../components/AnimatedPage";

const TicketInfo = ({ icon: Icon, label, value, align = "left" }) => (
  <div className={`space-y-1 ${align === "right" ? "text-right" : ""}`}>
    <p
      className={`text-[9px] font-black text-slate-300 uppercase tracking-widest flex items-center gap-2 ${
        align === "right" ? "justify-end" : ""
      }`}
    >
      {Icon ? <Icon size={12} className="text-blue-500" /> : null}
      {label}
    </p>
    <p className="font-black text-slate-700 italic">{value}</p>
  </div>
);

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
};

const formatDate = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleDateString("vi-VN");
};

const getMethodLabel = (value) => {
  switch (value) {
    case "single":
      return "Vé đơn lẻ";
    case "multi":
      return "Gói liên kết";
    default:
      return value || "--";
  }
};

const PaymentResult = ({ user }) => {
  const navigate = useNavigate();
  const { state } = useLocation();
  const ticket = state?.ticket;

  useEffect(() => window.scrollTo(0, 0), []);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
          <Ticket size={40} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 uppercase italic">
          Không tìm thấy vé
        </h2>
        <button
          onClick={() => navigate("/payment")}
          className="mt-8 px-10 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const { id, ten_kdl, dia_chi, ngay_den, ngay_tao, ma_tra_cuu, phuong_thuc, so_luong } = ticket;

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-[#F8FAFC] pb-24 text-slate-800">
        <Navbar user={user} />
        <div className="max-w-2xl mx-auto pt-10 px-4">
          <header className="text-center mb-10">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-[2.2rem] flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-500/10">
              <CheckCircle2 size={40} className="animate-bounce" />
            </div>
            <h2 className="text-3xl font-black italic tracking-tighter uppercase">
              Đặt vé thành công
            </h2>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-2">
              TravelConnect Official Ticket
            </p>
          </header>

          <main className="bg-white rounded-[3.5rem] shadow-2xl shadow-blue-900/10 overflow-hidden border-t-[12px] border-blue-600 relative border border-slate-100">
            <div className="p-12 pb-8 flex justify-between items-start">
              <div className="space-y-2">
                <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-blue-100">
                  E-Ticket Official
                </span>
                <h3 className="text-3xl font-black text-slate-800 tracking-tighter uppercase">
                  {ten_kdl || "Địa điểm du lịch"}
                </h3>
              </div>
              <div className="p-4 bg-slate-50 rounded-[1.5rem]">
                <Ticket className="text-blue-600 rotate-12" size={40} />
              </div>
            </div>

            <div className="px-12 grid grid-cols-2 gap-y-10 pb-12">
              <TicketInfo icon={Calendar} label="Ngày đến" value={formatDate(ngay_den || ngay_tao)} />
              <TicketInfo label="Trạng thái" value="Đã thanh toán" align="right" />
              <TicketInfo icon={Clock3} label="Đặt lúc" value={formatDateTime(ngay_tao)} />
              <TicketInfo
                icon={Wallet}
                label="Loại vé"
                value={`${getMethodLabel(phuong_thuc)} • ${so_luong || 1} vé`}
                align="right"
              />
              <div className="col-span-2">
                <TicketInfo
                  icon={MapPin}
                  label="Địa chỉ điểm đến"
                  value={dia_chi || "Thông tin địa điểm đang được cập nhật"}
                />
              </div>
            </div>

            <div className="relative h-px border-t-2 border-dashed border-slate-200 mx-10">
              <div className="absolute -left-16 -top-5 w-10 h-10 bg-[#F8FAFC] rounded-full border border-slate-100" />
              <div className="absolute -right-16 -top-5 w-10 h-10 bg-[#F8FAFC] rounded-full border border-slate-100" />
            </div>

            <div className="p-12 bg-slate-50/50 flex flex-col items-center text-center space-y-6">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-xl border-4 border-white transition-transform hover:scale-105">
                <QRCodeCanvas
                  value={`TC-VERIFY-ID-${id}-${ma_tra_cuu}`}
                  size={160}
                  level="H"
                  fgColor="#1e293b"
                />
              </div>
              <div className="space-y-1">
                <p className="font-black text-3xl text-blue-600 tracking-[0.4em] uppercase leading-none">
                  #{ma_tra_cuu || id}
                </p>
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                  <ShieldCheck size={14} className="text-emerald-500" /> Đã xác thực bởi
                  TravelConnect
                </div>
              </div>
            </div>
          </main>

          <footer className="grid grid-cols-2 gap-4 mt-10">
            <button
              onClick={() => window.print()}
              className="py-5 bg-white border-2 border-slate-100 text-slate-800 rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 hover:bg-slate-50 transition-all active:scale-95"
            >
              <Download size={18} /> Lưu PDF
            </button>
            <button
              onClick={() => navigate("/home")}
              className="py-5 bg-blue-600 text-white rounded-3xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-200 hover:bg-slate-900 transition-all active:scale-95 group"
            >
              Trang chủ
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </footer>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default PaymentResult;
