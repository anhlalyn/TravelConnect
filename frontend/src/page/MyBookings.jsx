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

const MyBookings = ({ user }) => {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

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
    if (!user) {
      navigate("/login");
      return;
    }
    fetchMyBookings();
  }, [user, navigate, fetchMyBookings]);

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

  const canShowQr = (booking) => booking?.trang_thai === "confirmed" || booking?.trang_thai === "completed";

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-500" />
          <p className="text-gray-600">Đang tải danh sách đặt vé...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b bg-white shadow-sm">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Đặt vé của tôi</h1>
              <p className="mt-2 text-gray-600">Quản lý đơn đặt vé, mã QR và lịch check-in.</p>
            </div>
            <button
              onClick={() => navigate("/explore")}
              className="rounded-lg bg-blue-600 px-4 py-2 text-white transition-colors hover:bg-blue-700"
            >
              Đặt vé mới
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {bookings.length === 0 ? (
          <div className="py-12 text-center">
            <Calendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có đặt vé</h3>
            <p className="mt-1 text-sm text-gray-500">
              Bạn chưa có đơn đặt vé nào. Hãy khám phá và đặt vé ngay!
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="rounded-2xl border bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="p-6">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{booking.ten_kdl}</h3>
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
                      <span>Ngày đến: {formatDate(booking.ngay_den)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="mr-2 h-4 w-4" />
                      <span>Đặt lúc: {formatDate(booking.ngay_tao)}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="mr-2 h-4 w-4" />
                      <span>{booking.so_nguoi} người</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Ticket className="mr-2 h-4 w-4" />
                      <span>{booking.ma_ve || "Sẽ cấp sau khi tạo vé"}</span>
                    </div>
                  </div>

                  {canShowQr(booking) && (
                    <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-4">
                      <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-blue-700">
                        <QrCode size={14} />
                        Mã QR check-in
                      </div>
                      <div className="flex justify-center rounded-2xl bg-white p-3">
                        <QRCodeCanvas value={booking.ma_qr || booking.ma_ve || String(booking.id)} size={140} />
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex space-x-3">
                    <button
                      onClick={() => {
                        setSelectedBooking(booking);
                        setShowDetailModal(true);
                      }}
                      className="flex-1 rounded-lg bg-gray-100 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
                    >
                      Chi tiết
                    </button>
                    {booking.trang_thai === "pending" && (
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex-1 rounded-lg bg-red-100 px-3 py-2 text-sm font-medium text-red-700 transition-colors hover:bg-red-200"
                      >
                        Hủy vé
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white">
            <div className="p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Chi tiết đặt vé</h2>
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
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Thông tin khu du lịch</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tên khu du lịch</label>
                        <p className="text-gray-900">{selectedBooking.ten_kdl}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                        <div className="mt-1 flex items-center">
                          {getStatusIcon(selectedBooking.trang_thai)}
                          <span className="ml-2 text-gray-900">
                            {getStatusText(selectedBooking.trang_thai)}
                          </span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mã vé</label>
                        <p className="font-semibold text-gray-900">{selectedBooking.ma_ve || "--"}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Thông tin đặt vé</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Ngày đến</label>
                        <p className="text-gray-900">{formatDate(selectedBooking.ngay_den)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Số ngày</label>
                        <p className="text-gray-900">{selectedBooking.so_ngay} ngày</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Số người</label>
                        <p className="text-gray-900">{selectedBooking.so_nguoi} người</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Loại vé</label>
                        <p className="text-gray-900">{selectedBooking.loai_ve}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {canShowQr(selectedBooking) && (
                  <div className="rounded-3xl border border-blue-100 bg-blue-50 p-6">
                    <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-blue-700">
                      <QrCode size={18} />
                      Mã QR của bạn
                    </div>
                    <div className="flex justify-center rounded-3xl bg-white p-5">
                      <QRCodeCanvas value={selectedBooking.ma_qr || selectedBooking.ma_ve || String(selectedBooking.id)} size={220} />
                    </div>
                    <p className="mt-4 text-center text-sm text-slate-500">
                      Đưa mã này cho khu du lịch quét khi check-in.
                    </p>
                  </div>
                )}

                {selectedBooking.ghi_chu && (
                  <div>
                    <h3 className="mb-4 text-lg font-semibold text-gray-900">Ghi chú</h3>
                    <p className="rounded-lg bg-gray-50 p-4 text-gray-700">{selectedBooking.ghi_chu}</p>
                  </div>
                )}

                <div className="border-t pt-6">
                  <div className="grid grid-cols-1 gap-4 text-sm text-gray-600 md:grid-cols-2">
                    <div>
                      <span className="font-medium">Đặt lúc:</span> {formatDate(selectedBooking.ngay_tao)}
                    </div>
                    <div>
                      <span className="font-medium">Cập nhật:</span> {formatDate(selectedBooking.ngay_cap_nhat)}
                    </div>
                    {selectedBooking.thoi_gian_quet_ve && (
                      <div>
                        <span className="font-medium">Quét QR:</span> {formatDate(selectedBooking.thoi_gian_quet_ve)}
                      </div>
                    )}
                    <div>
                      <span className="font-medium">Địa điểm:</span> {selectedBooking.dia_chi_chi_tiet || "Đang cập nhật"}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 border-t pt-6">
                  <button
                    onClick={() => setShowDetailModal(false)}
                    className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-200"
                  >
                    Đóng
                  </button>
                  {selectedBooking.trang_thai === "pending" && (
                    <button
                      onClick={() => {
                        handleCancelBooking(selectedBooking.id);
                        setShowDetailModal(false);
                      }}
                      className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
                    >
                      Hủy đặt vé
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
