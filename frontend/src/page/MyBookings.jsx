import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertCircle,
  Calendar,
  CheckCircle,
  Clock,
  QrCode,
  Ticket,
  Users,
  X,
  XCircle,
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const MyBookings = ({ user: initialUser }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(initialUser);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data.data || res.data);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate("/login");
      }
    }
  }, [navigate]);

  const fetchMyBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get("/bookings/my-bookings");
      setBookings(response.data.data || []);
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
      } else {
        toast.error("Không thể tải danh sách đặt vé.");
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchUserProfile();
    fetchMyBookings();
  }, [fetchMyBookings, fetchUserProfile]);

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm("Bạn có chắc muốn hủy đặt vé này?")) return;

    try {
      await api.delete(`/bookings/${bookingId}`);
      toast.success("Đã hủy đặt vé thành công.");
      fetchMyBookings();
    } catch {
      toast.error("Không thể hủy đặt vé.");
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case "confirmed":
        return <CheckCircle className="h-5 w-5 text-blue-500" />;
      case "completed":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "cancelled":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "pending":
        return "Chờ xác nhận";
      case "confirmed":
        return "Đã xác nhận";
      case "completed":
        return "Đã quét QR";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleString("vi-VN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);

  const canShowQr = (booking) =>
    booking?.trang_thai === "confirmed" || booking?.trang_thai === "completed";

  if (loading && !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-gray-600">Đang tải vé của bạn...</p>
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
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-blue-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-blue-700">
                  <Ticket size={14} />
                  Vé điện tử
                </div>
                <h1 className="text-3xl font-black text-slate-900">
                  Vé của tôi
                </h1>
                <p className="mt-2 text-slate-500">
                  Quản lý đặt vé, mã QR check-in và lịch sử sử dụng ngay trong
                  nền tảng số.
                </p>
              </div>
              <button
                onClick={() => navigate("/explore")}
                className="rounded-2xl bg-blue-600 px-5 py-3 text-sm font-black text-white transition-colors hover:bg-blue-700"
              >
                Đặt vé ngay
              </button>
            </div>
          </div>

          {bookings.length === 0 ? (
            <div className="rounded-[2.5rem] border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-sm font-medium text-gray-900">
                Chưa có vé nào
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Bạn chưa có đơn đặt vé nào. Hãy khám phá và đặt vé ngay.
              </p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[2rem] border border-gray-100 bg-white shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="p-6">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.ten_kdl}
                        </h3>
                        <div className="mt-1 flex items-center">
                          {getStatusIcon(booking.trang_thai)}
                          <span className="ml-2 text-sm font-medium text-gray-600">
                            {getStatusText(booking.trang_thai)}
                          </span>
                        </div>
                      </div>
                      <span className="text-lg font-bold text-blue-600">
                        {formatCurrency(booking.tong_tien)}
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span>Ngay den: {formatDate(booking.ngay_den)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Dat luc: {formatDate(booking.ngay_tao)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Users className="mr-2 h-4 w-4" />
                        <span>{booking.so_nguoi} nguoi</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Ticket className="mr-2 h-4 w-4" />
                        <span>{booking.ma_ve || "Se cap sau khi tao ve"}</span>
                      </div>
                    </div>

                    {canShowQr(booking) && (
                      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                        <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700">
                          <QrCode size={14} />
                          Ma QR check-in
                        </div>
                        <div className="flex justify-center rounded-2xl bg-white p-3">
                          <QRCodeCanvas
                            value={
                              booking.ma_qr ||
                              booking.ma_ve ||
                              String(booking.id)
                            }
                            size={140}
                          />
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex space-x-3">
                      <button
                        onClick={() => {
                          setSelectedBooking(booking);
                          setShowDetailModal(true);
                        }}
                        className="flex-1 rounded-xl bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                      >
                        Chi tiet
                      </button>
                      {booking.trang_thai === "pending" && (
                        <button
                          onClick={() => handleCancelBooking(booking.id)}
                          className="flex-1 rounded-xl bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                        >
                          Huy ve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">
                  Chi tiet ve dien tu
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Thong tin diem den
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Ten khu du lich
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.ten_kdl}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Trang thai
                        </label>
                        <div className="mt-1 flex items-center">
                          {getStatusIcon(selectedBooking.trang_thai)}
                          <span className="ml-2 text-gray-900">
                            {getStatusText(selectedBooking.trang_thai)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Ma ve
                        </label>
                        <p className="font-semibold text-gray-900">
                          {selectedBooking.ma_ve || "--"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Thong tin dat ve
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Ngay den
                        </label>
                        <p className="text-gray-900">
                          {formatDate(selectedBooking.ngay_den)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          So ngay
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.so_ngay} ngay
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          So nguoi
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.so_nguoi} nguoi
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">
                          Loai ve
                        </label>
                        <p className="text-gray-900">
                          {selectedBooking.loai_ve}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {canShowQr(selectedBooking) && (
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                    <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-700">
                      <QrCode size={18} />
                      Ma QR cua ban
                    </div>
                    <div className="flex justify-center rounded-3xl bg-white p-5">
                      <QRCodeCanvas
                        value={
                          selectedBooking.ma_qr ||
                          selectedBooking.ma_ve ||
                          String(selectedBooking.id)
                        }
                        size={220}
                      />
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-500">
                      Dua ma nay cho khu du lich quet khi check-in.
                    </p>
                  </div>
                )}

                {selectedBooking.ghi_chu && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">
                      Ghi chu
                    </h3>
                    <p className="rounded-lg bg-gray-50 p-4 text-gray-700">
                      {selectedBooking.ghi_chu}
                    </p>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
                    <div>
                      <span className="font-medium">Dat luc:</span>{" "}
                      {formatDate(selectedBooking.ngay_tao)}
                    </div>
                    <div>
                      <span className="font-medium">Cap nhat:</span>{" "}
                      {formatDate(selectedBooking.ngay_cap_nhat)}
                    </div>
                    {selectedBooking.thoi_gian_quet_ve && (
                      <div>
                        <span className="font-medium">Quet QR:</span>{" "}
                        {formatDate(selectedBooking.thoi_gian_quet_ve)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Dia diem:</span>{" "}
                      {selectedBooking.dia_chi_chi_tiet || "Dang cap nhat"}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 border-t pt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Dong
                  </button>
                  {selectedBooking.trang_thai === "pending" && (
                    <button
                      onClick={() => {
                        handleCancelBooking(selectedBooking.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                    >
                      Huy dat ve
                    </button>
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

export default MyBookings;
