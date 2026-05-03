import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'users', label: 'Người dùng' },
  { id: 'businesses', label: 'Duyệt KDL' },
  { id: 'bookings', label: 'Booking' },
  { id: 'payments', label: 'Thanh toán' },
  { id: 'platform', label: 'Nền tảng' },
]

const formatCurrency = (value) => `${Number(value || 0).toLocaleString('vi-VN')}đ`

const formatDateTime = (value) => {
  if (!value) return '--'
  return new Date(value).toLocaleString('vi-VN')
}

const StatCard = ({ label, value, hint, colorClass }) => (
  <div className={`rounded-[1.8rem] p-5 ${colorClass}`}>
    <p className="text-[11px] font-black uppercase tracking-widest">{label}</p>
    <p className="text-3xl font-black mt-4">{value}</p>
    {hint ? <p className="text-xs font-bold mt-2 opacity-80">{hint}</p> : null}
  </div>
)

const AccountStatusBadge = ({ value }) => (
  <span
    className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
      value === 'suspended' ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
    }`}
  >
    {value === 'suspended' ? 'Tạm khóa' : 'Hoạt động'}
  </span>
)

const BusinessStatusBadge = ({ value }) => {
  const style =
    value === 'verified'
      ? 'bg-emerald-50 text-emerald-700'
      : value === 'rejected'
        ? 'bg-rose-50 text-rose-700'
        : 'bg-amber-50 text-amber-700'

  const label =
    value === 'verified' ? 'Đã duyệt' : value === 'rejected' ? 'Từ chối' : 'Chờ duyệt'

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style}`}>
      {label}
    </span>
  )
}

const AdminDashboard = ({ user }) => {
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [platformSettings, setPlatformSettings] = useState({ referral_commission_rate: 0.1 })
  const [categories, setCategories] = useState([])
  const [categoryForm, setCategoryForm] = useState({ ten: '', thu_tu: 0, dang_hoat_dong: true })
  const [actionLoading, setActionLoading] = useState('')

  const loadData = async () => {
    try {
      setLoading(true)
      const [overviewRes, usersRes, businessesRes, bookingsRes, paymentsRes, settingsRes, categoriesRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/businesses'),
        api.get('/admin/bookings'),
        api.get('/admin/payments'),
        api.get('/admin/platform-settings'),
        api.get('/admin/categories'),
      ])

      setOverview(overviewRes.data.data)
      setUsers(usersRes.data.data || [])
      setBusinesses(businessesRes.data.data || [])
      setBookings(bookingsRes.data.data || [])
      setPayments(paymentsRes.data.data || [])
      setPlatformSettings(settingsRes.data.data || { referral_commission_rate: 0.1 })
      setCategories(categoriesRes.data.data || [])
    } catch (err) {
      console.error(err)
      toast.error(err.response?.data?.message || 'Không thể tải dữ liệu quản trị')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleBusinessReview = async (businessId, nextStatus) => {
    const note =
      nextStatus === 'rejected'
        ? window.prompt('Nhập lý do từ chối hồ sơ KDL:', 'Thiếu thông tin xác minh.') || ''
        : window.prompt('Ghi chú quản trị (có thể bỏ trống):', '') || ''

    setActionLoading(`business-${businessId}-${nextStatus}`)
    try {
      await api.put(`/admin/businesses/${businessId}/review`, {
        trang_thai_duyet: nextStatus,
        ghi_chu_duyet: note,
      })
      toast.success('Đã cập nhật trạng thái duyệt KDL.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái duyệt.')
    } finally {
      setActionLoading('')
    }
  }

  const handleUserStatus = async (userId, currentStatus) => {
    const nextStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
    const reason =
      nextStatus === 'suspended'
        ? window.prompt('Nhập lý do tạm khóa tài khoản:', 'Vi phạm chính sách nền tảng.') || ''
        : ''

    setActionLoading(`user-${userId}-${nextStatus}`)
    try {
      await api.put(`/admin/users/${userId}/status`, {
        trang_thai_tai_khoan: nextStatus,
        ly_do_khoa: reason,
      })
      toast.success('Đã cập nhật trạng thái tài khoản.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật trạng thái tài khoản.')
    } finally {
      setActionLoading('')
    }
  }

  const handlePlatformSettingsSave = async () => {
    setActionLoading('platform-settings')
    try {
      await api.put('/admin/platform-settings', {
        referral_commission_rate: Number(platformSettings.referral_commission_rate || 0),
      })
      toast.success('Đã cập nhật tỷ lệ hoa hồng.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật cấu hình nền tảng.')
    } finally {
      setActionLoading('')
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    setActionLoading('create-category')
    try {
      await api.post('/admin/categories', {
        ten: categoryForm.ten,
        thu_tu: Number(categoryForm.thu_tu || 0),
        dang_hoat_dong: categoryForm.dang_hoat_dong,
      })
      toast.success('Đã thêm danh mục.')
      setCategoryForm({ ten: '', thu_tu: 0, dang_hoat_dong: true })
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể thêm danh mục.')
    } finally {
      setActionLoading('')
    }
  }

  const handleCategoryFieldChange = (id, field, value) => {
    setCategories((prev) =>
      prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    )
  }

  const handleUpdateCategory = async (category) => {
    setActionLoading(`category-update-${category.id}`)
    try {
      await api.put(`/admin/categories/${category.id}`, {
        ten: category.ten,
        thu_tu: Number(category.thu_tu || 0),
        dang_hoat_dong: Boolean(category.dang_hoat_dong),
      })
      toast.success('Đã cập nhật danh mục.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật danh mục.')
    } finally {
      setActionLoading('')
    }
  }

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Xóa danh mục "${category.ten}"?`)) return

    setActionLoading(`category-delete-${category.id}`)
    try {
      await api.delete(`/admin/categories/${category.id}`)
      toast.success('Đã xóa danh mục.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa danh mục.')
    } finally {
      setActionLoading('')
    }
  }

  const statCards = useMemo(() => {
    if (!overview) return []

    return [
      {
        label: 'Người dùng',
        value: overview.users.total,
        hint: `${overview.users.businesses} đối tác, ${overview.users.tourists} khách du lịch`,
        colorClass: 'bg-blue-50 text-blue-700',
      },
      {
        label: 'KDL chờ duyệt',
        value: overview.businessApproval?.pending || 0,
        hint: `${overview.businessApproval?.verified || 0} hồ sơ đã duyệt`,
        colorClass: 'bg-amber-50 text-amber-700',
      },
      {
        label: 'Tài khoản khóa',
        value: overview.users.suspended,
        hint: 'Kiểm soát rủi ro nền tảng',
        colorClass: 'bg-rose-50 text-rose-700',
      },
      {
        label: 'Booking chờ xử lý',
        value: overview.bookings.pending,
        hint: `${overview.bookings.total} booking toàn hệ thống`,
        colorClass: 'bg-cyan-50 text-cyan-700',
      },
      {
        label: 'Doanh thu',
        value: formatCurrency(overview.payments.revenue),
        hint: `${overview.payments.completed} giao dịch hoàn tất`,
        colorClass: 'bg-emerald-50 text-emerald-700',
      },
    ]
  }, [overview])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-slate-800 mx-auto" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
            Đang tải trung tâm quản trị...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={user} />

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6 pt-6 px-4 pb-10">
        <div className="hidden lg:block col-span-3">
          <Sidebar user={user} />
        </div>

        <div className="col-span-12 lg:col-span-9 space-y-6">
          <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-3">
              Trung tâm quản trị
            </p>
            <h1 className="text-3xl font-black text-slate-900 mb-2">
              Điều hành nền tảng TravelConnect
            </h1>
            <p className="text-sm text-slate-500">
              Theo dõi hệ thống, duyệt đối tác, quản lý người dùng và kiểm soát booking, thanh toán trên cùng một màn hình.
            </p>
          </div>

          <div className="grid md:grid-cols-2 xl:grid-cols-5 gap-4">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="bg-white rounded-[2.5rem] p-4 shadow-sm border border-gray-100 flex flex-wrap gap-3">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`px-5 py-3 rounded-full text-xs font-black uppercase tracking-widest border transition-all ${
                  tab === item.id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {tab === 'overview' && overview ? (
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 mb-5">Người dùng mới gần đây</h2>
                <div className="space-y-4">
                  {overview.recentUsers.map((item) => (
                    <div key={item.id} className="rounded-[1.4rem] bg-slate-50 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-black text-slate-800">{item.ten}</p>
                          <p className="text-sm text-slate-500">{item.email}</p>
                        </div>
                        <AccountStatusBadge value={item.trang_thai_tai_khoan} />
                      </div>
                      <p className="text-xs font-bold text-slate-400 mt-2">
                        {formatDateTime(item.ngay_tao)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm">
                <h2 className="text-xl font-black text-slate-800 mb-5">Bài viết mới gần đây</h2>
                <div className="space-y-4">
                  {overview.recentPosts.map((item) => (
                    <div key={item.id} className="rounded-[1.4rem] bg-slate-50 p-4">
                      <p className="font-black text-slate-800">{item.tieu_de}</p>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                        <span>{item.author_name}</span>
                        <span>{item.author_role}</span>
                        <span>{formatDateTime(item.ngay_tao)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          {tab === 'users' ? (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-x-auto">
              <h2 className="text-xl font-black text-slate-900 mb-5">Quản lý người dùng</h2>
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="text-left text-slate-400 uppercase text-[11px] tracking-widest">
                    <th className="pb-4">Tên</th>
                    <th className="pb-4">Vai trò</th>
                    <th className="pb-4">Trạng thái</th>
                    <th className="pb-4">Số dư</th>
                    <th className="pb-4">Bài viết</th>
                    <th className="pb-4">Booking</th>
                    <th className="pb-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-4">
                        <p className="font-black text-slate-800">{item.ten}</p>
                        <p className="text-slate-500">{item.email}</p>
                      </td>
                      <td className="py-4 font-bold text-slate-600">{item.vai_tro}</td>
                      <td className="py-4">
                        <AccountStatusBadge value={item.trang_thai_tai_khoan} />
                        {item.ly_do_khoa ? (
                          <p className="text-xs text-rose-600 mt-2 max-w-[220px]">{item.ly_do_khoa}</p>
                        ) : null}
                      </td>
                      <td className="py-4 font-bold text-slate-600">{formatCurrency(item.so_du)}</td>
                      <td className="py-4 font-bold text-slate-600">{item.total_posts}</td>
                      <td className="py-4 font-bold text-slate-600">{item.total_bookings}</td>
                      <td className="py-4">
                        {item.vai_tro !== 'admin' ? (
                          <button
                            onClick={() => handleUserStatus(item.id, item.trang_thai_tai_khoan)}
                            disabled={Boolean(actionLoading)}
                            className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest ${
                              item.trang_thai_tai_khoan === 'suspended'
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-rose-50 text-rose-700'
                            }`}
                          >
                            {actionLoading === `user-${item.id}-${item.trang_thai_tai_khoan === 'suspended' ? 'active' : 'suspended'}`
                              ? 'Đang xử lý...'
                              : item.trang_thai_tai_khoan === 'suspended'
                                ? 'Mở khóa'
                                : 'Tạm khóa'}
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400 font-bold">Bảo vệ hệ thống</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'businesses' ? (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-x-auto">
              <h2 className="text-xl font-black text-slate-900 mb-5">Duyệt đối tác khu du lịch</h2>
              <table className="w-full min-w-[1040px] text-sm">
                <thead>
                  <tr className="text-left text-slate-400 uppercase text-[11px] tracking-widest">
                    <th className="pb-4">Đối tác</th>
                    <th className="pb-4">Khu du lịch</th>
                    <th className="pb-4">Tỉnh thành</th>
                    <th className="pb-4">Duyệt hồ sơ</th>
                    <th className="pb-4">Tài khoản</th>
                    <th className="pb-4">Ghi chú</th>
                    <th className="pb-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {businesses.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="py-4">
                        <p className="font-black text-slate-800">{item.ten}</p>
                        <p className="text-slate-500">{item.email}</p>
                      </td>
                      <td className="py-4 font-bold text-slate-700">{item.ten_khu_du_lich}</td>
                      <td className="py-4 font-bold text-slate-600">{item.tinh_thanh || '--'}</td>
                      <td className="py-4">
                        <BusinessStatusBadge value={item.trang_thai_duyet} />
                        {item.ngay_duyet ? (
                          <p className="text-xs text-slate-400 mt-2">{formatDateTime(item.ngay_duyet)}</p>
                        ) : null}
                      </td>
                      <td className="py-4">
                        <AccountStatusBadge value={item.trang_thai_tai_khoan} />
                      </td>
                      <td className="py-4 text-slate-600 max-w-[240px]">{item.ghi_chu_duyet || '--'}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleBusinessReview(item.id, 'verified')}
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest"
                          >
                            {actionLoading === `business-${item.id}-verified` ? 'Đang xử lý...' : 'Duyệt'}
                          </button>
                          <button
                            onClick={() => handleBusinessReview(item.id, 'rejected')}
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-widest"
                          >
                            {actionLoading === `business-${item.id}-rejected` ? 'Đang xử lý...' : 'Từ chối'}
                          </button>
                          <button
                            onClick={() => handleBusinessReview(item.id, 'pending')}
                            disabled={Boolean(actionLoading)}
                            className="px-3 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-black uppercase tracking-widest"
                          >
                            {actionLoading === `business-${item.id}-pending` ? 'Đang xử lý...' : 'Chờ lại'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'bookings' ? (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-x-auto">
              <h2 className="text-xl font-black text-slate-900 mb-5">Theo dõi booking</h2>
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-left text-slate-400 uppercase text-[11px] tracking-widest">
                    <th className="pb-4">Khách</th>
                    <th className="pb-4">KDL</th>
                    <th className="pb-4">Ngày đến</th>
                    <th className="pb-4">Số người</th>
                    <th className="pb-4">Tổng tiền</th>
                    <th className="pb-4">Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-4 font-black text-slate-800">{item.customer_name || item.ten_khach}</td>
                      <td className="py-4 font-bold text-slate-600">{item.business_name || '--'}</td>
                      <td className="py-4 font-bold text-slate-600">{formatDateTime(item.ngay_den)}</td>
                      <td className="py-4 font-bold text-slate-600">{item.so_nguoi || 0}</td>
                      <td className="py-4 font-bold text-slate-600">{formatCurrency(item.tong_tien)}</td>
                      <td className="py-4 font-black text-slate-400 uppercase">{item.trang_thai}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'payments' ? (
            <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-x-auto">
              <h2 className="text-xl font-black text-slate-900 mb-5">Theo dõi thanh toán</h2>
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="text-left text-slate-400 uppercase text-[11px] tracking-widest">
                    <th className="pb-4">Khách</th>
                    <th className="pb-4">KDL</th>
                    <th className="pb-4">Tổng tiền</th>
                    <th className="pb-4">Phương thức</th>
                    <th className="pb-4">Trạng thái</th>
                    <th className="pb-4">Mã tra cứu</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100">
                      <td className="py-4 font-black text-slate-800">{item.customer_name || '--'}</td>
                      <td className="py-4 font-bold text-slate-600">{item.business_name || item.ten_kdl || '--'}</td>
                      <td className="py-4 font-bold text-slate-600">{formatCurrency(item.tong_tien)}</td>
                      <td className="py-4 font-bold text-slate-600">{item.phuong_thuc}</td>
                      <td className="py-4 font-black text-slate-400 uppercase">{item.trang_thai}</td>
                      <td className="py-4 font-bold text-slate-500">{item.ma_tra_cuu || '--'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'platform' ? (
            <div className="space-y-6">
              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-slate-900 mb-5">Cấu hình hoa hồng</h2>
                <div className="grid md:grid-cols-[1fr_auto] gap-4 items-end">
                  <div>
                    <label className="block text-[11px] font-black uppercase tracking-widest text-slate-400 mb-3">
                      Tỷ lệ hoa hồng giới thiệu
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.01"
                      value={platformSettings.referral_commission_rate}
                      onChange={(e) =>
                        setPlatformSettings((prev) => ({
                          ...prev,
                          referral_commission_rate: e.target.value,
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                    />
                    <p className="mt-2 text-xs text-slate-500">
                      Nhập dạng thập phân. Ví dụ `0.1` là 10%, `0.05` là 5%.
                    </p>
                  </div>
                  <button
                    onClick={handlePlatformSettingsSave}
                    disabled={Boolean(actionLoading)}
                    className="px-5 py-4 rounded-2xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest"
                  >
                    {actionLoading === 'platform-settings' ? 'Đang lưu...' : 'Lưu cấu hình'}
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100">
                <h2 className="text-xl font-black text-slate-900 mb-5">Thêm danh mục</h2>
                <form onSubmit={handleCreateCategory} className="grid md:grid-cols-4 gap-4">
                  <input
                    value={categoryForm.ten}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, ten: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                    placeholder="Tên danh mục"
                  />
                  <input
                    type="number"
                    value={categoryForm.thu_tu}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, thu_tu: e.target.value }))}
                    className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                    placeholder="Thứ tự"
                  />
                  <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700">
                    <input
                      type="checkbox"
                      checked={categoryForm.dang_hoat_dong}
                      onChange={(e) =>
                        setCategoryForm((prev) => ({ ...prev, dang_hoat_dong: e.target.checked }))
                      }
                    />
                    Đang hoạt động
                  </label>
                  <button
                    type="submit"
                    disabled={Boolean(actionLoading)}
                    className="rounded-2xl bg-blue-600 px-5 py-4 text-xs font-black uppercase tracking-widest text-white"
                  >
                    {actionLoading === 'create-category' ? 'Đang thêm...' : 'Thêm danh mục'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 overflow-x-auto">
                <h2 className="text-xl font-black text-slate-900 mb-5">Danh sách danh mục</h2>
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="text-left text-slate-400 uppercase text-[11px] tracking-widest">
                      <th className="pb-4">Tên danh mục</th>
                      <th className="pb-4">Slug</th>
                      <th className="pb-4">Thứ tự</th>
                      <th className="pb-4">Trạng thái</th>
                      <th className="pb-4">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="py-4">
                          <input
                            value={item.ten}
                            onChange={(e) => handleCategoryFieldChange(item.id, 'ten', e.target.value)}
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none"
                          />
                        </td>
                        <td className="py-4 font-bold text-slate-500">{item.slug}</td>
                        <td className="py-4">
                          <input
                            type="number"
                            value={item.thu_tu}
                            onChange={(e) => handleCategoryFieldChange(item.id, 'thu_tu', e.target.value)}
                            className="w-28 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 font-bold text-slate-700 outline-none"
                          />
                        </td>
                        <td className="py-4">
                          <label className="inline-flex items-center gap-2 text-sm font-bold text-slate-600">
                            <input
                              type="checkbox"
                              checked={Boolean(item.dang_hoat_dong)}
                              onChange={(e) =>
                                handleCategoryFieldChange(item.id, 'dang_hoat_dong', e.target.checked)
                              }
                            />
                            Hoạt động
                          </label>
                        </td>
                        <td className="py-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleUpdateCategory(item)}
                              disabled={Boolean(actionLoading)}
                              className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-black uppercase tracking-widest"
                            >
                              {actionLoading === `category-update-${item.id}` ? 'Đang lưu...' : 'Lưu'}
                            </button>
                            <button
                              onClick={() => handleDeleteCategory(item)}
                              disabled={Boolean(actionLoading)}
                              className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 text-xs font-black uppercase tracking-widest"
                            >
                              {actionLoading === `category-delete-${item.id}` ? 'Đang xóa...' : 'Xóa'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default AdminDashboard
