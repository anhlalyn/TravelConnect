import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Calendar,
  CheckCircle2,
  Clock3,
  Eye,
  MessageSquare,
  QrCode,
  Receipt,
  ScanLine,
  Ticket,
  Users,
  Wallet,
  X,
  XCircle,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const FILTER_OPTIONS = [
  { value: "all", label: "Tất cả" },
  { value: "pending", label: "Chờ xác nhận" },
  { value: "confirmed", label: "Đã xác nhận" },
  { value: "completed", label: "Đã quét QR" },
  { value: "cancelled", label: "Đã hủy" },
];

const STATUS_META = {
  pending: { label: "Chờ xác nhận", className: "bg-amber-50 text-amber-700 border-amber-200", icon: Clock3 },
  confirmed: { label: "Đã xác nhận", className: "bg-blue-50 text-blue-700 border-blue-200", icon: CheckCircle2 },
  completed: { label: "Đã quét QR", className: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircle2 },
  cancelled: { label: "Đã hủy", className: "bg-rose-50 text-rose-700 border-rose-200", icon: XCircle },
};

const STAT_CARD_STYLES = [
  "bg-blue-50 text-blue-700",
  "bg-amber-50 text-amber-700",
  "bg-cyan-50 text-cyan-700",
  "bg-emerald-50 text-emerald-700",
  "bg-indigo-50 text-indigo-700",
  "bg-rose-50 text-rose-700",
];

const emptyDetailState = { data: null, loading: false };
const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;
const formatDateTime = (value) => (value ? new Date(value).toLocaleString("vi-VN") : "--");

const BookingManagement = ({ user }) => {
  const [bookings, setBookings] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [detailState, setDetailState] = useState(emptyDetailState);
  const [updatingStatus, setUpdatingStatus] = useState(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [qrInput, setQrInput] = useState("");
  const [scanLoading, setScanLoading] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [detectorSupported, setDetectorSupported] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const scanIntervalRef = useRef(null);
  const lastScannedValueRef = useRef("");

  const fetchBookings = useCallback(async () => {
    try {
      const query = filter === "all" ? "" : `?status=${filter}`;
      const res = await api.get(`/bookings/kdl/bookings${query}`);
      setBookings(res.data.data || []);
    } catch {
      toast.error("Không thể tải danh sách đặt vé.");
    }
  }, [filter]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await api.get("/bookings/kdl/stats");
      setStats(res.data.data || {});
    } catch {
      setStats({});
    }
  }, []);

  const stopScanner = useCallback(() => {
    if (scanIntervalRef.current) {
      window.clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }

    detectorRef.current = null;
    lastScannedValueRef.current = "";

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraReady(false);
  }, []);

  const handleScanQr = useCallback(
    async (overrideValue) => {
      const qrCode = (overrideValue || qrInput).trim();
      if (!qrCode) {
        toast.error("Vui lòng nhập mã QR hoặc mã vé để quét.");
        return;
      }

      try {
        setScanLoading(true);
        const res = await api.post("/bookings/kdl/scan-qr", { qr_code: qrCode });
        setScanResult(res.data.data || null);
        toast.success(
          res.data.alreadyScanned ? "Vé đã được quét trước đó." : "Quét QR thành công.",
        );
        await Promise.all([fetchBookings(), fetchStats()]);
      } catch (err) {
        setScanResult(null);
        toast.error(err.response?.data?.message || "Quét QR thất bại.");
      } finally {
        setScanLoading(false);
      }
    },
    [fetchBookings, fetchStats, qrInput],
  );

  const startScanner = useCallback(async () => {
    stopScanner();
    setCameraError("");
    setScanResult(null);

    try {
      const hasDetector = typeof window !== "undefined" && "BarcodeDetector" in window;
      setDetectorSupported(hasDetector);
      if (hasDetector) {
        detectorRef.current = new window.BarcodeDetector({ formats: ["qr_code"] });
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }

      setCameraReady(true);

      if (!detectorRef.current) {
        setCameraError("Trình duyệt chưa hỗ trợ tự nhận diện QR. Bạn vẫn có thể quét bằng camera và nhập mã thủ công.");
        return;
      }

      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !detectorRef.current || scanLoading) return;

        try {
          const codes = await detectorRef.current.detect(videoRef.current);
          const rawValue = codes?.[0]?.rawValue?.trim();
          if (!rawValue || rawValue === lastScannedValueRef.current) return;

          lastScannedValueRef.current = rawValue;
          setQrInput(rawValue);
          await handleScanQr(rawValue);

          window.setTimeout(() => {
            if (lastScannedValueRef.current === rawValue) {
              lastScannedValueRef.current = "";
            }
          }, 2500);
        } catch (err) {
          console.debug("qr detect skipped", err?.message || "");
        }
      }, 1000);
    } catch (err) {
      console.debug("camera error", err?.message || "");
      setCameraError("Không thể bật camera để quét QR.");
      toast.error("Không thể bật camera quét QR.");
    }
  }, [handleScanQr, scanLoading, stopScanner]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchBookings(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchBookings, fetchStats]);

  useEffect(() => {
    if (!scannerOpen) {
      stopScanner();
      return undefined;
    }

    startScanner();
    return () => {
      stopScanner();
    };
  }, [scannerOpen, startScanner, stopScanner]);

  const statCards = useMemo(
    () => [
      { label: "Tổng đơn", value: stats.tong_dat_ve || 0, icon: Receipt },
      { label: "Chờ xác nhận", value: stats.dang_cho || 0, icon: Clock3 },
      { label: "Đã xác nhận", value: stats.da_xac_nhan || 0, icon: CheckCircle2 },
      { label: "Đã quét QR", value: stats.da_quet_qr || 0, icon: QrCode },
      { label: "Hoàn thành", value: stats.da_hoan_thanh || 0, icon: Ticket },
      { label: "Doanh thu", value: formatCurrency(stats.tong_doanh_thu || 0), icon: Wallet },
    ],
    [stats],
  );

  const openBookingDetail = async (bookingId) => {
    setSelectedBookingId(bookingId);
    setDetailState({ data: null, loading: true });
    try {
      const res = await api.get(`/bookings/kdl/bookings/${bookingId}`);
      setDetailState({ data: res.data.data || null, loading: false });
    } catch {
      setDetailState({ data: null, loading: false });
      toast.error("Không thể tải chi tiết đặt vé.");
    }
  };

  const closeBookingDetail = () => {
    setSelectedBookingId(null);
    setDetailState(emptyDetailState);
  };

  const handleUpdateStatus = async (bookingId, newStatus) => {
    setUpdatingStatus(bookingId);
    try {
      await api.put(`/bookings/kdl/bookings/${bookingId}`, { trang_thai: newStatus });
      toast.success("Cập nhật trạng thái thành công.");
      await Promise.all([fetchBookings(), fetchStats()]);
      if (selectedBookingId === bookingId) await openBookingDetail(bookingId);
    } catch {
      toast.error("Không thể cập nhật trạng thái.");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const renderStatusBadge = (status) => {
    const meta = STATUS_META[status] || STATUS_META.pending;
    const Icon = meta.icon;
    return (
      <div className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-black uppercase tracking-widest ${meta.className}`}>
        <Icon size={14} />
        {meta.label}
      </div>
    );
  };

  const selectedBooking = detailState.data;

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-4 border-blue-600" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
            Đang tải booking...
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
        <div className="col-span-12 space-y-6 lg:col-span-9">
          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-8 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="mb-2 text-3xl font-black text-slate-900">Quản lý đặt vé</h1>
                <p className="text-sm text-slate-500">
                  Theo dõi booking, xem chi tiết và quét mã QR check-in cho khách du lịch.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setScannerOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900"
              >
                <ScanLine size={18} />
                Quét QR vé
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {statCards.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className={`rounded-[1.8rem] p-5 ${STAT_CARD_STYLES[index]}`}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-[11px] font-black uppercase tracking-widest">{stat.label}</p>
                    <Icon size={18} />
                  </div>
                  <p className="mt-4 break-words text-3xl font-black">{stat.value}</p>
                </div>
              );
            })}
          </div>

          <div className="rounded-[2.5rem] border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap gap-3">
              {FILTER_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilter(option.value)}
                  className={`rounded-full border px-4 py-2.5 text-xs font-black uppercase tracking-widest transition-all ${
                    filter === option.value
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-400"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            {bookings.length > 0 ? (
              bookings.map((booking) => (
                <div key={booking.id} className="rounded-[2rem] border border-slate-100 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-4">
                        <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-[1.3rem] bg-blue-100 text-lg font-black text-blue-700">
                          {booking.ten_khach?.charAt(0) || "K"}
                        </div>
                        <div className="min-w-0">
                          <h2 className="truncate text-lg font-black text-slate-800">
                            {booking.ten_khach || "Khách du lịch"}
                          </h2>
                          <p className="truncate text-sm text-slate-500">{booking.email}</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            {booking.ma_ve || "Chưa có mã vé"}
                          </p>
                        </div>
                      </div>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                        <div className="rounded-[1.4rem] bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày đến</p>
                          <p className="flex items-center gap-2 font-bold text-slate-700">
                            <Calendar size={14} className="text-blue-600" />
                            {formatDateTime(booking.ngay_den)}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Đặt lúc</p>
                          <p className="flex items-center gap-2 font-bold text-slate-700">
                            <Clock3 size={14} className="text-blue-600" />
                            {formatDateTime(booking.ngay_tao)}
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Số người</p>
                          <p className="flex items-center gap-2 font-bold text-slate-700">
                            <Users size={14} className="text-blue-600" />
                            {booking.so_nguoi || 0} khách
                          </p>
                        </div>
                        <div className="rounded-[1.4rem] bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng tiền</p>
                          <p className="font-black text-blue-600">{formatCurrency(booking.tong_tien)}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-3 xl:w-[220px] xl:items-end">
                      {renderStatusBadge(booking.trang_thai)}
                      <button
                        type="button"
                        onClick={() => openBookingDetail(booking.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900 xl:w-auto"
                      >
                        <Eye size={14} />
                        Xem chi tiết
                      </button>
                      <button
                        type="button"
                        onClick={() => toast("Hãy dùng trang tin nhắn hiện có để liên hệ khách.", { icon: "i" })}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-100 px-5 py-3 text-xs font-black uppercase tracking-widest text-slate-600 transition-all hover:bg-slate-200 xl:w-auto"
                      >
                        <MessageSquare size={14} />
                        Liên hệ khách
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-white p-12 text-center text-slate-400 shadow-sm">
                <p className="mb-3 text-2xl">Chưa có đơn đặt vé</p>
                <p className="text-sm">Khi khách du lịch đặt vé, danh sách booking sẽ xuất hiện tại đây.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedBookingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm">
          <div className="absolute inset-0" onClick={closeBookingDetail} aria-hidden="true" />
          <div className="relative z-10 max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2.5rem] border border-white bg-white shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-slate-100 bg-white px-8 py-6">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chi tiết booking</p>
                <h2 className="text-2xl font-black text-slate-900">Đơn đặt vé #{selectedBookingId}</h2>
              </div>
              <button type="button" onClick={closeBookingDetail} className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-6 p-8">
              {detailState.loading ? (
                <div className="py-16 text-center font-bold text-slate-400">Đang tải chi tiết booking...</div>
              ) : selectedBooking ? (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    {renderStatusBadge(selectedBooking.trang_thai)}
                    <div className="text-right">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tổng thanh toán</p>
                      <p className="mt-2 text-3xl font-black text-blue-600">{formatCurrency(selectedBooking.tong_tien)}</p>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="rounded-[2rem] border border-blue-100 bg-blue-50 p-6">
                      <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-blue-700">Thông tin khách</h3>
                      <div className="space-y-4 text-sm">
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Họ tên</p><p className="font-bold text-slate-800">{selectedBooking.ten_khach || "Khách du lịch"}</p></div>
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Email</p><p className="font-bold text-slate-800">{selectedBooking.email || "Chưa cập nhật"}</p></div>
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Mã vé</p><p className="font-bold text-slate-800">{selectedBooking.ma_ve || "--"}</p></div>
                      </div>
                    </div>
                    <div className="rounded-[2rem] border border-emerald-100 bg-emerald-50 p-6">
                      <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-emerald-700">Thông tin chuyến đi</h3>
                      <div className="space-y-4 text-sm">
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Ngày đến</p><p className="font-bold text-slate-800">{formatDateTime(selectedBooking.ngay_den)}</p></div>
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Đặt lúc</p><p className="font-bold text-slate-800">{formatDateTime(selectedBooking.ngay_tao)}</p></div>
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Số người</p><p className="font-bold text-slate-800">{selectedBooking.so_nguoi || 0} khách</p></div>
                        <div><p className="mb-1 text-[10px] font-black uppercase text-slate-400">Quét QR</p><p className="font-bold text-slate-800">{formatDateTime(selectedBooking.thoi_gian_quet_ve)}</p></div>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.trang_thai !== "completed" && selectedBooking.trang_thai !== "cancelled" && (
                    <div className="rounded-[2.5rem] bg-slate-900 p-6 text-white">
                      <h3 className="mb-4 text-[11px] font-black uppercase tracking-widest text-blue-300">Cập nhật trạng thái</h3>
                      <div className="grid gap-3 sm:grid-cols-3">
                        {["confirmed", "completed", "cancelled"].map((status) => {
                          const meta = STATUS_META[status];
                          const Icon = meta.icon;
                          return (
                            <button
                              key={status}
                              type="button"
                              onClick={() => handleUpdateStatus(selectedBooking.id, status)}
                              disabled={updatingStatus === selectedBooking.id}
                              className={`rounded-2xl px-4 py-4 text-sm font-black transition-all disabled:opacity-50 ${meta.className}`}
                            >
                              <span className="flex items-center justify-center gap-2"><Icon size={16} />{meta.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="py-16 text-center font-bold text-slate-400">Không có dữ liệu chi tiết.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {scannerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-[2.5rem] border border-slate-100 bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Check-in du khách</p>
                <h3 className="text-2xl font-black text-slate-900">Quét QR vé du lịch</h3>
              </div>
              <button type="button" onClick={() => setScannerOpen(false)} className="rounded-2xl bg-slate-100 p-3 text-slate-500 transition-colors hover:bg-slate-900 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-6 p-6 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="relative flex aspect-video items-center justify-center overflow-hidden rounded-[2rem] bg-slate-900">
                  <video ref={videoRef} className={`h-full w-full object-cover ${cameraReady ? "block" : "hidden"}`} muted playsInline autoPlay />

                  {!cameraReady && (
                    <div className="px-6 text-center text-white/80">
                      <QrCode size={32} className="mx-auto mb-3" />
                      <p className="font-bold">{cameraError || "Đang khởi tạo camera..."}</p>
                    </div>
                  )}

                  {cameraReady && (
                    <div className="absolute left-4 top-4 rounded-full bg-black/50 px-4 py-2 text-xs font-black uppercase tracking-widest text-white">
                      {detectorSupported ? "Đang quét tự động" : "Camera đang bật"}
                    </div>
                  )}
                </div>

                <div className="rounded-[1.6rem] border border-slate-100 bg-slate-50 p-4">
                  <div className="mb-3 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={startScanner}
                      className="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-3 text-sm font-black text-slate-700 transition-colors hover:bg-slate-100"
                    >
                      <ScanLine size={16} />
                      Bật lại camera
                    </button>
                  </div>

                  <p className="mb-2 text-xs font-black uppercase tracking-widest text-slate-500">
                    Nhập tay / dán mã QR hoặc payload
                  </p>
                  <textarea
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    rows={4}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-300"
                    placeholder='Dán mã vé như "TCV-00000001" hoặc payload JSON QR'
                  />
                  <button
                    type="button"
                    onClick={() => handleScanQr()}
                    disabled={scanLoading}
                    className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900 disabled:opacity-50"
                  >
                    <ScanLine size={16} />
                    {scanLoading ? "Đang quét..." : "Xác minh vé"}
                  </button>
                  {cameraError && <p className="mt-3 text-sm text-amber-700">{cameraError}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-[2rem] border border-slate-100 bg-white p-5">
                  <p className="mb-3 text-xs font-black uppercase tracking-widest text-slate-400">Kết quả quét</p>
                  {scanResult ? (
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-emerald-700">
                        <p className="font-black">{scanResult.ten_khach}</p>
                        <p className="mt-1 text-sm font-bold">{scanResult.ma_ve || `Booking #${scanResult.id}`}</p>
                      </div>
                      <div className="grid gap-3 text-sm sm:grid-cols-2">
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Ngày đến</p>
                          <p className="font-bold text-slate-700">{formatDateTime(scanResult.ngay_den)}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Số người</p>
                          <p className="font-bold text-slate-700">{scanResult.so_nguoi || 0} khách</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Email</p>
                          <p className="break-all font-bold text-slate-700">{scanResult.email || "--"}</p>
                        </div>
                        <div className="rounded-2xl bg-slate-50 p-4">
                          <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Trạng thái</p>
                          <p className="font-bold text-slate-700">{STATUS_META[scanResult.trang_thai]?.label || scanResult.trang_thai}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl bg-slate-50 p-6 text-sm text-slate-500">
                      Quét thành công, thông tin vé sẽ hiển thị tại đây.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingManagement;
