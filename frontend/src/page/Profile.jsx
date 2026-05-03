import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  BadgeCheck,
  Calendar,
  Camera,
  Edit3,
  LocateFixed,
  MapPin,
  MessageSquare,
  Navigation,
  Save,
  User,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../api'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'
import PostCard from '../components/PostCard'
import { TRAVEL_INTEREST_OPTIONS } from '../constants/explore'
import { buildUploadUrl } from '../config'
import { getTrustBadge } from '../utils/trustBadge'

const Profile = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [currentUser, setCurrentUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editedData, setEditedData] = useState({})
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true)
      const [res, userRes] = await Promise.all([
        api.get(`/users/profile/${id}`),
        api.get('/auth/profile'),
      ])

      const profileData = res.data.data
      setProfile(profileData)
      setPosts(res.data.posts || [])
      setCurrentUser(userRes.data.data)
      setEditedData({
        ten: profileData.ten || '',
        ten_khu_du_lich: profileData.ten_khu_du_lich || '',
        tinh_thanh: profileData.tinh_thanh || '',
        mo_ta_tong_quan: profileData.mo_ta_tong_quan || '',
        dia_chi_chi_tiet: profileData.dia_chi_chi_tiet || '',
        vi_do: profileData.vi_do ?? '',
        kinh_do: profileData.kinh_do ?? '',
        so_thich_json: Array.isArray(profileData.so_thich_json) ? profileData.so_thich_json : [],
      })
    } catch {
      toast.error('Không thể tải thông tin hồ sơ')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setEditedData((prev) => ({ ...prev, [name]: value }))
  }

  const toggleInterest = (interest) => {
    setEditedData((prev) => {
      const selected = Array.isArray(prev.so_thich_json) ? prev.so_thich_json : []
      const exists = selected.includes(interest)

      return {
        ...prev,
        so_thich_json: exists ? selected.filter((item) => item !== interest) : [...selected, interest],
      }
    })
  }

  const handleFileChange = (e, type) => {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'avatar') {
        setAvatarPreview(reader.result)
        setEditedData((prev) => ({ ...prev, anh_dai_dien: file }))
      } else {
        setCoverPreview(reader.result)
        setEditedData((prev) => ({ ...prev, hinh_anh_bia: file }))
      }
    }
    reader.readAsDataURL(file)
  }

  const saveProfile = async () => {
    try {
      const formData = new FormData()
      formData.append('ten', editedData.ten || '')
      formData.append('ten_khu_du_lich', editedData.ten_khu_du_lich || '')
      formData.append('tinh_thanh', editedData.tinh_thanh || '')
      formData.append('mo_ta_tong_quan', editedData.mo_ta_tong_quan || '')
      formData.append('dia_chi_chi_tiet', editedData.dia_chi_chi_tiet || '')
      formData.append('vi_do', editedData.vi_do ?? '')
      formData.append('kinh_do', editedData.kinh_do ?? '')
      formData.append('so_thich_json', JSON.stringify(editedData.so_thich_json || []))

      if (editedData.anh_dai_dien instanceof File) {
        formData.append('anh_dai_dien', editedData.anh_dai_dien)
      }
      if (editedData.hinh_anh_bia instanceof File) {
        formData.append('hinh_anh_bia', editedData.hinh_anh_bia)
      }

      const res = await api.put('/users/profile/update', formData)
      if (res.data.success) {
        toast.success('Cập nhật thành công!')
        setIsEditing(false)
        setAvatarPreview(null)
        setCoverPreview(null)
        fetchProfile()
      }
    } catch {
      toast.error('Lỗi khi lưu hồ sơ')
    }
  }

  const cancelEditing = () => {
    setIsEditing(false)
    setAvatarPreview(null)
    setCoverPreview(null)
    setEditedData({
      ten: profile?.ten || '',
      ten_khu_du_lich: profile?.ten_khu_du_lich || '',
      tinh_thanh: profile?.tinh_thanh || '',
      mo_ta_tong_quan: profile?.mo_ta_tong_quan || '',
      dia_chi_chi_tiet: profile?.dia_chi_chi_tiet || '',
      vi_do: profile?.vi_do ?? '',
      kinh_do: profile?.kinh_do ?? '',
      so_thich_json: Array.isArray(profile?.so_thich_json) ? profile.so_thich_json : [],
    })
  }

  const coordinates = useMemo(() => {
    const lat = Number(profile?.vi_do)
    const lng = Number(profile?.kinh_do)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  }, [profile?.kinh_do, profile?.vi_do])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center font-bold text-blue-600">
        Đang tải hồ sơ...
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        Người dùng không tồn tại
      </div>
    )
  }

  const isKDL = profile.vai_tro === 'khu_du_lich'
  const isTourist = profile.vai_tro === 'khach_du_lich'
  const isMe = Number(currentUser?.id) === Number(id)
  const timestamp = new Date().getTime()
  const mapUrl = coordinates ? `https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}` : null
  const trustBadge = getTrustBadge(profile?.diem_tin_cay)

  return (
    <div className="min-h-screen bg-[#F3F4F6]">
      <Navbar user={currentUser} />

      <div className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-4 pt-6 pb-12">
        <div className="col-span-3 hidden lg:block">
          <Sidebar user={currentUser} />
        </div>

        <div className="col-span-12 space-y-6 lg:col-span-9">
          <div className="overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm">
            <div
              className={`relative h-48 group md:h-64 ${
                coverPreview || profile.hinh_anh_bia ? '' : isKDL ? 'bg-indigo-600' : 'bg-blue-600'
              }`}
            >
              {coverPreview ? (
                <img src={coverPreview} className="h-full w-full object-cover" alt="Cover Preview" />
              ) : profile.hinh_anh_bia ? (
                <img
                  src={`${buildUploadUrl(profile.hinh_anh_bia)}?t=${timestamp}`}
                  className="h-full w-full object-cover"
                  alt="Cover"
                />
              ) : null}

              {isEditing && (
                <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={32} className="text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(e, 'cover')}
                  />
                </label>
              )}
            </div>

            <div className="relative px-8 pb-8">
              <div className="relative z-10 mb-6 -mt-16 flex items-end justify-between">
                <div className="group relative h-32 w-32 overflow-hidden rounded-[2.5rem] bg-white p-1.5 shadow-xl md:h-40 md:w-40">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      className="h-full w-full rounded-[2.2rem] object-cover"
                      alt="Avatar Preview"
                    />
                  ) : profile.anh_dai_dien ? (
                    <img
                      src={`${buildUploadUrl(profile.anh_dai_dien)}?t=${timestamp}`}
                      className="h-full w-full rounded-[2.2rem] object-cover"
                      alt="Avatar"
                    />
                  ) : (
                    <div
                      className={`flex h-full w-full items-center justify-center rounded-[2.2rem] text-5xl font-black uppercase text-white ${
                        isKDL ? 'bg-indigo-700' : 'bg-blue-600'
                      }`}
                    >
                      {profile.ten?.charAt(0)}
                    </div>
                  )}

                  {isEditing && (
                    <label className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                      <Camera size={28} className="text-white" />
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e, 'avatar')}
                      />
                    </label>
                  )}
                </div>

                <div className="mb-2 flex gap-2">
                  {isMe ? (
                    !isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 rounded-2xl bg-gray-100 px-6 py-3 font-bold text-gray-700 transition-all hover:bg-gray-200"
                      >
                        <Edit3 size={18} /> Chỉnh sửa hồ sơ
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={cancelEditing}
                          className="rounded-2xl bg-red-50 px-6 py-3 font-bold text-red-600 transition-all hover:bg-red-100"
                        >
                          Hủy
                        </button>
                        <button
                          onClick={saveProfile}
                          className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg shadow-blue-100 transition-all hover:bg-blue-700"
                        >
                          <Save size={18} /> Lưu thay đổi
                        </button>
                      </>
                    )
                  ) : (
                    <button
                      onClick={() => navigate('/messages')}
                      className="flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3 font-bold text-white shadow-lg transition-all hover:bg-blue-700"
                    >
                      <MessageSquare size={18} /> Nhắn tin
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                {!isEditing ? (
                  <div className="flex items-center gap-2">
                    <h1 className="text-3xl font-black text-slate-800">
                      {isKDL ? profile.ten_khu_du_lich || profile.ten : profile.ten}
                    </h1>
                    {isKDL && (
                      <BadgeCheck
                        className="animate-in zoom-in text-blue-500 duration-500"
                        size={28}
                        fill="currentColor"
                        stroke="white"
                      />
                    )}
                  </div>
                ) : (
                  <div className="max-w-md space-y-2">
                    <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      Tên hiển thị
                    </label>
                    <input
                      type="text"
                      name={isKDL ? 'ten_khu_du_lich' : 'ten'}
                      value={isKDL ? editedData.ten_khu_du_lich : editedData.ten}
                      onChange={handleInputChange}
                      className="w-full rounded-2xl border-2 border-gray-100 p-3 text-xl font-bold outline-none transition-all focus:border-blue-500"
                    />
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <div
                    className={`inline-flex items-center rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-widest ${
                      isKDL ? 'bg-indigo-50 text-indigo-600' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {isKDL ? 'Đối tác Khu du lịch' : 'Khách du lịch'}
                  </div>

                  {isTourist && (
                    <div className={`inline-flex items-center gap-1 rounded-full border px-4 py-2 text-[11px] font-black uppercase tracking-wide ${trustBadge.className}`}>
                      {trustBadge.icon}
                      <span>Danh hiệu: {trustBadge.label}</span>
                      <span className="opacity-70">• {profile?.diem_tin_cay || 0} điểm tin cậy</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-6 pt-2 text-sm font-bold text-slate-500">
                  <div className="flex items-center gap-2">
                    <MapPin size={18} className="text-red-500" />
                    {!isEditing ? (
                      <span>{profile.tinh_thanh || 'Chưa cập nhật địa điểm'}</span>
                    ) : (
                      <input
                        type="text"
                        name="tinh_thanh"
                        value={editedData.tinh_thanh}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: Lâm Đồng"
                        className="border-b-2 border-gray-100 p-2 outline-none focus:border-blue-500"
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-blue-500" />
                    Thành viên từ {new Date(profile.ngay_tao).toLocaleDateString('vi-VN')}
                  </div>
                </div>

                {isKDL && (
                  <div className="space-y-4 rounded-[2rem] border border-slate-100 bg-slate-50 p-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Vị trí khu du lịch
                    </p>

                    {!isEditing ? (
                      <div className="space-y-3">
                        <div className="flex items-start gap-3 text-sm text-slate-600">
                          <MapPin size={18} className="mt-0.5 shrink-0 text-red-500" />
                          <span>{profile.dia_chi_chi_tiet || 'Chưa cập nhật địa chỉ chi tiết'}</span>
                        </div>

                        <div className="flex flex-wrap gap-4 text-sm font-bold text-slate-500">
                          <div className="inline-flex items-center gap-2">
                            <LocateFixed size={16} className="text-blue-500" />
                            Vĩ độ: {profile.vi_do ?? 'Chưa có'}
                          </div>
                          <div className="inline-flex items-center gap-2">
                            <Navigation size={16} className="text-indigo-500" />
                            Kinh độ: {profile.kinh_do ?? 'Chưa có'}
                          </div>
                        </div>

                        {mapUrl && (
                          <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-slate-900"
                          >
                            <MapPin size={14} />
                            Mở trên bản đồ
                          </a>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                            Địa chỉ chi tiết
                          </label>
                          <textarea
                            name="dia_chi_chi_tiet"
                            value={editedData.dia_chi_chi_tiet}
                            onChange={handleInputChange}
                            rows={3}
                            className="w-full rounded-[1.5rem] border-2 border-gray-100 p-4 text-[15px] leading-relaxed outline-none focus:border-blue-500"
                            placeholder="Ví dụ: Số 19 Hoa Hồng, Hồ Tuyền Lâm, Phường 4, Đà Lạt"
                          />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Vĩ độ
                            </label>
                            <input
                              type="number"
                              step="any"
                              name="vi_do"
                              value={editedData.vi_do}
                              onChange={handleInputChange}
                              className="w-full rounded-2xl border-2 border-gray-100 p-4 outline-none transition-all focus:border-blue-500"
                              placeholder="Ví dụ: 11.8954"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                              Kinh độ
                            </label>
                            <input
                              type="number"
                              step="any"
                              name="kinh_do"
                              value={editedData.kinh_do}
                              onChange={handleInputChange}
                              className="w-full rounded-2xl border-2 border-gray-100 p-4 outline-none transition-all focus:border-blue-500"
                              placeholder="Ví dụ: 108.431"
                            />
                          </div>
                        </div>

                        <p className="text-xs font-medium text-slate-400">
                          Nhập đúng vĩ độ và kinh độ để khu du lịch có thể hiển thị chính xác trên map.
                        </p>
                      </div>
                    )}
                  </div>
                )}

                <div className="mt-6 max-w-3xl">
                  {!isEditing ? (
                    profile.mo_ta_tong_quan && (
                      <p className="rounded-[2rem] border border-slate-100 bg-slate-50 p-6 text-[15px] italic leading-relaxed text-slate-600">
                        "{profile.mo_ta_tong_quan}"
                      </p>
                    )
                  ) : (
                    <div className="space-y-2">
                      <label className="ml-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                        Giới thiệu bản thân
                      </label>
                      <textarea
                        name="mo_ta_tong_quan"
                        value={editedData.mo_ta_tong_quan}
                        onChange={handleInputChange}
                        rows={4}
                        className="w-full rounded-[1.5rem] border-2 border-gray-100 p-4 text-[15px] leading-relaxed outline-none focus:border-blue-500"
                        placeholder="Viết gì đó về bạn..."
                      />
                    </div>
                  )}
                </div>

                {!isKDL && (
                  <div className="space-y-3 rounded-[2rem] border border-slate-100 bg-slate-50 p-6">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-500">
                      Mục quan tâm
                    </p>

                    {!isEditing ? (
                      <div className="flex flex-wrap gap-2">
                        {profile.so_thich_json?.length ? (
                          profile.so_thich_json.map((interest) => (
                            <span
                              key={interest}
                              className="rounded-full bg-blue-50 px-3 py-2 text-xs font-black text-blue-700"
                            >
                              {interest}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm font-medium text-slate-400">
                            Chưa chọn sở thích nào
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-3">
                        {TRAVEL_INTEREST_OPTIONS.map((interest) => {
                          const active = editedData.so_thich_json?.includes(interest)
                          return (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => toggleInterest(interest)}
                              className={`rounded-full border px-4 py-2.5 text-xs font-black transition-all ${
                                active
                                  ? 'border-blue-600 bg-blue-600 text-white'
                                  : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200'
                              }`}
                            >
                              {interest}
                            </button>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <h2 className="flex items-center gap-2 px-2 text-xl font-black uppercase tracking-tight text-slate-800">
              <User size={20} className="text-blue-600" /> Bài viết đã đăng
            </h2>

            {posts.length > 0 ? (
              posts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={currentUser}
                  onRefresh={fetchProfile}
                />
              ))
            ) : (
              <div className="rounded-[2.5rem] border-2 border-dashed border-gray-200 bg-white py-24 text-center font-bold text-gray-400">
                Tài khoản này chưa chia sẻ bài viết nào.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
