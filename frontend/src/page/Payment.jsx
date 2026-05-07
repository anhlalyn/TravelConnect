import React, { useCallback, useEffect, useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  ArrowUpRight,
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
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const PAYMENT_DRAFT_PREFIX = "pending_invoice_";
const QUICK_DEPOSIT_OPTIONS = [100000, 500000, 1000000];
const QUICK_WITHDRAW_OPTIONS = [100000, 300000, 500000];

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

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
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState("500000");
  const [withdrawAmount, setWithdrawAmount] = useState("100000");
  const [payMethod, setPayMethod] = useState("bank_transfer");
  const [withdrawMethod, setWithdrawMethod] = useState("bank_transfer");
  const [withdrawForm, setWithdrawForm] = useState({
    accountName: "",
    accountNumber: "",
    bankName: "",
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [depositNotice, setDepositNotice] = useState(null);
  const [withdrawNotice, setWithdrawNotice] = useState(null);
  const [paymentNotice, setPaymentNotice] = useState(null);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

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

  const withdrawMethods = [
    {
      id: "bank_transfer",
      name: "Tài khoản ngân hàng",
      icon: <Landmark size={20} />,
      color: "bg-blue-600",
    },
    {
      id: "momo",
      name: "Ví MoMo",
      icon: <Smartphone size={20} />,
      color: "bg-pink-600",
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

  useEffect(() => {
    if (searchParams.get("action") === "withdraw") {
      openWithdrawModal();
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.delete("action");
          return next;
        },
        { replace: true },
      );
    }
  }, [searchParams, setSearchParams]);

  const openDepositModal = () => {
    setDepositAmount("500000");
    setPayMethod("bank_transfer");
    setDepositNotice(null);
    setShowDepositModal(true);
  };

  const openWithdrawModal = () => {
    setWithdrawAmount("100000");
    setWithdrawMethod("bank_transfer");
    setWithdrawForm({ accountName: "", accountNumber: "", bankName: "" });
    setWithdrawNotice(null);
    setShowWithdrawModal(true);
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
        // Refresh user profile sau khi nạp tiền thành công
        await fetchUserProfile();
        setDepositNotice({
          type: "success",
          title: "Nạp tiền thành công",
          message: `Ví của bạn đã được cộng ${formatCurrency(amount)} qua ${getMethodLabel(payMethod)}.`,
        });
        toast.success(res.data.message || "Nạp tiền thành công.");
        setShowDepositModal(false);
      }
    } catch (err) {
      setDepositNotice({
        type: "error",
        title: "Nạp tiền thất bại",
        message:
          err.response?.data?.message || "Không thể nạp tiền vào ví lúc này.",
      });
      toast.error(err.response?.data?.message || "Lỗi nạp tiền.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = Number(withdrawAmount);
    const balance = Number(user?.so_du || 0);

    if (!amount || amount < 10000) {
      setWithdrawNotice({
        type: "error",
        title: "Số tiền chưa hợp lệ",
        message: "Số tiền rút tối thiểu là 10.000đ.",
      });
      return toast.error("Số tiền rút tối thiểu là 10.000đ.");
    }

    if (balance < amount) {
      setWithdrawNotice({
        type: "error",
        title: "Số dư không đủ",
        message: "Số dư hiện tại không đủ để thực hiện yêu cầu rút tiền.",
      });
      return toast.error("Số dư hiện tại không đủ.");
    }

    if (
      !withdrawForm.accountName.trim() ||
      !withdrawForm.accountNumber.trim()
    ) {
      setWithdrawNotice({
        type: "error",
        title: "Thiếu thông tin",
        message: "Vui lòng nhập đầy đủ tên và số tài khoản nhận tiền.",
      });
      return toast.error("Vui lòng nhập đầy đủ thông tin nhận tiền.");
    }

    setIsProcessing(true);
    try {
      const res = await api.post("/payments/withdraw", {
        amount,
        method: withdrawMethod,
        accountName: withdrawForm.accountName,
        accountNumber: withdrawForm.accountNumber,
        bankName: withdrawForm.bankName,
      });

      if (res.data.success) {
        // Refresh user profile sau khi rút tiền thành công
        await fetchUserProfile();
        setWithdrawNotice({
          type: "success",
          title: "Rút tiền thành công",
          message: `Yêu cầu rút ${formatCurrency(amount)} qua ${getMethodLabel(withdrawMethod)} đã được tiếp nhận.`,
        });
        toast.success(res.data.message || "Đã gửi yêu cầu rút tiền.");
        setShowWithdrawModal(false);
      }
    } catch (err) {
      setWithdrawNotice({
        type: "error",
        title: "Rút tiền thất bại",
        message:
          err.response?.data?.message ||
          "Không thể xử lý yêu cầu rút tiền lúc này.",
      });
      toast.error(err.response?.data?.message || "Lỗi rút tiền.");
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

    console.log("Starting payment execution...");
    console.log("Selected invoice:", selectedInvoice);
    console.log("User before refresh:", user);

    // Refresh user profile và lấy dữ liệu trực tiếp
    let currentUser;
    try {
      const res = await api.get("/auth/profile");
      currentUser = res.data.data || res.data;
      setUser(currentUser); // Cập nhật state
    } catch (err) {
      if (err.response?.status === 401) navigate("/login");
      return toast.error("Không thể lấy thông tin tài khoản.");
    }

    console.log("User after refresh:", currentUser);

    const total = Number(selectedInvoice.tong_tien || 0);
    const balance = Number(currentUser?.so_du || 0);

    console.log("Payment calculation:", {
      selectedInvoiceTongTien: selectedInvoice.tong_tien,
      userSoDu: currentUser?.so_du,
      total: total,
      balance: balance,
      totalType: typeof total,
      balanceType: typeof balance,
      comparison: `${balance} < ${total} = ${balance < total}`
    });

    if (balance < total) {
      console.log("Balance insufficient, showing error");
      setPaymentNotice({
        type: "error",
        title: "Số dư không đủ",
        message: `Số dư hiện tại: ${balance.toLocaleString("vi-VN")}đ. Cần thêm ${(total - balance).toLocaleString("vi-VN")}đ để thanh toán.`,
      });
      return toast.error("Số dư ví không đủ.");
    }

    console.log("Balance sufficient, proceeding with payment");
    setIsProcessing(true);
    try {
      const draftKey = `${PAYMENT_DRAFT_PREFIX}${selectedInvoice.id}`;
      const draft = JSON.parse(localStorage.getItem(draftKey) || "null");

      console.log("Draft data:", draft);
      console.log("Selected invoice:", selectedInvoice);

      const res = await api.post("/payments/execute", {
        invoiceId: selectedInvoice.id,
        ghi_chu: draft?.ghi_chu || "",
        linked_destination_ids: Array.isArray(draft?.selectedLinkedDestinations)
          ? draft.selectedLinkedDestinations.map((item) => item.id)
          : [],
        selected_services: draft?.selectedServices || [],
        linked_services: draft?.linkedServices || {},
      });

      if (res.data.success) {
        localStorage.removeItem(draftKey);
        // Cập nhật lại user profile sau khi thanh toán thành công
        await fetchUserProfile();
        setPaymentNotice({
          type: "success",
          title: "Thanh toán thành công",
          message: `Hóa đơn #${selectedInvoice.id} đã được xử lý và chuyển thành vé điện tử.`,
        });
        setSuccessMessage(
          "Thanh toán thành công. Vé của bạn đã được chuyển sang mục đã thanh toán.",
        );
        toast.success("Thanh toán thành công.");
        setShowPayModal(false);
        setSelectedInvoice(null);
        setActiveTab("completed");
        // Refresh lại danh sách thanh toán
        fetchPayments();
      }
    } catch (err) {
      console.error("Payment error:", err);
      setPaymentNotice({
        type: "error",
        title: "Thanh toán thất bại",
        message:
          err.response?.data?.message || "Giao dịch chưa được thực hiện.",
      });
      toast.error(err.response?.data?.message || "Lỗi giao dịch.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar user={user} />
      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-8 px-4 pb-24 pt-8">
        <div className="col-span-3 hidden lg:block">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 space-y-8 lg:col-span-9">
          <div className="group relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-slate-800 to-blue-900 p-10 text-white shadow-2xl">
            <div className="relative z-10 flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-8">
                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-blue-600 shadow-lg shadow-blue-500/20">
                  <Wallet size={36} />
                </div>
                <div>
                  <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">
                    Số dư hiện tại
                  </p>
                  <h2 className="text-5xl font-black italic tracking-tighter">
                    {Number(user?.so_du || 0).toLocaleString("vi-VN")}
                    <span className="ml-1 text-2xl not-italic text-blue-500">
                      đ
                    </span>
                  </h2>
                  <p className="mt-3 text-sm font-bold text-blue-100/80">
                    Ví số, hóa đơn và vé điện tử đều được quản lý ngay trên nền
                    tảng.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={openDepositModal}
                  className="flex items-center justify-center gap-3 rounded-2xl bg-white px-8 py-5 text-xs font-black uppercase tracking-widest text-slate-900 shadow-xl transition-all hover:bg-blue-600 hover:text-white active:scale-95"
                >
                  <Plus size={20} /> Nạp tiền
                </button>
                <button
                  onClick={openWithdrawModal}
                  className="flex items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/10 px-8 py-5 text-xs font-black uppercase tracking-widest text-white backdrop-blur transition-all hover:bg-white hover:text-slate-900 active:scale-95"
                >
                  <ArrowUpRight size={20} /> Rút tiền
                </button>
              </div>
            </div>

            {[depositNotice, withdrawNotice, paymentNotice].filter(Boolean)
              .length > 0 && (
              <div className="relative z-10 mt-8 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {[depositNotice, withdrawNotice, paymentNotice]
                  .filter(Boolean)
                  .map((notice) => (
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
                      <p className="mt-2 text-sm font-bold leading-relaxed">
                        {notice.message}
                      </p>
                    </div>
                  ))}
              </div>
            )}

            <div className="absolute -bottom-10 -right-10 h-64 w-64 rounded-full bg-blue-600/10 blur-[80px]" />
            <Zap className="absolute right-8 top-6 text-white/5" size={120} />
          </div>

          <div className="rounded-[3rem] border border-white bg-white p-10 shadow-xl shadow-slate-200/50">
            {successMessage && (
              <div className="mb-8 flex items-start gap-3 rounded-[2rem] border border-emerald-100 bg-emerald-50 px-5 py-4 text-emerald-700">
                <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-black">Thanh toán thành công</p>
                  <p className="text-sm font-medium">{successMessage}</p>
                </div>
              </div>
            )}

            <div className="mb-10 flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
                  <ReceiptText size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black uppercase tracking-tighter text-slate-800">
                    Quản lý hóa đơn và vé
                  </h3>
                  <p className="text-sm text-slate-500">
                    Lượng đặt vé, thanh toán và tra cứu vé điện tử đã sẵn sàng.
                  </p>
                </div>
              </div>
              <div className="flex w-full rounded-2xl bg-slate-100 p-1.5 sm:w-auto">
                <button
                  onClick={() => setActiveTab("pending")}
                  className={`flex-1 rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "pending"
                      ? "bg-white text-blue-600 shadow-md"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Chưa thanh toán
                </button>
                <button
                  onClick={() => setActiveTab("completed")}
                  className={`flex-1 rounded-xl px-8 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                    activeTab === "completed"
                      ? "bg-white text-emerald-500 shadow-md"
                      : "text-slate-400 hover:text-slate-600"
                  }`}
                >
                  Đã thanh toán
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {loading ? (
                <div className="col-span-full py-20 text-center font-black italic tracking-widest text-slate-300">
                  Đang tải dữ liệu...
                </div>
              ) : payments.length > 0 ? (
                payments.map((p) => (
                  <div
                    key={p.id}
                    className={`group flex items-center justify-between rounded-[2.5rem] border-2 p-8 transition-all ${
                      activeTab === "pending"
                        ? "border-transparent bg-slate-50 hover:border-blue-200 hover:bg-white"
                        : "border-emerald-100/50 bg-emerald-50/30"
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`h-2 w-2 rounded-full ${
                            activeTab === "pending"
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                          }`}
                        />
                        <p className="text-[9px] font-black uppercase leading-none tracking-widest text-slate-400">
                          Mã #{p.ma_tra_cuu || p.id}
                        </p>
                      </div>
                      <h4 className="mb-2 truncate text-base font-black text-slate-800">
                        {p.ten_kdl || "Dịch vụ du lịch"}
                      </h4>
                      <p className="mb-2 text-xs text-slate-500">
                        {getMethodLabel(p.phuong_thuc)} •{" "}
                        {formatDateTime(p.ngay_tao)}
                      </p>
                      <p className="text-2xl font-black italic tracking-tighter text-blue-600">
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
                            className="flex h-12 w-12 items-center justify-center rounded-[1.1rem] border border-red-100 bg-white text-red-500 shadow-sm transition-all hover:bg-red-500 hover:text-white disabled:opacity-50"
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
                            className="flex h-14 w-14 items-center justify-center rounded-[1.2rem] border border-slate-100 bg-white text-blue-600 shadow-sm transition-all hover:bg-blue-600 hover:text-white group-hover:scale-110"
                          >
                            <ArrowRight size={24} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() =>
                            navigate("/payment-result", {
                              state: { ticket: p },
                            })
                          }
                          className="flex items-center gap-2 rounded-2xl bg-emerald-500 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-emerald-100 transition-all hover:bg-slate-900"
                        >
                          <Ticket size={16} /> Xem vé
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full py-24 text-center">
                  <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-slate-50 text-slate-400 opacity-30">
                    <ReceiptText size={40} />
                  </div>
                  <p className="text-sm font-black uppercase tracking-widest text-slate-300">
                    Hiện chưa có hóa đơn nào
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {showDepositModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
            onClick={() => !isProcessing && setShowDepositModal(false)}
          />
          <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-4">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Nạp tiền
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    Vào ví TravelConnect
                  </p>
                </div>
                <button
                  onClick={() => setShowDepositModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="px-8 pb-8 space-y-8">
                {/* Khu vực số tiền */}
                <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-blue-50 to-indigo-50 p-6 ring-1 ring-blue-100/50">
                  <div className="relative z-10 text-center">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-blue-600/70">
                      Số tiền nạp
                    </p>
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        placeholder="0"
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(e.target.value)}
                        className="w-full bg-transparent text-center text-5xl font-black tracking-tighter text-blue-600 outline-none placeholder:text-blue-200"
                      />
                    </div>
                  </div>
                  
                  {/* Quick amounts */}
                  <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
                    {QUICK_DEPOSIT_OPTIONS.map((amount) => {
                      const active = Number(depositAmount) === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setDepositAmount(String(amount))}
                          className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                            active
                              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                              : "bg-white/60 text-blue-900 hover:bg-white"
                          }`}
                        >
                          {Number(amount).toLocaleString("vi-VN")}đ
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chọn phương thức */}
                <div className="space-y-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
                    Nguồn tiền
                  </p>
                  <div className="space-y-2">
                    {depositMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setPayMethod(method.id)}
                        className={`group flex w-full items-center justify-between rounded-2xl p-4 transition-all ${
                          payMethod === method.id
                            ? "bg-slate-900 text-white ring-1 ring-slate-900"
                            : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full transition-transform group-hover:scale-105 ${
                              payMethod === method.id ? "bg-white/20" : method.color + " text-white"
                            }`}
                          >
                            {React.cloneElement(method.icon, { size: 18 })}
                          </div>
                          <span className="font-bold">{method.name}</span>
                        </div>
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors ${
                          payMethod === method.id ? "border-white" : "border-slate-300"
                        }`}>
                          {payMethod === method.id && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleDeposit}
                  disabled={isProcessing}
                  className="w-full rounded-full bg-blue-600 py-5 text-[13px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-600/20 transition-all hover:bg-blue-700 active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận nạp tiền"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showWithdrawModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-0">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity"
            onClick={() => !isProcessing && setShowWithdrawModal(false)}
          />
          <div className="relative z-10 w-full max-w-md animate-in fade-in zoom-in-95 duration-200">
            <div className="overflow-hidden rounded-[2.5rem] bg-white shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)]">
              {/* Header */}
              <div className="flex items-center justify-between px-8 pt-8 pb-4">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-slate-900">
                    Rút tiền
                  </h3>
                  <p className="text-sm font-medium text-slate-500">
                    Về tài khoản của bạn
                  </p>
                </div>
                <button
                  onClick={() => setShowWithdrawModal(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
                >
                  <X size={20} strokeWidth={2.5} />
                </button>
              </div>

              <div className="px-8 pb-8 space-y-6">
                {/* Khu vực số tiền */}
                <div className="relative overflow-hidden rounded-[2rem] bg-slate-50 p-6">
                  <div className="relative z-10 text-center">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Số tiền rút
                    </p>
                    <input
                      type="number"
                      placeholder="0"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full bg-transparent text-center text-5xl font-black tracking-tighter text-slate-900 outline-none placeholder:text-slate-300"
                    />
                  </div>
                  
                  {/* Quick amounts */}
                  <div className="relative z-10 mt-6 grid grid-cols-3 gap-2">
                    {QUICK_WITHDRAW_OPTIONS.map((amount) => {
                      const active = Number(withdrawAmount) === amount;
                      return (
                        <button
                          key={amount}
                          type="button"
                          onClick={() => setWithdrawAmount(String(amount))}
                          className={`rounded-xl py-2.5 text-xs font-bold transition-all ${
                            active
                              ? "bg-slate-900 text-white shadow-md shadow-slate-900/20"
                              : "bg-white text-slate-600 shadow-sm hover:bg-slate-100"
                          }`}
                        >
                          {Number(amount).toLocaleString("vi-VN")}đ
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Chọn kênh & Form nhập liệu */}
                <div className="space-y-4">
                  <div className="flex gap-2 rounded-2xl bg-slate-100 p-1.5">
                    {withdrawMethods.map((method) => (
                      <button
                        key={method.id}
                        onClick={() => setWithdrawMethod(method.id)}
                        className={`flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all ${
                          withdrawMethod === method.id
                            ? "bg-white text-slate-900 shadow-sm"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {React.cloneElement(method.icon, { size: 16 })}
                        {method.name}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-3 pt-2">
                    {withdrawMethod === "bank_transfer" && (
                      <input
                        value={withdrawForm.bankName}
                        onChange={(e) => setWithdrawForm((prev) => ({ ...prev, bankName: e.target.value }))}
                        placeholder="Tên ngân hàng (VD: Vietcombank)"
                        className="w-full rounded-2xl border-0 bg-slate-50 px-5 py-4 font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                      />
                    )}
                    <input
                      value={withdrawForm.accountNumber}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                      placeholder={withdrawMethod === "momo" ? "Số điện thoại MoMo" : "Số tài khoản"}
                      className="w-full rounded-2xl border-0 bg-slate-50 px-5 py-4 font-semibold text-slate-900 placeholder:text-slate-400 focus:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                    />
                    <input
                      value={withdrawForm.accountName}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, accountName: e.target.value }))}
                      placeholder="Tên chủ tài khoản (Viết hoa không dấu)"
                      className="w-full rounded-2xl border-0 bg-slate-50 px-5 py-4 font-semibold uppercase text-slate-900 placeholder:normal-case placeholder:text-slate-400 focus:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-900/10 transition-all"
                    />
                  </div>
                </div>

                {/* Submit */}
                <button
                  onClick={handleWithdraw}
                  disabled={isProcessing}
                  className="w-full rounded-full bg-slate-900 py-5 text-[13px] font-black uppercase tracking-widest text-white shadow-xl shadow-slate-900/20 transition-all hover:bg-slate-800 active:scale-[0.98] disabled:opacity-70 disabled:shadow-none"
                >
                  {isProcessing ? "Đang xử lý..." : "Xác nhận yêu cầu"}
                </button>
              </div>
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
          <div className="relative z-10 w-full max-w-sm rounded-[3rem] bg-white shadow-2xl">
            <div className="relative overflow-hidden rounded-t-[3rem] bg-blue-600 p-10 text-center text-white">
              <Sparkles
                className="absolute left-4 top-4 text-white/10"
                size={80}
              />
              <p className="mb-2 text-[10px] font-black uppercase tracking-widest opacity-60">
                Thanh toán dịch vụ
              </p>
              <h3 className="text-3xl font-black italic tracking-tighter">
                Xác nhận
              </h3>
            </div>
            <div className="space-y-8 p-10">
              <div className="space-y-2 text-center">
                <p className="text-sm font-bold text-slate-400">
                  {selectedInvoice.ten_kdl}
                </p>
                <p className="text-xs text-slate-500">
                  {getMethodLabel(selectedInvoice.phuong_thuc)} •{" "}
                  {formatDateTime(selectedInvoice.ngay_den)}
                </p>
                <p className="text-4xl font-black italic tracking-tighter text-blue-600">
                  {formatCurrency(selectedInvoice.tong_tien)}
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-2xl bg-emerald-50 p-4 text-emerald-700">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0" />
                  <p className="text-[10px] font-black uppercase tracking-tight leading-relaxed">
                    Thanh toán thành công sẽ tạo vé ngay lập tức.
                  </p>
                </div>

                {Number(user?.so_du || 0) <
                  Number(selectedInvoice.tong_tien || 0) && (
                  <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-amber-700">
                    <AlertCircle size={20} className="mt-0.5 shrink-0" />
                    <p className="text-[11px] font-bold leading-relaxed">
                      Số dư hiện tại không đủ để thanh toán hóa đơn này.
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => setShowPayModal(false)}
                    className="rounded-2xl bg-slate-100 py-5 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-all hover:bg-slate-200"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleExecutePayment}
                    disabled={
                      isProcessing ||
                      Number(user?.so_du || 0) <
                        Number(selectedInvoice.tong_tien || 0)
                    }
                    className="rounded-2xl bg-blue-600 py-5 text-[10px] font-black uppercase tracking-widest text-white shadow-xl shadow-blue-100 transition-all hover:bg-slate-900 disabled:bg-slate-300"
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
