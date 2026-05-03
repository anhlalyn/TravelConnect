import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Banknote,
  CreditCard,
  Landmark,
  Loader2,
  Plus,
  ReceiptText,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Ticket,
  Trash2,
  Wallet,
  X,
  Zap,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const PAYMENT_DRAFT_PREFIX = "pending_invoice_";
const QUICK_DEPOSIT_OPTIONS = [100000, 500000, 1000000];

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}đ`;

const formatDateTime = (value) => {
  if (!value) return "--";
  return new Date(value).toLocaleString("vi-VN");
};

const getMethodLabel = (value) => {
  switch (value) {
    case "single":
      return "Vé đơn lẻ";
    case "multi":
      return "Gói liên kết";
    case "bank_transfer":
      return "Chuyển khoản QR";
    case "momo":
      return "Ví MoMo";
    case "atm":
      return "Thẻ ATM";
    case "wallet":
      return "Ví TravelConnect";
    default:
      return value || "--";
  }
};

const Payment = ({ user: initialUser }) => {
  const [user, setUser] = useState(initialUser);
  const [activeTab, setActiveTab] = useState("pending");
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500000");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [depositNotice, setDepositNotice] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const navigate = useNavigate();

  const depositMethods = [
    {
      id: "bank_transfer",
      name: "Chuyển khoản QR",
      icon: <Landmark size={20} />,
      color: "bg-blue-600",
    },
    {
      id: "momo",
      name: "Ví MoMo",
      icon: <Smartphone size={20} />,
      color: "bg-pink-600",
    },
    {
      id: "atm",
      name: "Thẻ ATM",
      icon: <CreditCard size={20} />,
      color: "bg-slate-700",
    },
  ];

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get("/auth/profile");
      setUser(res.data.data || res.data);
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
    }
  }, [navigate]);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get(`/payments?status=${activeTab}`);
      setPayments(res.data.data || []);
    } catch (err) {
      console.error(err);
      toast.error("Không thể tải danh sách thanh toán.");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchUserProfile();
    fetchPayments();
  }, [fetchUserProfile, fetchPayments]);

  useEffect(() => {
    if (!successMessage) return undefined;
    const timer = window.setTimeout(() => setSuccessMessage(""), 5000);
    return () => window.clearTimeout(timer);
  }, [successMessage]);

  const openDepositModal = () => {
    setDepositAmount("500000");
    setPayMethod("bank_transfer");
    setDepositNotice(null);
    setShowDepositModal(true);
  };

  const handleDeposit = async () => {
    const amount = Number(depositAmount);

    if (!amount || amount < 10000) {
      setDepositNotice({
        type: "error",
        title: "Số tiền chưa hợp lệ",
        message: "Số tiền nạp tối thiểu là 10.000đ.",
      });
      return toast.error("Số tiền nạp tối thiểu là 10.000đ.");
    }

    setIsProcessing(true);
    try {
      const res = await api.post("/payments/deposit", {
        amount,
        method: payMethod,
      });

      if (res.data.success) {
        setUser((prev) => ({
          ...(prev || {}),
          so_du: Number(prev?.so_du || 0) + amount,
        }));
        setDepositNotice({
          type: "success",
          title: "Nạp tiền thành công",
          message: `Ví của bạn đã được cộng ${formatCurrency(amount)} qua ${getMethodLabel(payMethod)}.`,
        });
        toast.success(res.data.message || "Nạp tiền thành công.");
        setShowDepositModal(false);
        setDepositAmount("500000");
      }
    } catch (err) {
      setDepositNotice({
        type: "error",
        title: "Nạp tiền thất bại",
        message: err.response?.data?.message || "Không thể nạp tiền vào ví lúc này.",
      });
      toast.error(err.response?.data?.message || "Lỗi nạp tiền.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDeletePendingPayment = async (paymentId) => {
    if (!window.confirm("Bạn có chắc muốn xóa mục chưa thanh toán này?")) {
      return;
    }

    setDeletingPaymentId(paymentId);
    try {
      const res = await api.delete(`/payments/${paymentId}`);
      localStorage.removeItem(`${PAYMENT_DRAFT_PREFIX}${paymentId}`);

      if (selectedInvoice?.id === paymentId) {
        setSelectedInvoice(null);
        setShowPayModal(false);
      }

      toast.success(res.data.message || "Đã xóa hóa đơn.");
      await fetchPayments();
    } catch (err) {
      toast.error(err.response?.data?.message || "Không thể xóa hóa đơn.");
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const handleExecutePayment = async () => {
    if (!selectedInvoice) return;

    const total = Number(selectedInvoice.tong_tien || 0);
    const balance = Number(user?.so_du || 0);

    if (balance < total) {
      setPaymentNotice({
        type: "error",
        title: "Số dư không đủ",
        message: "Vui lòng nạp thêm tiền trước khi thanh toán hóa đơn này.",
      });
      return toast.error("Số dư ví không đủ.");
    }

    setIsProcessing(true);
    try {
      const draftKey = `${PAYMENT_DRAFT_PREFIX}${selectedInvoice.id}`;
      const draft = JSON.parse(localStorage.getItem(draftKey) || "null");

      const res = await api.post("/payments/execute", {
        invoiceId: selectedInvoice.id,
        ghi_chu: draft?.ghi_chu || "",
        linked_destination_ids: Array.isArray(draft?.selectedLinkedDestinations)
          ? draft.selectedLinkedDestinations.map((item) => item.id)
          : [],
      });

      if (res.data.success) {
        localStorage.removeItem(draftKey);
        setUser((prev) => ({
          ...(prev || {}),
          so_du: Math.max(0, Number(prev?.so_du || 0) - total),
        }));
        setPaymentNotice({
          type: "success",
          title: "Thanh toán thành công",
          message: `Hóa đơn #${selectedInvoice.id} đã được xử lý và chuyển thành vé.`,
        });
        setSuccessMessage("Thanh toán thành công. Vé của bạn đã được chuyển sang mục đã thanh toán.");
        toast.success("Thanh toán thành công.");
        setShowPayModal(false);
        setSelectedInvoice(null);
        setActiveTab("completed");
      }
    } catch (err) {
      setPaymentNotice({
        type: "error",
        title: "Thanh toán thất bại",
        message: err.response?.data?.message || "Giao dịch chưa được thực hiện.",
      });
      toast.error(err.response?.data?.message || "Lỗi giao dịch.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
        <Navbar user={user} />
        <div className="max-w-7xl mx-auto grid grid-cols-12 gap-8 pt-8 px-4 pb-24">
          <div className="hidden lg:block col-span-3">
            <Sidebar user={user} />
          </div>

          <div className="col-span-12 lg:col-span-9 space-y-8">
            <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-blue-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-blue-500/20">
                    <Wallet size={36} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400 mb-2">
                      Số dư hiện tại
                    </p>
                    <h2 className="text-5xl font-black italic tracking-tighter">
                      {Number(user?.so_du || 0).toLocaleString("vi-VN")}
                      <span className="text-blue-500 text-2xl not-italic ml-1">đ</span>
                    </h2>
                    <p className="mt-3 text-sm font-bold text-blue-100/80">
                      Bạn có thể nạp tiền vào ví và thanh toán ngay trên hệ thống.
                    </p>
                  </div>
                </div>
                <button
                  onClick={openDepositModal}
                  className="px-12 py-5 bg-white text-slate-900 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3 group-hover:shadow-blue-500/20"
                >
                  <Plus size={20} /> Nạp thêm tiền
                </button>
              </div>

              {(depositNotice || paymentNotice) && (
                <div className="relative z-10 mt-8 grid gap-3 md:grid-cols-2">
                  {[depositNotice, paymentNotice].filter(Boolean).map((notice) => (
                    <div
                      key={`${notice.title}-${notice.message}`}
                      className={`rounded-[1.8rem] border px-5 py-4 ${
                        notice.type === "success"
                          ? "border-emerald-300/40 bg-emerald-400/10 text-emerald-50"
                          : "border-amber-300/40 bg-amber-400/10 text-amber-50"
                      }`}
                    >
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-80">
                        {notice.title}
                      </p>
                      <p className="mt-2 text-sm font-bold leading-relaxed">{notice.message}</p>
                    </div>
                  ))}
                </div>
              )}

              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/10 rounded-full blur-[80px]" />
              <Zap className="absolute top-6 right-8 text-white/5" size={120} />
            </div>

            <div className="bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 border border-white p-10">
              {successMessage && (
                <div className="mb-8 flex items-start gap-3 rounded-[2rem] border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-700">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-black">Thanh toán thành công</p>
                    <p className="text-sm font-medium">{successMessage}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-col sm:flex-row justify-between items-center gap-6 mb-10">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <ReceiptText size={24} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800 italic uppercase tracking-tighter">
                    Quản lý hóa đơn
                  </h3>
                </div>
                <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full sm:w-auto">
                  <button
                    onClick={() => setActiveTab("pending")}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === "pending"
                        ? "bg-white text-blue-600 shadow-md"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Chưa thanh toán
                  </button>
                  <button
                    onClick={() => setActiveTab("completed")}
                    className={`flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === "completed"
                        ? "bg-white text-emerald-500 shadow-md"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    Đã thanh toán
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {loading ? (
                  <div className="col-span-full py-20 text-center font-black text-slate-300 italic animate-pulse tracking-widest">
                    Đang tải dữ liệu...
                  </div>
                ) : payments.length > 0 ? (
                  payments.map((p) => (
                    <div
                      key={p.id}
                      className={`p-8 rounded-[2.5rem] border-2 transition-all flex justify-between items-center group ${
                        activeTab === "pending"
                          ? "bg-slate-50 border-transparent hover:border-blue-200 hover:bg-white"
                          : "bg-emerald-50/30 border-emerald-100/50"
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              activeTab === "pending" ? "bg-amber-400" : "bg-emerald-400"
                            }`}
                          />
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">
                            Mã #{p.ma_tra_cuu || p.id}
                          </p>
                        </div>
                        <h4 className="font-black text-slate-800 text-base truncate mb-2">
                          {p.ten_kdl || "Dịch vụ du lịch"}
                        </h4>
                        <p className="text-xs text-slate-500 mb-2">
                          {getMethodLabel(p.phuong_thuc)} • {formatDateTime(p.ngay_tao)}
                        </p>
                        <p className="text-2xl font-black italic text-blue-600 tracking-tighter">
                          {formatCurrency(p.tong_tien)}
                        </p>
                      </div>

                      <div className="shrink-0">
                        {activeTab === "pending" ? (
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => handleDeletePendingPayment(p.id)}
                              disabled={deletingPaymentId === p.id}
                              className="w-12 h-12 bg-white text-red-500 rounded-[1.1rem] shadow-sm border border-red-100 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all active:scale-95 disabled:opacity-50"
                              title="Xóa hóa đơn chưa thanh toán"
                            >
                              {deletingPaymentId === p.id ? (
                                <Loader2 size={18} className="animate-spin" />
                              ) : (
                                <Trash2 size={18} />
                              )}
                            </button>
                            <button
                              onClick={() => {
                                setSelectedInvoice(p);
                                setShowPayModal(true);
                              }}
                              className="w-14 h-14 bg-white text-blue-600 rounded-[1.2rem] shadow-sm border border-slate-100 flex items-center justify-center hover:bg-blue-600 hover:text-white transition-all group-hover:scale-110 active:scale-95"
                            >
                              <ArrowRight size={24} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => navigate("/payment-result", { state: { ticket: p } })}
                            className="px-5 py-3 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-emerald-100 hover:bg-slate-900 transition-all"
                          >
                            <Ticket size={16} /> Xem vé
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-24 text-center">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 opacity-30 text-slate-400">
                      <ReceiptText size={40} />
                    </div>
                    <p className="text-sm font-black text-slate-300 uppercase italic tracking-widest">
                      Hiện chưa có hóa đơn nào
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {showDepositModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => !isProcessing && setShowDepositModal(false)}
            />
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100">
                    <Banknote size={24} />
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 italic uppercase text-lg tracking-tighter">
                      Cổng nạp tiền
                    </h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">
                      Nạp tiền vào ví TravelConnect
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="p-3 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-10 space-y-8">
                <div className="space-y-4 text-center">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
                    Nhập số tiền VNĐ
                  </p>
                  <div className="grid grid-cols-3 gap-3">
                    {QUICK_DEPOSIT_OPTIONS.map((amount) => {
                      const active = Number(depositAmount) === amount;

                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDepositAmount(String(amount))}
                          className={`rounded-2xl px-3 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                            active
                              ? "bg-blue-600 text-white shadow-lg shadow-blue-100"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {Number(amount).toLocaleString("vi-VN")}đ
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      className="w-full text-center p-4 bg-transparent outline-none font-black text-5xl text-blue-600 placeholder:text-blue-100"
                    />
                    <div className="h-1 w-20 bg-blue-600 mx-auto mt-2 rounded-full opacity-20" />
                  </div>
                </div>
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">
                    Chọn phương thức
                  </p>
                  {depositMethods.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => setPayMethod(m.id)}
                      className={`w-full p-5 rounded-3xl border-2 flex items-center justify-between transition-all group ${
                        payMethod === m.id
                          ? "border-blue-600 bg-blue-50/50"
                          : "border-slate-50 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`p-3 rounded-2xl text-white transition-transform group-hover:scale-110 ${m.color}`}
                        >
                          {m.icon}
                        </div>
                        <span className="font-black text-sm text-slate-700">{m.name}</span>
                      </div>
                      {payMethod === m.id && <div className="w-2 h-2 bg-blue-600 rounded-full animate-ping" />}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleDeposit}
                  disabled={isProcessing}
                  className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest hover:bg-blue-600 transition-all shadow-xl active:scale-95 disabled:opacity-50"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận nạp tiền"}
                </button>
              </div>
            </div>
          </div>
        )}

        {showPayModal && selectedInvoice && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md"
              onClick={() => !isProcessing && setShowPayModal(false)}
            />
            <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl relative z-10 animate-in slide-in-from-bottom-8 duration-300">
              <div className="p-10 bg-blue-600 text-white rounded-t-[3rem] relative overflow-hidden text-center">
                <Sparkles className="absolute left-4 top-4 text-white/10" size={80} />
                <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">
                  Thanh toán dịch vụ
                </p>
                <h3 className="text-3xl font-black italic tracking-tighter">Xác nhận</h3>
              </div>
              <div className="p-10 space-y-8">
                <div className="text-center space-y-2">
                  <p className="text-sm font-bold text-slate-400">{selectedInvoice.ten_kdl}</p>
                  <p className="text-xs text-slate-500">
                    {getMethodLabel(selectedInvoice.phuong_thuc)} • {formatDateTime(selectedInvoice.ngay_den)}
                  </p>
                  <p className="text-4xl font-black text-blue-600 italic tracking-tighter">
                    {formatCurrency(selectedInvoice.tong_tien)}
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-start gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl">
                    <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black uppercase tracking-tight leading-relaxed">
                      Thanh toán thành công sẽ tạo vé ngay lập tức.
                    </p>
                  </div>

                  {Number(user?.so_du || 0) < Number(selectedInvoice.tong_tien || 0) && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-700 rounded-2xl">
                      <AlertCircle size={20} className="shrink-0 mt-0.5" />
                      <p className="text-[11px] font-bold leading-relaxed">
                        Số dư hiện tại không đủ để thanh toán hóa đơn này.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setShowPayModal(false)}
                      className="py-5 bg-slate-100 text-slate-500 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-slate-200 transition-all"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleExecutePayment}
                      disabled={
                        isProcessing ||
                        Number(user?.so_du || 0) < Number(selectedInvoice.tong_tien || 0)
                      }
                      className="py-5 bg-blue-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all active:scale-95 disabled:bg-slate-300"
                    >
                      {isProcessing ? "Đang xử lý..." : "Xác nhận"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};

export default Payment;
