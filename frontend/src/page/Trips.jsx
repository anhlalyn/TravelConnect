import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Calendar, Navigation, Plus, Sparkles, Trash2, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../api'
import Navbar from '../components/Navbar'
import Sidebar from '../components/Sidebar'

const defaultCenter = [11.9404, 108.4583]

const tripStopIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowUrl:
    'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

const suggestionIcon = L.divIcon({
  className: 'trip-suggestion-marker',
  html: `
    <div style="
      width: 18px;
      height: 18px;
      border-radius: 999px;
      background: #0f172a;
      border: 4px solid #93c5fd;
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.18);
    "></div>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
})

const RecenterMap = ({ points }) => {
  const map = useMap()

  useEffect(() => {
    if (!points.length) {
      map.setView(defaultCenter, 12)
      return
    }

    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }

    map.fitBounds(points, { padding: [48, 48] })
  }, [map, points])

  return null
}

const getCoordinates = (item) => {
  const lat = Number(item?.vi_do)
  const lng = Number(item?.kinh_do)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null

  return [lat, lng]
}

const Trips = ({ user: initialUser }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState(initialUser)
  const [trips, setTrips] = useState([])
  const [selectedTripId, setSelectedTripId] = useState(null)
  const [details, setDetails] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [creating, setCreating] = useState(false)
  const [selectedLinkedPlaceIds, setSelectedLinkedPlaceIds] = useState([])
  const [formData, setFormData] = useState({
    ten_chuyen_di: '',
    ngay_bat_dau: '',
    ngay_ket_thuc: '',
  })

  const fetchUserProfile = useCallback(async () => {
    try {
      const res = await api.get('/auth/profile')
      setUser(res.data.data || res.data)
    } catch (err) {
      if (err.response?.status === 401) navigate('/login')
    }
  }, [navigate])

  const fetchTrips = useCallback(async () => {
    const res = await api.get('/trips')
    const incomingTrips = res.data.data || []
    setTrips(incomingTrips)
    return incomingTrips
  }, [])

  const fetchSuggestions = useCallback(async () => {
    const res = await api.get('/trips/trending')
    setSuggestions(res.data.data || [])
  }, [])

  const fetchDetails = useCallback(async (id) => {
    setSelectedTripId(id)

    try {
      const res = await api.get(`/trips/${id}`)
      const detailData = res.data.data || []
      setDetails(detailData)

      if (detailData.length === 0) {
        toast('Hành trình này hiện chưa có điểm dừng nào.', { icon: '📍' })
      }
    } catch (err) {
      console.error('Lỗi lấy chi tiết hành trình:', err)
      toast.error('Không thể tải thông tin chi tiết.')
    }
  }, [])

  useEffect(() => {
    const initData = async () => {
      setLoading(true)

      try {
        const [loadedTrips] = await Promise.all([
          fetchTrips(),
          fetchSuggestions(),
          fetchUserProfile(),
        ])

        if (loadedTrips?.length) {
          await fetchDetails(loadedTrips[0].id)
        }
      } catch (err) {
        console.error('Lỗi tải trang lịch trình:', err)
        toast.error('Không thể tải dữ liệu lịch trình')
      } finally {
        setLoading(false)
      }
    }

    initData()
  }, [fetchDetails, fetchSuggestions, fetchTrips, fetchUserProfile])

  const selectedTrip = useMemo(
    () => trips.find((trip) => trip.id === selectedTripId) || null,
    [selectedTripId, trips],
  )

  const tripMarkers = useMemo(
    () =>
      details
        .map((detail) => {
          const position = getCoordinates(detail)
          if (!position) return null

          return {
            id: detail.id,
            position,
            hoat_dong: detail.hoat_dong,
            ten_kdl: detail.ten_kdl,
            thoi_gian: detail.thoi_gian,
            dia_chi: detail.dia_chi_chi_tiet,
            linkedPlaceId: detail.id_khu_du_lich_lien_ket,
          }
        })
        .filter(Boolean),
    [details],
  )

  const suggestionMarkers = useMemo(() => {
    const linkedPlaceIds = new Set(
      details.map((detail) => detail.id_khu_du_lich_lien_ket).filter(Boolean),
    )

    return suggestions
      .map((place) => {
        const position = getCoordinates(place)
        if (!position || linkedPlaceIds.has(place.id)) return null

        return {
          id: place.id,
          position,
          ten_kdl: place.ten_kdl,
          tinh_thanh: place.tinh_thanh,
          dia_chi: place.dia_chi_chi_tiet,
        }
      })
      .filter(Boolean)
  }, [details, suggestions])

  const polylinePoints = useMemo(
    () => tripMarkers.map((marker) => marker.position),
    [tripMarkers],
  )

  const mapPoints = useMemo(
    () => [...polylinePoints, ...suggestionMarkers.map((marker) => marker.position)],
    [polylinePoints, suggestionMarkers],
  )

  const toggleLinkedPlace = (placeId) => {
    setSelectedLinkedPlaceIds((prev) =>
      prev.includes(placeId) ? prev.filter((id) => id !== placeId) : [...prev, placeId],
    )
  }

  const resetCreateForm = () => {
    setFormData({
      ten_chuyen_di: '',
      ngay_bat_dau: '',
      ngay_ket_thuc: '',
    })
    setSelectedLinkedPlaceIds([])
  }

  const handleCreateTrip = async (e) => {
    e.preventDefault()

    if (!formData.ten_chuyen_di.trim() || !formData.ngay_bat_dau) {
      toast.error('Vui lòng nhập tên và ngày bắt đầu')
      return
    }

    try {
      setCreating(true)
      const res = await api.post('/trips', {
        ...formData,
        linked_place_ids: selectedLinkedPlaceIds,
      })

      toast.success('Đã tạo hành trình')
      setShowModal(false)
      resetCreateForm()
      await fetchTrips()

      if (res.data?.id) {
        await fetchDetails(res.data.id)
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Không thể tạo hành trình')
    } finally {
      setCreating(false)
    }
  }

  const handleAddQuickPoint = async (place) => {
    if (!selectedTripId) {
      toast.error('Hãy chọn một hành trình trước')
      return
    }

    try {
      await api.post('/trips/activity', {
        id_chuyen_di: selectedTripId,
        hoat_dong: `Ghé thăm ${place.ten_kdl}`,
        id_khu_du_lich_lien_ket: place.id,
      })

      toast.success('Đã thêm vào lịch trình')
      await fetchDetails(selectedTripId)
    } catch {
      toast.error('Lỗi khi thêm điểm')
    }
  }

  const handleDeleteActivity = async (activityId) => {
    if (!window.confirm('Xóa điểm dừng này?')) return

    try {
      await api.delete(`/trips/activity/${activityId}`)
      await fetchDetails(selectedTripId)
      toast.success('Đã xóa điểm dừng')
    } catch {
      toast.error('Lỗi khi xóa')
    }
  }

  const handleDeleteTrip = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Xóa toàn bộ chuyến đi này?')) return

    try {
      await api.delete(`/trips/${id}`)
      toast.success('Đã xóa hành trình')

      const updatedTrips = await fetchTrips()

      if (!updatedTrips.length) {
        setSelectedTripId(null)
        setDetails([])
        return
      }

      const nextTripId = selectedTripId === id ? updatedTrips[0].id : selectedTripId
      await fetchDetails(nextTripId)
    } catch {
      toast.error('Không thể xóa hành trình')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F3F4F6]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-blue-600 mx-auto" />
          <p className="mt-4 text-sm font-black uppercase tracking-[0.2em] text-slate-600">
            Đang tải lịch trình...
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

        <div className="col-span-12 lg:col-span-9 grid grid-cols-12 gap-6">
          <div className="col-span-12 xl:col-span-5 space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100">
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <h1 className="text-3xl font-black text-slate-900 mb-2">Lịch trình</h1>
                  <p className="text-sm text-slate-500">
                    Bản đồ hiển thị điểm dừng trong hành trình và các khu du lịch gợi ý có sẵn tọa độ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowModal(true)}
                  className="p-3 bg-blue-600 text-white rounded-2xl shadow-sm hover:bg-slate-900 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>

              <div className="space-y-3">
                {trips.length > 0 ? (
                  trips.map((trip) => (
                    <div
                      key={trip.id}
                      onClick={() => fetchDetails(trip.id)}
                      className={`p-4 rounded-[1.7rem] border cursor-pointer transition-all flex items-start justify-between gap-3 ${
                        selectedTripId === trip.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-transparent bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-slate-800">{trip.ten_chuyen_di}</p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                          {new Date(trip.ngay_bat_dau).toLocaleDateString()}
                        </p>
                        <p className="text-[10px] uppercase font-black tracking-widest text-blue-500 mt-2">
                          {trip.linked_place_count || 0} khu liên kết • {trip.total_stops || 0} điểm dừng
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDeleteTrip(e, trip.id)}
                        className="text-slate-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="rounded-[2rem] border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                    <p className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">
                      Chưa có hành trình nào
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm p-8 border border-gray-100">
              <h2 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                <Sparkles size={14} className="text-amber-500" />
                Gợi ý cho bạn
              </h2>

              <div className="space-y-3">
                {suggestions.map((place) => (
                  <div
                    key={place.id}
                    className="flex items-center justify-between gap-3 p-4 bg-slate-50 rounded-[1.7rem]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black text-xs shrink-0">
                        {place.ten_kdl?.charAt(0)}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{place.ten_kdl}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                          {place.tinh_thanh || 'Địa điểm du lịch'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddQuickPoint(place)}
                      className="p-2 bg-white text-blue-600 rounded-xl shadow-sm hover:bg-blue-600 hover:text-white transition-all"
                    >
                      <Plus size={15} />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {selectedTripId && (
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-2">
                      Lịch trình chi tiết
                    </p>
                    <h2 className="text-xl font-black">
                      {selectedTrip?.ten_chuyen_di || 'Hành trình đã chọn'}
                    </h2>
                  </div>

                  <div className="inline-flex items-center gap-2 text-[10px] uppercase font-black tracking-widest text-white/50">
                    <Calendar size={12} />
                    {details.length} điểm dừng
                  </div>
                </div>

                {details.length > 0 ? (
                  <div className="space-y-6 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
                    {details.map((detail, index) => (
                      <div key={detail.id} className="flex gap-4 relative z-10 group">
                        <div className="w-6 h-6 rounded-full bg-blue-600 border-4 border-slate-900 flex items-center justify-center text-[10px] font-black">
                          {index + 1}
                        </div>

                        <div className="flex-1 flex justify-between items-start gap-3">
                          <div>
                            <p className="font-bold text-sm leading-tight">{detail.hoat_dong}</p>
                            <p className="text-[10px] opacity-50 uppercase font-black mt-1 tracking-widest">
                              {detail.thoi_gian} • {detail.ten_kdl || 'Tự do'}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteActivity(detail.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 transition-all"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[2rem] bg-white/5 border border-white/10 p-6 text-sm text-white/60">
                    Chưa có điểm dừng nào trong hành trình này.
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="col-span-12 xl:col-span-7 xl:sticky xl:top-24 h-[520px] xl:h-[720px]">
            <div className="bg-white rounded-[3rem] p-3 h-full shadow-sm border border-gray-100 overflow-hidden">
              <div className="flex items-center justify-between px-4 pt-3 pb-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Bản đồ khu du lịch
                  </p>
                  <h2 className="text-lg font-black text-slate-800 mt-1">
                    {selectedTrip ? selectedTrip.ten_chuyen_di : 'Khám phá trên bản đồ'}
                  </h2>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
                  <Navigation size={12} className="text-blue-600" />
                  {tripMarkers.length} điểm hành trình / {suggestionMarkers.length} gợi ý
                </div>
              </div>

              <MapContainer
                center={defaultCenter}
                zoom={13}
                style={{ height: 'calc(100% - 60px)', width: '100%', borderRadius: '2.5rem' }}
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <RecenterMap points={mapPoints} />

                {suggestionMarkers.map((marker) => (
                  <Marker key={`suggestion-${marker.id}`} position={marker.position} icon={suggestionIcon}>
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-black text-slate-900">{marker.ten_kdl}</p>
                        <p className="text-xs text-slate-500">{marker.tinh_thanh || 'Khu du lịch'}</p>
                        {marker.dia_chi && <p className="text-xs text-slate-400">{marker.dia_chi}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {tripMarkers.map((marker) => (
                  <Marker key={`trip-${marker.id}`} position={marker.position} icon={tripStopIcon}>
                    <Popup>
                      <div className="space-y-1">
                        <p className="font-black text-blue-600">{marker.hoat_dong}</p>
                        <p className="text-xs text-slate-600">{marker.ten_kdl || 'Điểm dừng tự do'}</p>
                        {marker.dia_chi && <p className="text-xs text-slate-400">{marker.dia_chi}</p>}
                      </div>
                    </Popup>
                  </Marker>
                ))}

                {polylinePoints.length > 1 && (
                  <Polyline
                    positions={polylinePoints}
                    color="#2563eb"
                    weight={4}
                    opacity={0.65}
                    dashArray="10, 15"
                  />
                )}
              </MapContainer>
            </div>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => !creating && setShowModal(false)}
            aria-hidden="true"
          />

          <form
            onSubmit={handleCreateTrip}
            className="relative z-10 w-full max-w-2xl bg-white rounded-[2.5rem] border border-white shadow-2xl p-8 space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">
                  Tạo hành trình
                </p>
                <h2 className="text-2xl font-black text-slate-900">Chuyến đi mới</h2>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowModal(false)
                  resetCreateForm()
                }}
                className="p-2 rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-900 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <input
                value={formData.ten_chuyen_di}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, ten_chuyen_di: e.target.value }))
                }
                className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
                placeholder="Tên chuyến đi"
              />

              <div className="grid md:grid-cols-2 gap-4">
                <input
                  type="date"
                  value={formData.ngay_bat_dau}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ngay_bat_dau: e.target.value }))
                  }
                  className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
                />

                <input
                  type="date"
                  value={formData.ngay_ket_thuc}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, ngay_ket_thuc: e.target.value }))
                  }
                  className="w-full rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 font-bold text-slate-700 outline-none focus:border-blue-300"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Khu du lịch liên kết
                  </p>
                  <span className="text-[10px] font-black uppercase tracking-widest text-blue-600">
                    {selectedLinkedPlaceIds.length} đã chọn
                  </span>
                </div>

                {suggestions.length ? (
                  <div className="grid gap-3 max-h-64 overflow-y-auto pr-1">
                    {suggestions.map((place) => {
                      const isSelected = selectedLinkedPlaceIds.includes(place.id)

                      return (
                        <button
                          key={place.id}
                          type="button"
                          onClick={() => toggleLinkedPlace(place.id)}
                          className={`w-full rounded-[1.6rem] border px-4 py-4 text-left transition-all ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-bold text-slate-800">{place.ten_kdl}</p>
                              <p className="text-[10px] uppercase font-black tracking-widest text-slate-400 mt-2">
                                {place.tinh_thanh || 'Khu du lịch'}
                              </p>
                            </div>
                            <span
                              className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                                isSelected ? 'bg-blue-600 text-white' : 'bg-white text-slate-400'
                              }`}
                            >
                              {isSelected ? 'Đã chọn' : 'Chọn'}
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                ) : (
                  <div className="rounded-[1.6rem] bg-slate-50 border border-dashed border-slate-200 px-4 py-5 text-sm text-slate-400">
                    Chưa có gợi ý khu du lịch liên kết khả dụng.
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={creating}
              className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black uppercase text-xs tracking-[0.2em] hover:bg-slate-900 transition-colors"
            >
              {creating ? 'Đang tạo...' : 'Tạo hành trình'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default Trips
