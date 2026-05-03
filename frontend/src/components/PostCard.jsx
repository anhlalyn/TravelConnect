import React, { useState } from 'react'
import api from '../api'
import {
  Heart,
  MessageCircle,
  Send,
  BadgeCheck,
  ArrowUpRight,
  MapPin,
  Sparkles,
  MoreHorizontal,
  Trash2,
  Edit3,
  Bookmark,
  PlayCircle,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { buildUploadUrl } from '../config'
import { getTrustBadge } from '../utils/trustBadge'

const PostCard = ({ post, onRefresh, currentUser }) => {
  const [showComments, setShowComments] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post?.noi_dung || '')
  const [commentList, setCommentList] = useState([])
  const [text, setText] = useState('')
  const navigate = useNavigate()

  const isOwner = currentUser?.id === post?.id_nguoi_dung
  const displayName = post?.ten_nguoi_dang || post?.ten || 'Nguoi dung'
  const hasLocationTag = post?.id_kdl_gan_the && post?.ten_kdl_gan_the
  const trust = getTrustBadge(post?.diem_tin_cay)
  const mediaList =
    Array.isArray(post?.media_json) && post.media_json.length
      ? post.media_json
      : (post?.hinh_anh_json || []).map((url) => ({ type: 'image', url }))
  const compliance = post?.kiem_duyet_so_json || null

  const handleSave = async () => {
    try {
      const res = await api.post('/posts/save', { id_bai_viet: post.id })
      toast.success(res.data.saved ? 'Da luu vao bo suu tap' : 'Da bo luu')
      if (onRefresh) onRefresh()
    } catch {
      toast.error('Loi khi luu bai viet')
    }
  }

  const handleLike = async () => {
    try {
      const res = await api.post('/posts/like', { id_bai_viet: post.id })
      if (res.data.success && onRefresh) onRefresh()
    } catch {
      toast.error('Loi tuong tac')
    }
  }

  const toggleComments = async () => {
    if (!showComments) {
      try {
        const res = await api.get(`/posts/${post.id}/comments`)
        setCommentList(res.data.data || [])
      } catch (err) {
        console.error('Loi lay binh luan:', err)
      }
    }
    setShowComments(!showComments)
  }

  const handleSendComment = async () => {
    if (!text.trim()) return
    try {
      await api.post('/posts/comment', { id_bai_viet: post.id, noi_dung: text })
      setText('')
      const res = await api.get(`/posts/${post.id}/comments`)
      setCommentList(res.data.data || [])
      if (onRefresh) onRefresh()
      toast.success('Da dang binh luan')
    } catch {
      toast.error('Loi them binh luan')
    }
  }

  const handleDelete = async () => {
    if (!window.confirm('Ban co chac muon xoa bai viet nay?')) return
    try {
      await api.delete(`/posts/${post.id}`)
      toast.success('Da xoa bai viet')
      if (onRefresh) onRefresh()
    } catch {
      toast.error('Loi xoa bai')
    }
  }

  const handleUpdate = async () => {
    try {
      await api.put(`/posts/${post.id}`, { noi_dung: editContent, danh_muc: post?.danh_muc })
      setIsEditing(false)
      if (onRefresh) onRefresh()
      toast.success('Da cap nhat')
    } catch {
      toast.error('Loi cap nhat')
    }
  }

  const handleBooking = () => {
    navigate(`/booking/${post.id_kdl_gan_the}`)
  }

  return (
    <div className="relative mb-6 overflow-hidden rounded-[2.5rem] border border-gray-100 bg-white shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between p-5">
        <div className="flex gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-blue-600 font-black text-white shadow-lg">
            {post?.anh_dai_dien ? (
              <img src={buildUploadUrl(post.anh_dai_dien)} className="h-full w-full object-cover" alt="avatar" />
            ) : (
              displayName.charAt(0)
            )}
          </div>
          <div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1">
                <p className="leading-none font-bold text-slate-800">{displayName}</p>
                {post?.vai_tro === 'khu_du_lich' ? (
                  <BadgeCheck size={16} className="text-blue-500" fill="currentColor" stroke="white" />
                ) : (
                  <Sparkles size={14} className="text-amber-500" />
                )}
              </div>
              <div className={`mt-1.5 flex w-fit items-center gap-1 rounded-lg border px-2 py-0.5 ${trust.className}`}>
                {trust.icon}
                <span className="text-[9px] font-black uppercase tracking-tighter">
                  {post?.diem_tin_cay || 0} pts • {trust.label}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className={`rounded-2xl p-2.5 transition-all ${
              post?.da_luu ? 'bg-amber-50 text-amber-500' : 'text-slate-300 hover:bg-gray-50'
            }`}
          >
            <Bookmark size={20} fill={post?.da_luu ? 'currentColor' : 'none'} />
          </button>
          {isOwner && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="rounded-2xl p-2.5 text-slate-400 transition-all hover:bg-gray-50"
              >
                <MoreHorizontal size={20} />
              </button>
              {showMenu && (
                <div className="absolute right-0 z-50 mt-2 w-44 rounded-[1.5rem] border border-gray-100 bg-white py-2 shadow-xl">
                  <button
                    onClick={() => {
                      setIsEditing(true)
                      setShowMenu(false)
                    }}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-slate-600 hover:bg-slate-50"
                  >
                    <Edit3 size={16} className="text-blue-500" /> Chinh sua
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-bold text-red-500 hover:bg-red-50"
                  >
                    <Trash2 size={16} /> Xoa bai viet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="px-6 pb-3">
        {isEditing ? (
          <div className="space-y-3">
            <textarea
              className="w-full rounded-[1.5rem] border-2 border-blue-100 bg-slate-50 p-5 text-sm font-bold outline-none focus:bg-white"
              rows={3}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={handleUpdate} className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-black text-white shadow-md">
                LUU
              </button>
              <button onClick={() => setIsEditing(false)} className="rounded-xl bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">
                HUY
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[15px] font-medium leading-relaxed text-slate-700">{post?.noi_dung}</p>
        )}
      </div>

      {compliance && !isEditing && (
        <div
          className={`mx-6 mb-4 flex items-center justify-between rounded-2xl border p-3 ${
            compliance.ready ? 'border-emerald-100 bg-emerald-50' : 'border-amber-100 bg-amber-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className={`rounded-xl p-2 ${compliance.ready ? 'bg-white text-emerald-600' : 'bg-white text-amber-600'}`}>
              {compliance.ready ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-tighter text-slate-500">Chuan nen tang so</p>
              <p className={`text-[13px] font-black ${compliance.ready ? 'text-emerald-700' : 'text-amber-700'}`}>
                {compliance.score}/100 • {compliance.summary}
              </p>
            </div>
          </div>
        </div>
      )}

      {hasLocationTag && !isEditing && (
        <div
          className="mx-6 mb-4 flex cursor-pointer items-center justify-between rounded-2xl border border-blue-100 bg-blue-50 p-3"
          onClick={handleBooking}
        >
          <div className="flex items-center gap-2">
            <div className="rounded-xl bg-white p-2 text-blue-600 shadow-sm">
              <MapPin size={16} />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-tighter text-blue-400">Địa điểm gợi ý</p>
              <p className="text-[13px] font-black text-blue-700">{post?.ten_kdl_gan_the}</p>
            </div>
          </div>
          <ArrowUpRight size={18} className="text-blue-300" />
        </div>
      )}

      {mediaList.length > 0 && (
        <div className={`grid gap-2 px-4 pb-4 ${mediaList.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {mediaList.map((media, i) =>
            media.type === 'video' ? (
              <div key={`${media.url}-${i}`} className="relative">
                <video
                  src={buildUploadUrl(media.url)}
                  className="h-64 w-full rounded-[2rem] object-cover shadow-inner bg-black"
                  controls
                  playsInline
                />
                <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase text-white flex items-center gap-1">
                  <PlayCircle size={12} /> Video
                </div>
              </div>
            ) : (
              <img
                key={`${media.url}-${i}`}
                src={buildUploadUrl(media.url)}
                className="h-64 w-full rounded-[2rem] object-cover shadow-inner"
                alt="post"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            ),
          )}
        </div>
      )}

      <div className="mx-4 flex border-t border-gray-50 py-2">
        <button
          onClick={handleLike}
          className={`flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-black ${
            post?.da_thich ? 'bg-red-50 text-red-500' : 'text-slate-500'
          }`}
        >
          <Heart size={20} fill={post?.da_thich ? 'currentColor' : 'none'} /> {post?.tong_luot_thich || 0}
        </button>
        <button
          onClick={toggleComments}
          className={`flex-1 rounded-2xl py-3 flex items-center justify-center gap-2 text-sm font-black ${
            showComments ? 'bg-blue-50 text-blue-600' : 'text-slate-500'
          }`}
        >
          <MessageCircle size={20} /> {post?.tong_binh_luan || 0}
        </button>
      </div>

      {showComments && (
        <div className="space-y-4 border-t border-gray-50 bg-slate-50/50 px-6 py-6">
          <div className="custom-scrollbar max-h-64 space-y-4 overflow-y-auto pr-2">
            {commentList.map((cmt, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-blue-600 text-xs font-bold text-white">
                  {cmt.anh_dai_dien ? (
                    <img src={buildUploadUrl(cmt.anh_dai_dien)} className="h-full w-full object-cover" alt="avatar" />
                  ) : (
                    (cmt.ten || 'U').charAt(0)
                  )}
                </div>
                <div className="flex-1 rounded-[1.5rem] border border-gray-100 bg-white p-3 px-4 shadow-sm">
                  <p className="mb-0.5 text-[11px] font-black uppercase text-blue-600">{cmt.ten || 'Nguoi dung'}</p>
                  <p className="text-sm font-medium leading-snug text-slate-800">{cmt.noi_dung}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 border-t border-gray-100 pt-4">
            <input
              type="text"
              className="flex-1 rounded-2xl border-2 border-transparent bg-white p-3 text-sm font-bold outline-none focus:border-blue-200"
              placeholder="Viet phan hoi..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendComment()}
            />
            <button onClick={handleSendComment} className="p-2 text-blue-600">
              <Send size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PostCard
