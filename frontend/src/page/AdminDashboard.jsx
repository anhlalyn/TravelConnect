import React, { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../api'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const tabs = [
  { id: 'overview', label: 'Tổng quan' },
  { id: 'users', label: 'Người dùng' },
  { id: 'posts', label: 'Bài viết' },
  { id: 'reports', label: 'Báo cáo' },
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

const StatCard = ({ label, value, hint, colorClass, spanClass = '' }) => (
  <div className={`flex min-h-[112px] flex-col justify-between rounded-[1.25rem] p-3 sm:min-h-[132px] sm:rounded-[1.8rem] sm:p-5 ${colorClass} ${spanClass}`}>
    <p className="text-[9px] font-black uppercase tracking-widest sm:text-[11px]">{label}</p>
    <p className="mt-2 break-words text-xl font-black leading-tight sm:mt-4 sm:text-3xl">{value}</p>
    {hint ? <p className="mt-2 line-clamp-2 text-[10px] font-bold leading-snug opacity-80 sm:text-xs">{hint}</p> : null}
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

const reportStatusMeta = {
  pending: { label: 'Chờ xử lý', color: '#f97316', className: 'bg-orange-50 text-orange-700' },
  reviewed: { label: 'Đã xử lý', color: '#10b981', className: 'bg-emerald-50 text-emerald-700' },
  dismissed: { label: 'Bỏ qua', color: '#64748b', className: 'bg-slate-100 text-slate-600' },
}

const ReportStatusBadge = ({ value }) => {
  const meta = reportStatusMeta[value] || {
    label: value || '--',
    className: 'bg-slate-100 text-slate-600',
  }

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${meta.className}`}>
      {meta.label}
    </span>
  )
}

const ReportDonutChart = ({ items, total }) => {
  const segments = items
    .filter((item) => item.value > 0)
    .reduce((acc, item) => {
      const start = acc.cursor
      const end = start + (item.value / Math.max(total, 1)) * 100
      return {
        cursor: end,
        values: [...acc.values, `${item.color} ${start}% ${end}%`],
      }
    }, { cursor: 0, values: [] }).values

  return (
    <div className="grid gap-4 rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-5 md:grid-cols-[180px_1fr]">
      <div className="relative mx-auto flex h-32 w-32 items-center justify-center rounded-full sm:h-40 sm:w-40"
        style={{ background: segments.length ? `conic-gradient(${segments.join(', ')})` : '#e2e8f0' }}
      >
        <div className="flex h-20 w-20 flex-col items-center justify-center rounded-full bg-white shadow-inner sm:h-24 sm:w-24">
          <span className="text-2xl font-black text-slate-900 sm:text-3xl">{total}</span>
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">báo cáo</span>
        </div>
      </div>
      <div className="flex flex-col justify-center gap-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-4 py-3">
            <div className="flex items-center gap-3">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-sm font-black text-slate-700">{item.label}</span>
            </div>
            <span className="text-sm font-black text-slate-900">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

const ReportReasonBars = ({ items, total }) => (
  <div className="rounded-[1.5rem] border border-slate-100 bg-white p-4 shadow-sm sm:rounded-[1.75rem] sm:p-5">
    <div className="mb-5 flex items-center justify-between gap-3">
      <h3 className="text-lg font-black text-slate-900">Lý do bị báo cáo</h3>
      <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
        Top {items.length}
      </span>
    </div>
    <div className="space-y-4">
      {items.length ? (
        items.map((item) => {
          const percent = Math.round((item.value / Math.max(total, 1)) * 100)
          return (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-xs font-black text-slate-600">
                <span className="line-clamp-1">{item.label}</span>
                <span>{item.value} lượt</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-blue-600"
                  style={{ width: `${Math.max(percent, 6)}%` }}
                />
              </div>
            </div>
          )
        })
      ) : (
        <div className="rounded-2xl bg-slate-50 p-6 text-center text-xs font-black uppercase tracking-widest text-slate-400">
          Chưa có dữ liệu báo cáo
        </div>
      )}
    </div>
  </div>
)

const AdminDashboard = ({ user }) => {
  const [tab, setTab] = useState('overview')
  const [loading, setLoading] = useState(true)
  const [overview, setOverview] = useState(null)
  const [users, setUsers] = useState([])
  const [posts, setPosts] = useState([])
  const [reports, setReports] = useState([])
  const [businesses, setBusinesses] = useState([])
  const [bookings, setBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [platformSettings, setPlatformSettings] = useState({
    referral_commission_rate: 0.1,
    site_branding: { app_name: 'TravelConnect', logo_url: '' },
    support_content: {
      title: 'Can ho tro?',
      message: 'Lien he tong dai TravelConnect 24/7',
    },
  })
  const [categories, setCategories] = useState([])
  const [categoryForm, setCategoryForm] = useState({ ten: '', thu_tu: 0, dang_hoat_dong: true })
  const [actionLoading, setActionLoading] = useState('')
  const [filters, setFilters] = useState({
    userRole: 'all',
    postRole: 'all',
    reportStatus: 'all',
    bookingStatus: 'all',
    paymentStatus: 'all',
  })

  const loadData = async () => {
    try {
      setLoading(true)
      const [overviewRes, usersRes, postsRes, reportsRes, businessesRes, bookingsRes, paymentsRes, settingsRes, categoriesRes] = await Promise.all([
        api.get('/admin/overview'),
        api.get('/admin/users'),
        api.get('/admin/posts'),
        api.get('/admin/post-reports'),
        api.get('/admin/businesses'),
        api.get('/admin/bookings'),
        api.get('/admin/payments'),
        api.get('/admin/platform-settings'),
        api.get('/admin/categories'),
      ])

      setOverview(overviewRes.data.data)
      setUsers(usersRes.data.data || [])
      setPosts(postsRes.data.data || [])
      setReports(reportsRes.data.data || [])
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

  const handleDeletePost = async (post) => {
    if (!window.confirm(`Xóa bài viết "${post.tieu_de || 'Không tiêu đề'}"?`)) return

    setActionLoading(`post-delete-${post.id}`)
    try {
      await api.delete(`/admin/posts/${post.id}`)
      toast.success('Đã xóa bài viết.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể xóa bài viết.')
    } finally {
      setActionLoading('')
    }
  }

  const handleReportStatus = async (report, nextStatus) => {
    const note =
      nextStatus === 'dismissed'
        ? window.prompt('Ghi chú bỏ qua báo cáo:', 'Không phát hiện vi phạm.') || ''
        : window.prompt('Ghi chú xử lý báo cáo:', 'Đã kiểm tra nội dung.') || ''

    setActionLoading(`report-${report.id}-${nextStatus}`)
    try {
      await api.put(`/admin/post-reports/${report.id}`, {
        trang_thai: nextStatus,
        ghi_chu_admin: note,
      })
      toast.success('Đã cập nhật báo cáo.')
      await loadData()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể cập nhật báo cáo.')
    } finally {
      setActionLoading('')
    }
  }

  const filteredUsers = useMemo(
    () =>
      filters.userRole === 'all'
        ? users
        : users.filter((item) => item.vai_tro === filters.userRole),
    [filters.userRole, users],
  )

  const filteredPosts = useMemo(
    () =>
      filters.postRole === 'all'
        ? posts
        : posts.filter((item) => item.author_role === filters.postRole),
    [filters.postRole, posts],
  )

  const filteredReports = useMemo(
    () =>
      filters.reportStatus === 'all'
        ? reports
        : reports.filter((item) => item.trang_thai === filters.reportStatus),
    [filters.reportStatus, reports],
  )

  const reportStatusChart = useMemo(
    () =>
      Object.entries(reportStatusMeta).map(([id, meta]) => ({
        id,
        label: meta.label,
        color: meta.color,
        value: reports.filter((item) => item.trang_thai === id).length,
      })),
    [reports],
  )

  const reportReasonChart = useMemo(() => {
    const reasonCounts = filteredReports.reduce((acc, item) => {
      const reason = item.ly_do?.trim() || 'Không ghi lý do'
      acc[reason] = (acc[reason] || 0) + 1
      return acc
    }, {})

    return Object.entries(reasonCounts)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [filteredReports])

  const filteredBookings = useMemo(
    () =>
      filters.bookingStatus === 'all'
        ? bookings
        : bookings.filter((item) => item.trang_thai === filters.bookingStatus),
    [bookings, filters.bookingStatus],
  )

  const filteredPayments = useMemo(
    () =>
      filters.paymentStatus === 'all'
        ? payments
        : payments.filter((item) => item.trang_thai === filters.paymentStatus),
    [filters.paymentStatus, payments],
  )

  const handlePlatformSettingsSave = async () => {
    setActionLoading('platform-settings')
    try {
      await api.put('/admin/platform-settings', {
        referral_commission_rate: Number(platformSettings.referral_commission_rate || 0),
        site_branding: platformSettings.site_branding,
        support_content: platformSettings.support_content,
      })
      toast.success('Đã cập nhật cấu hình nền tảng.')
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
        label: 'Bài viết',
        value: overview.posts.total,
        hint: `${overview.posts.newIn7Days} bài mới trong 7 ngày`,
        colorClass: 'bg-indigo-50 text-indigo-700',
      },
      {
        label: 'Báo cáo chờ xử lý',
        value: overview.postReports?.pending || 0,
        hint: `${overview.postReports?.total || 0} báo cáo toàn hệ thống`,
        colorClass: 'bg-orange-50 text-orange-700',
      },
      {
        label: 'Doanh thu',
        value: formatCurrency(overview.payments.revenue),
        hint: `${overview.payments.completed} giao dịch hoàn tất`,
        colorClass: 'bg-emerald-50 text-emerald-700',
        spanClass: 'col-span-2 sm:col-span-1',
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

      <div className="mx-auto grid max-w-[1500px] grid-cols-12 gap-3 px-3 pb-10 pt-3 sm:px-4 md:gap-6 md:pt-6">
        <div className="hidden lg:col-span-3 lg:block xl:col-span-2">
          <Sidebar
            user={user}
            adminTabs={tabs}
            activeAdminTab={tab}
            onAdminTabChange={setTab}
          />
        </div>

        <div className="col-span-12 space-y-3 md:space-y-6 lg:col-span-9 xl:col-span-10">
          <div className="rounded-[1.5rem] border border-gray-100 bg-white p-5 shadow-sm sm:rounded-[2.5rem] sm:p-8">
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 sm:mb-3 sm:text-[11px]">
              Trung tâm quản trị
            </p>
            <h1 className="mb-2 text-xl font-black leading-snug text-slate-900 sm:text-3xl">
              Điều hành nền tảng TravelConnect
            </h1>
            <p className="text-xs font-semibold leading-relaxed text-slate-500 sm:text-sm">
              Theo dõi hệ thống, duyệt đối tác, quản lý người dùng và kiểm soát booking, thanh toán trên cùng một màn hình.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:grid-cols-5">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>

          <div className="flex gap-2 overflow-x-auto rounded-[1.5rem] border border-gray-100 bg-white p-2 shadow-sm lg:hidden sm:flex-wrap sm:gap-3 sm:rounded-[2.5rem] sm:p-4">
            {tabs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`shrink-0 rounded-full border px-3 py-2.5 text-[10px] font-black uppercase tracking-widest transition-all sm:px-5 sm:py-3 sm:text-xs ${
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
            <div className="grid gap-4 md:grid-cols-2 md:gap-6">
              <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
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

              <div className="rounded-[1.75rem] border border-slate-100 bg-white p-5 shadow-sm sm:rounded-[2rem] sm:p-6">
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
            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">Quản lý người dùng</h2>
                <select
                  value={filters.userRole}
                  onChange={(e) => setFilters((prev) => ({ ...prev, userRole: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-600 outline-none"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="khach_du_lich">Khách du lịch</option>
                  <option value="khu_du_lich">Khu du lịch</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
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
                  {filteredUsers.map((item) => (
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

          {tab === 'posts' ? (
            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">Tất cả bài viết</h2>
                <select
                  value={filters.postRole}
                  onChange={(e) => setFilters((prev) => ({ ...prev, postRole: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-600 outline-none"
                >
                  <option value="all">Tất cả tác giả</option>
                  <option value="khach_du_lich">Khách du lịch</option>
                  <option value="khu_du_lich">Khu du lịch</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <table className="w-full min-w-[1040px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-slate-400">
                    <th className="pb-4">Bài viết</th>
                    <th className="pb-4">Tác giả</th>
                    <th className="pb-4">Vai trò</th>
                    <th className="pb-4">Danh mục</th>
                    <th className="pb-4">Tương tác</th>
                    <th className="pb-4">Ngày đăng</th>
                    <th className="pb-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="max-w-[320px] py-4">
                        <p className="font-black text-slate-800">{item.tieu_de || 'Không tiêu đề'}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
                          {item.noi_dung || '--'}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="font-black text-slate-700">{item.author_name}</p>
                        <p className="text-xs text-slate-500">{item.author_email}</p>
                      </td>
                      <td className="py-4 font-bold text-slate-600">{item.author_role}</td>
                      <td className="py-4 font-bold text-slate-600">{item.danh_muc || 'Tổng hợp'}</td>
                      <td className="py-4 font-bold text-slate-600">
                        {Number(item.total_likes || 0)} thích / {Number(item.total_comments || 0)} bình luận
                      </td>
                      <td className="py-4 font-bold text-slate-500">{formatDateTime(item.ngay_tao)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => window.open(`/post/${item.id}`, '_blank')}
                            className="rounded-xl bg-blue-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-blue-700"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handleDeletePost(item)}
                            disabled={Boolean(actionLoading)}
                            className="rounded-xl bg-rose-50 px-4 py-2 text-xs font-black uppercase tracking-widest text-rose-700"
                          >
                            {actionLoading === `post-delete-${item.id}` ? 'Đang xóa...' : 'Xóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'reports' ? (
            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">Báo cáo bài viết</h2>
                <select
                  value={filters.reportStatus}
                  onChange={(e) => setFilters((prev) => ({ ...prev, reportStatus: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-600 outline-none"
                >
                  <option value="all">Tất cả báo cáo</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="reviewed">Đã xử lý</option>
                  <option value="dismissed">Bỏ qua</option>
                </select>
              </div>
              <div className="mb-6 grid gap-4 xl:grid-cols-[1fr_1.1fr]">
                <ReportDonutChart items={reportStatusChart} total={reports.length} />
                <ReportReasonBars items={reportReasonChart} total={filteredReports.length} />
              </div>
              <table className="w-full min-w-[1120px] text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-widest text-slate-400">
                    <th className="pb-4">Bài viết</th>
                    <th className="pb-4">Tác giả</th>
                    <th className="pb-4">Người báo cáo</th>
                    <th className="pb-4">Lý do</th>
                    <th className="pb-4">Trạng thái</th>
                    <th className="pb-4">Ngày báo cáo</th>
                    <th className="pb-4">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReports.map((item) => (
                    <tr key={item.id} className="border-t border-slate-100 align-top">
                      <td className="max-w-[280px] py-4">
                        <p className="font-black text-slate-800">{item.tieu_de || 'Không tiêu đề'}</p>
                        <p className="mt-1 line-clamp-2 text-xs font-medium leading-relaxed text-slate-500">
                          {item.noi_dung || '--'}
                        </p>
                      </td>
                      <td className="py-4">
                        <p className="font-black text-slate-700">{item.author_name}</p>
                        <p className="text-xs text-slate-500">{item.author_email}</p>
                      </td>
                      <td className="py-4">
                        <p className="font-black text-slate-700">{item.reporter_name}</p>
                        <p className="text-xs text-slate-500">{item.reporter_email}</p>
                      </td>
                      <td className="max-w-[240px] py-4 text-xs font-bold leading-relaxed text-slate-600">
                        {item.ly_do}
                      </td>
                      <td className="py-4">
                        <ReportStatusBadge value={item.trang_thai} />
                      </td>
                      <td className="py-4 font-bold text-slate-500">{formatDateTime(item.ngay_tao)}</td>
                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => window.open(`/post/${item.id_bai_viet}`, '_blank')}
                            className="rounded-xl bg-blue-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-blue-700"
                          >
                            Xem
                          </button>
                          <button
                            onClick={() => handleReportStatus(item, 'reviewed')}
                            disabled={Boolean(actionLoading)}
                            className="rounded-xl bg-emerald-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-emerald-700"
                          >
                            Xử lý
                          </button>
                          <button
                            onClick={() => handleReportStatus(item, 'dismissed')}
                            disabled={Boolean(actionLoading)}
                            className="rounded-xl bg-slate-100 px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-600"
                          >
                            Bỏ qua
                          </button>
                          <button
                            onClick={() => handleDeletePost({ id: item.id_bai_viet, tieu_de: item.tieu_de })}
                            disabled={Boolean(actionLoading)}
                            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-black uppercase tracking-widest text-rose-700"
                          >
                            Xóa bài
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}

          {tab === 'businesses' ? (
            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
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
            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">Theo dõi booking</h2>
                <select
                  value={filters.bookingStatus}
                  onChange={(e) => setFilters((prev) => ({ ...prev, bookingStatus: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-600 outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Pending</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
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
                  {filteredBookings.map((item) => (
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
            <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-xl font-black text-slate-900">Theo dõi thanh toán</h2>
                <select
                  value={filters.paymentStatus}
                  onChange={(e) => setFilters((prev) => ({ ...prev, paymentStatus: e.target.value }))}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs font-black uppercase text-slate-600 outline-none"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
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
                  {filteredPayments.map((item) => (
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
              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
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

              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
                <h2 className="mb-5 text-xl font-black text-slate-900">Logo và hỗ trợ</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-3 block text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Tên hệ thống
                    </label>
                    <input
                      value={platformSettings.site_branding?.app_name || ''}
                      onChange={(e) =>
                        setPlatformSettings((prev) => ({
                          ...prev,
                          site_branding: {
                            ...(prev.site_branding || {}),
                            app_name: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                      placeholder="TravelConnect"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-[11px] font-black uppercase tracking-widest text-slate-400">
                      URL logo
                    </label>
                    <input
                      value={platformSettings.site_branding?.logo_url || ''}
                      onChange={(e) =>
                        setPlatformSettings((prev) => ({
                          ...prev,
                          site_branding: {
                            ...(prev.site_branding || {}),
                            logo_url: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                      placeholder="https://example.com/logo.png"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Tiêu đề hỗ trợ
                    </label>
                    <input
                      value={platformSettings.support_content?.title || ''}
                      onChange={(e) =>
                        setPlatformSettings((prev) => ({
                          ...prev,
                          support_content: {
                            ...(prev.support_content || {}),
                            title: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                      placeholder="Can ho tro?"
                    />
                  </div>

                  <div>
                    <label className="mb-3 block text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Nội dung hỗ trợ
                    </label>
                    <input
                      value={platformSettings.support_content?.message || ''}
                      onChange={(e) =>
                        setPlatformSettings((prev) => ({
                          ...prev,
                          support_content: {
                            ...(prev.support_content || {}),
                            message: e.target.value,
                          },
                        }))
                      }
                      className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4 font-bold text-slate-700 outline-none focus:border-slate-400"
                      placeholder="Lien he tong dai TravelConnect 24/7"
                    />
                  </div>
                </div>
                <button
                  onClick={handlePlatformSettingsSave}
                  disabled={Boolean(actionLoading)}
                  className="mt-5 rounded-2xl bg-slate-900 px-5 py-4 text-xs font-black uppercase tracking-widest text-white"
                >
                  {actionLoading === 'platform-settings' ? 'Đang lưu...' : 'Lưu logo và hỗ trợ'}
                </button>
              </div>

              <div className="rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
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

              <div className="overflow-x-auto rounded-[1.75rem] border border-gray-100 bg-white p-4 shadow-sm sm:rounded-[2.5rem] sm:p-6">
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
