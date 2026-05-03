import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowRight,
  Calendar,
  Clock,
  Layers,
  Map,
  MessageSquareText,
  MousePointer2,
  ShieldCheck,
  Sparkles,
  Ticket,
  Users,
  Wallet,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import AnimatedPage from "../components/AnimatedPage";

const PAYMENT_DRAFT_PREFIX = "pending_invoice_";
const timelineTimes = ["08:30", "10:30", "13:30", "16:00", "18:00"];

const buildMultiTimeline = (destinationName, linkedDestinations) => {
  const allStops = [
    {
      name: destinationName,
      activity: "Check-in và bắt đầu hành trình tại khu du lịch chính",
    },
    ...linkedDestinations.map((item) => ({
      name: item.ten_khu_du_lich || item.ten || item.tinh_thanh || "Khu du lịch liên kết",
      activity: `Khám phá khu liên kết ${item.ten_khu_du_lich || item.ten}`,
    })),
  ];

  return allStops.map((step, index) => ({
    time: timelineTimes[index] || `${8 + index}:00`,
    ...step,
  }));
};

const ItineraryTimeline = ({ schedules, type, destinationName, linkedDestinations }) => {
  const defaultSchedules = [
    { time: "08:00", activity: "Đón khách và khởi hành chuyến đi" },
    { time: "12:00", activity: "Dùng bữa trưa tại nhà hàng địa phương" },
    { time: "16:30", activity: "Kết thúc hành trình và trả khách" },
  ];

  const multiTimeline = buildMultiTimeline(destinationName, linkedDestinations);
  const displayData =
    type === "single"
      ? Array.isArray(schedules) && schedules.length
        ? schedules
        : defaultSchedules
      : multiTimeline;

  return (
    <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-white">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
          <Map size={24} />
        </div>
        <div>
          <h3 className="font-black text-xl italic text-slate-800 tracking-tighter">
            {type === "single" ? "Lịch trình tại khu" : "Lịch trình liên kết"}
          </h3>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Hành trình trải nghiệm
          </p>
        </div>
      </div>

      <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:w-0.5 before:bg-blue-50">
        {displayData.map((step, index) => (
          <div key={`${step.time}-${index}`} className="relative flex items-start gap-6 group pl-1">
            <div className="absolute left-0 w-10 h-10 bg-white rounded-full border-2 border-blue-500 flex items-center justify-center z-10 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
              <Clock size={14} className="text-blue-600 group-hover:text-white" />
            </div>
            <div className="ml-12 pt-1">
              <span className="text-[10px] font-black text-blue-500 bg-blue-50 px-3 py-1 rounded-lg uppercase tracking-widest">
                {step.time} {step.name ? `• ${step.name}` : ""}
              </span>
              <p className="mt-2 text-sm font-bold text-slate-700 leading-tight">{step.activity}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Booking = ({ user }) => {
  const { id_kdl } = useParams();
  const [searchParams] = useSearchParams();
  const refId = searchParams.get("ref");
  const navigate = useNavigate();

  const [bookingType, setBookingType] = useState("single");
  const [bookingData, setBookingData] = useState({
    ngay_den: "",
    so_luong: 1,
    ghi_chu: "",
  });
  const [kdlInfo, setKdlInfo] = useState(null);
  const [services, setServices] = useState([]);
  const [linkedOptions, setLinkedOptions] = useState([]);
  const [selectedServiceId, setSelectedServiceId] = useState(null);
  const [selectedLinkedIds, setSelectedLinkedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadBookingData = async () => {
      setLoading(true);
      try {
        const [profileRes, servicesRes, linkedRes] = await Promise.all([
          api.get(`/users/profile/${id_kdl}`),
          api.get(`/businesses/${id_kdl}/services`),
          api.get("/businesses/featured"),
        ]);

        setKdlInfo(profileRes.data.data);
        setServices(servicesRes.data.data || []);
        setLinkedOptions(
          (linkedRes.data.data || []).filter((item) => String(item.id) !== String(id_kdl)).slice(0, 6),
        );
      } catch (err) {
        console.error("Lỗi tải dữ liệu đặt vé:", err);
        toast.error("Không thể tải thông tin đặt vé.");
      } finally {
        setLoading(false);
      }
    };

    loadBookingData();
  }, [id_kdl]);

  useEffect(() => {
    if (!services.length) return;
    setSelectedServiceId((prev) => prev || services[0].id);
  }, [services]);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) || null,
    [services, selectedServiceId],
  );

  const selectedLinkedDestinations = useMemo(
    () => linkedOptions.filter((item) => selectedLinkedIds.includes(item.id)),
    [linkedOptions, selectedLinkedIds],
  );

  const destinationName = kdlInfo?.ten_khu_du_lich || kdlInfo?.ten || "Khu du lịch";
  const today = new Date().toISOString().split("T")[0];

  const basePrice =
    bookingType === "single"
      ? Number(selectedService?.gia_tien || kdlInfo?.gia_ve || 200000)
      : Number(selectedService?.gia_tien || 450000);
  const totalAmount = basePrice * bookingData.so_luong;

  const bookingLabel =
    bookingType === "single" ? "Vé lẻ tại khu" : "Gói tour liên kết đa điểm";

  const composedNote = useMemo(() => {
    const parts = [];

    if (selectedService?.ten_dich_vu) {
      parts.push(`Gói dịch vụ: ${selectedService.ten_dich_vu}`);
    }

    if (bookingType === "multi" && selectedLinkedDestinations.length) {
      parts.push(
        `Khu liên kết: ${selectedLinkedDestinations
          .map((item) => item.ten_khu_du_lich || item.ten)
          .join(", ")}`,
      );
    }

    if (bookingData.ghi_chu.trim()) {
      parts.push(`Ghi chú: ${bookingData.ghi_chu.trim()}`);
    }

    return parts.join(" | ");
  }, [bookingData.ghi_chu, bookingType, selectedLinkedDestinations, selectedService]);

  const toggleLinkedDestination = (id) => {
    setSelectedLinkedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleConfirmBooking = async (e) => {
    if (e) e.preventDefault();

    if (user?.vai_tro !== "khach_du_lich") {
      return toast.error("Chỉ khách du lịch mới được đặt vé.");
    }

    if (!bookingData.ngay_den) {
      return toast.error("Vui lòng chọn ngày đến.");
    }

    if (bookingData.ngay_den < today) {
      return toast.error("Ngày đến không được nhỏ hơn ngày hiện tại.");
    }

    if (!bookingData.so_luong || bookingData.so_luong < 1) {
      return toast.error("Số lượng khách phải lớn hơn hoặc bằng 1.");
    }

    try {
      setSubmitting(true);
      const invoiceName =
        bookingType === "single"
          ? selectedService?.ten_dich_vu || destinationName
          : `Combo liên kết ${destinationName}`;

      const res = await api.post("/payments/create-invoice", {
        id_kdl,
        ten_kdl: invoiceName,
        tong_tien: totalAmount,
        id_nguoi_gioi_thieu: refId,
        loai_tour: bookingType,
        ngay_den: bookingData.ngay_den,
        so_luong: bookingData.so_luong,
      });

      if (res.data.success) {
        localStorage.setItem(
          `${PAYMENT_DRAFT_PREFIX}${res.data.invoiceId}`,
          JSON.stringify({
            id_kdl,
            ngay_den: bookingData.ngay_den,
            so_luong: bookingData.so_luong,
            ghi_chu: composedNote,
            bookingType,
            selectedService,
            selectedLinkedDestinations,
          }),
        );

        toast.success("Đã tạo hóa đơn đặt vé. Bạn có thể thanh toán ngay.");
        navigate("/payment");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Lỗi tạo hóa đơn.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 font-black text-blue-600 italic animate-pulse">
        TravelConnect đang tải...
      </div>
    );
  }

  return (
    <AnimatedPage>
      <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar user={user} />

        <div className="max-w-7xl mx-auto pt-10 px-4 pb-24 grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-6 order-2 lg:order-1">
            <div className="bg-white p-2 rounded-[2.2rem] shadow-xl shadow-blue-900/5 flex gap-2 border border-white">
              <button
                onClick={() => setBookingType("single")}
                className={`flex-1 py-4 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  bookingType === "single"
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Ticket size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Vé đơn lẻ</span>
              </button>
              <button
                onClick={() => setBookingType("multi")}
                className={`flex-1 py-4 rounded-[1.5rem] flex flex-col items-center gap-1 transition-all ${
                  bookingType === "multi"
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
                    : "text-slate-400 hover:bg-slate-50"
                }`}
              >
                <Layers size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">Gói liên kết</span>
              </button>
            </div>

            <ItineraryTimeline
              schedules={kdlInfo?.lich_trinh_json}
              type={bookingType}
              destinationName={destinationName}
              linkedDestinations={selectedLinkedDestinations}
            />

            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl shadow-blue-900/5 border border-white">
              <div className="flex items-center justify-between gap-4 mb-6">
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Gói dịch vụ
                  </p>
                  <h3 className="mt-2 text-xl font-black italic text-slate-800 tracking-tighter">
                    Khách du lịch thấy ở đây
                  </h3>
                </div>
                <div className="px-3 py-2 rounded-full bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest">
                  {services.length} gói
                </div>
              </div>

              {services.length ? (
                <div className="space-y-3">
                  {services.map((service) => {
                    const active = selectedServiceId === service.id;

                    return (
                      <button
                        key={service.id}
                        type="button"
                        onClick={() => setSelectedServiceId(service.id)}
                        className={`w-full rounded-[1.8rem] border p-5 text-left transition-all ${
                          active
                            ? "border-blue-500 bg-blue-50"
                            : "border-slate-100 bg-slate-50 hover:border-slate-200"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm font-black text-slate-800">{service.ten_dich_vu}</p>
                            <p className="mt-2 text-xs font-medium text-slate-500 leading-relaxed">
                              {service.mo_ta || "Chưa có mô tả cho gói dịch vụ này."}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-lg font-black text-blue-600">
                              {Number(service.gia_tien || 0).toLocaleString("vi-VN")}đ
                            </p>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-2">
                              {active ? "Đang chọn" : "Chọn gói"}
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[1.8rem] bg-slate-50 border border-dashed border-slate-200 px-5 py-6 text-sm text-slate-400">
                  Khu du lịch này chưa tạo gói dịch vụ. Hệ thống sẽ dùng mức giá mặc định.
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl shadow-blue-200">
              <div className="relative z-10">
                <ShieldCheck size={32} className="mb-4 text-blue-200" />
                <h4 className="font-black text-lg leading-tight mb-2 uppercase tracking-tighter">
                  Bảo hiểm du lịch
                </h4>
                <p className="text-[10px] font-bold text-blue-100 leading-relaxed opacity-80">
                  Chuyến đi của bạn đã bao gồm gói bảo hiểm an toàn TravelCare 2026.
                </p>
              </div>
              <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
            </div>
          </div>

          <div className="col-span-12 lg:col-span-5 space-y-6 order-1 lg:order-2">
            <form
              onSubmit={handleConfirmBooking}
              className="bg-white rounded-[3rem] shadow-2xl shadow-blue-900/5 border border-white overflow-hidden"
            >
              <div className="bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-12 text-white relative">
                <div className="relative z-10">
                  <p className="text-blue-100 font-black uppercase text-[9px] tracking-[0.2em] mb-2 opacity-80">
                    Thanh toán an toàn
                  </p>
                  <h2 className="text-4xl font-black italic tracking-tighter leading-tight">
                    Xác nhận <br />
                    chuyến đi
                  </h2>
                </div>
                <Sparkles
                  className="absolute right-8 top-1/2 -translate-y-1/2 text-white/20"
                  size={100}
                />
              </div>

              <div className="p-10 space-y-8">
                <div className="grid gap-4 rounded-[2rem] border border-slate-100 bg-slate-50 p-5 md:grid-cols-2">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Điểm đến
                    </p>
                    <p className="mt-2 text-base font-black text-slate-800">{destinationName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                      Địa chỉ
                    </p>
                    <p className="mt-2 text-sm font-bold text-slate-600">
                      {kdlInfo?.dia_chi || "Đang cập nhật"}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 flex gap-3 items-center">
                  <MousePointer2 size={18} className="text-blue-600" />
                  <p className="text-[11px] font-bold text-blue-700">
                    Bạn đang đặt: <span className="font-black uppercase">{bookingLabel}</span>
                  </p>
                </div>

                {bookingType === "multi" && (
                  <div className="space-y-3">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2">
                      Chọn khu du lịch liên kết
                    </label>
                    <div className="grid gap-3">
                      {linkedOptions.length ? (
                        linkedOptions.map((item) => {
                          const active = selectedLinkedIds.includes(item.id);

                          return (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => toggleLinkedDestination(item.id)}
                              className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition-all ${
                                active
                                  ? "border-indigo-500 bg-indigo-50"
                                  : "border-slate-100 bg-slate-50 hover:border-slate-200"
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div>
                                  <p className="text-sm font-black text-slate-800">
                                    {item.ten_khu_du_lich || item.ten}
                                  </p>
                                  <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {item.tinh_thanh || "Khu du lịch liên kết"}
                                  </p>
                                </div>
                                <span
                                  className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                    active ? "bg-indigo-600 text-white" : "bg-white text-slate-400"
                                  }`}
                                >
                                  {active ? "Đã chọn" : "Chọn"}
                                </span>
                              </div>
                            </button>
                          );
                        })
                      ) : (
                        <div className="rounded-[1.6rem] bg-slate-50 border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400">
                          Chưa có khu du lịch liên kết để đề xuất.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Calendar size={14} className="text-blue-500" /> Ngày đến
                  </label>
                  <input
                    type="date"
                    min={today}
                    value={bookingData.ngay_den}
                    className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-black text-slate-700 transition-all shadow-inner"
                    onChange={(e) => setBookingData({ ...bookingData, ngay_den: e.target.value })}
                  />
                  <p className="px-2 text-xs font-bold text-slate-400">
                    Vui lòng chọn ngày tham quan từ hôm nay trở đi.
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <Users size={14} className="text-blue-500" /> Số lượng khách
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="w-full p-5 bg-slate-50 rounded-3xl border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-black text-slate-700 transition-all text-center shadow-inner"
                    value={bookingData.so_luong}
                    onChange={(e) =>
                      setBookingData({
                        ...bookingData,
                        so_luong: parseInt(e.target.value, 10) || 1,
                      })
                    }
                  />
                </div>

                <div className="space-y-3">
                  <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                    <MessageSquareText size={14} className="text-blue-500" /> Ghi chú cho khu du lịch
                  </label>
                  <textarea
                    rows="3"
                    value={bookingData.ghi_chu}
                    className="w-full p-6 bg-slate-50 rounded-[2.2rem] border-2 border-transparent focus:border-blue-500 focus:bg-white outline-none font-bold text-sm text-slate-700 shadow-inner"
                    placeholder="Ví dụ: đến sớm, đi theo gia đình, cần hỗ trợ trẻ nhỏ..."
                    onChange={(e) => setBookingData({ ...bookingData, ghi_chu: e.target.value })}
                  />
                </div>

                <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 px-5 py-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                    Trạng thái đặt vé
                  </p>
                  <p className="mt-2 text-sm font-bold text-emerald-700">
                    Sau khi xác nhận, hệ thống sẽ tạo hóa đơn và chuyển bạn sang trang thanh toán.
                  </p>
                </div>
              </div>
            </form>
          </div>

          <div className="col-span-12 lg:col-span-3 order-3">
            <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/10 border border-white p-8 space-y-8 sticky top-24">
              <div className="flex items-center justify-between border-b border-slate-50 pb-5">
                <h3 className="font-black text-lg italic text-slate-800 tracking-tighter uppercase">
                  Hóa đơn
                </h3>
                <Wallet size={24} className="text-blue-600" />
              </div>

              <div className="space-y-5 px-1">
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                  <span>Điểm đến</span>
                  <span className="text-slate-700 text-right max-w-[140px] truncate">{destinationName}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter gap-3">
                  <span>Gói đã chọn</span>
                  <span className="text-slate-700 text-right max-w-[140px] truncate">
                    {selectedService?.ten_dich_vu || "Mặc định"}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                  <span>Giá cơ bản</span>
                  <span className="text-slate-700">{basePrice.toLocaleString("vi-VN")}đ</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                  <span>Số lượng</span>
                  <span className="text-slate-700">x {bookingData.so_luong}</span>
                </div>
                <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter">
                  <span>Ngày đến</span>
                  <span className="text-slate-700">{bookingData.ngay_den || "--"}</span>
                </div>
                {bookingType === "multi" && (
                  <div className="flex justify-between text-[11px] font-black text-slate-400 uppercase tracking-tighter gap-3">
                    <span>Khu liên kết</span>
                    <span className="text-slate-700 text-right max-w-[140px]">
                      {selectedLinkedDestinations.length
                        ? selectedLinkedDestinations.map((item) => item.ten_khu_du_lich || item.ten).join(", ")
                        : "Chưa chọn"}
                    </span>
                  </div>
                )}
                <div className="pt-6 mt-6 border-t-2 border-slate-50 flex flex-col gap-1">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">
                    Tổng thanh toán
                  </p>
                  <span className="text-4xl font-black italic text-blue-600 tracking-tighter">
                    {totalAmount.toLocaleString("vi-VN")}đ
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleConfirmBooking}
                disabled={submitting}
                className="w-full py-5 bg-blue-600 hover:bg-slate-900 text-white rounded-[1.8rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2 active:scale-95 group disabled:opacity-60"
              >
                {submitting ? "Đang tạo hóa đơn..." : "Xác nhận"}
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="text-center">
                <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                  TravelConnect đã xác minh bảo mật
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AnimatedPage>
  );
};

export default Booking;
