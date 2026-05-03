import React, { useState } from 'react'
import { ChevronLeft, ChevronRight, PlayCircle, X } from 'lucide-react'
import { buildUploadUrl } from '../config'

const renderMedia = (media, className, controls = true) => {
  if (media.type === 'video') {
    return (
      <div className={`relative overflow-hidden bg-black ${className}`}>
        <video src={buildUploadUrl(media.url)} className="h-full w-full object-cover" controls={controls} playsInline />
        <div className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-black uppercase text-white flex items-center gap-1">
          <PlayCircle size={12} /> Video
        </div>
      </div>
    )
  }

  return (
    <img
      src={buildUploadUrl(media.url)}
      className={`h-full w-full object-cover ${className}`}
      alt="post"
      onError={(e) => {
        e.target.style.display = 'none'
      }}
    />
  )
}

const OverlayTile = ({ media, extraCount, className, onClick }) => (
  <button type="button" onClick={onClick} className={`relative overflow-hidden ${className}`}>
    {renderMedia(media, 'rounded-none')}
    <div className="absolute inset-0 flex items-center justify-center bg-slate-900/55 text-white">
      <span className="text-3xl font-black">+{extraCount}</span>
    </div>
  </button>
)

const PostMediaGallery = ({ mediaList = [], roundedClassName = 'rounded-[2rem]' }) => {
  const [activeIndex, setActiveIndex] = useState(null)

  if (!mediaList.length) return null

  const openViewer = (index) => setActiveIndex(index)
  const closeViewer = () => setActiveIndex(null)
  const showPrev = () => setActiveIndex((current) => (current === 0 ? mediaList.length - 1 : current - 1))
  const showNext = () => setActiveIndex((current) => (current === mediaList.length - 1 ? 0 : current + 1))
  const activeMedia = activeIndex === null ? null : mediaList[activeIndex]

  if (mediaList.length === 1) {
    return (
      <>
        <button type="button" onClick={() => openViewer(0)} className={`block w-full overflow-hidden ${roundedClassName}`}>
          {renderMedia(mediaList[0], `h-[28rem] w-full ${roundedClassName}`)}
        </button>
        {activeMedia && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 p-4">
            <button
              type="button"
              onClick={closeViewer}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
            >
              <X size={20} />
            </button>
            <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] bg-black shadow-2xl">
              {activeMedia.type === 'video'
                ? renderMedia(activeMedia, 'max-h-[85vh] w-full', true)
                : (
                    <img
                      src={buildUploadUrl(activeMedia.url)}
                      className="max-h-[85vh] w-full object-contain"
                      alt={`media-${activeIndex + 1}`}
                    />
                  )}
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {mediaList.length === 2 && (
        <div className={`grid grid-cols-2 gap-2 overflow-hidden ${roundedClassName}`}>
          {mediaList.slice(0, 2).map((media, index) => (
            <button
              key={`${media.url}-${index}`}
              type="button"
              onClick={() => openViewer(index)}
              className="aspect-square overflow-hidden bg-slate-100"
            >
              {renderMedia(media, 'rounded-none')}
            </button>
          ))}
        </div>
      )}

      {mediaList.length === 3 && (
        <div className={`grid grid-cols-2 gap-2 overflow-hidden ${roundedClassName}`}>
          <button type="button" onClick={() => openViewer(0)} className="row-span-2 h-[28rem] overflow-hidden bg-slate-100">
            {renderMedia(mediaList[0], 'rounded-none')}
          </button>
          {mediaList.slice(1, 3).map((media, index) => (
            <button
              key={`${media.url}-${index + 1}`}
              type="button"
              onClick={() => openViewer(index + 1)}
              className="h-[13.9rem] overflow-hidden bg-slate-100"
            >
              {renderMedia(media, 'rounded-none')}
            </button>
          ))}
        </div>
      )}

      {mediaList.length >= 4 && (
        <div className={`grid grid-cols-2 gap-2 overflow-hidden ${roundedClassName}`}>
          {mediaList.slice(0, 4).map((media, index) => {
            const extraCount = mediaList.length - 4

            if (index === 3 && extraCount > 0) {
              return (
                <OverlayTile
                  key={`${media.url}-${index}`}
                  media={media}
                  extraCount={extraCount}
                  className="aspect-square bg-slate-100"
                  onClick={() => openViewer(index)}
                />
              )
            }

            return (
              <button
                key={`${media.url}-${index}`}
                type="button"
                onClick={() => openViewer(index)}
                className="aspect-square overflow-hidden bg-slate-100"
              >
                {renderMedia(media, 'rounded-none')}
              </button>
            )
          })}
        </div>
      )}

      {activeMedia && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/92 p-4">
          {mediaList.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <button
            type="button"
            onClick={closeViewer}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-3 text-white transition-all hover:bg-white/20"
          >
            <X size={20} />
          </button>

          <div className="w-full max-w-6xl overflow-hidden rounded-[2rem] bg-black shadow-2xl">
            {activeMedia.type === 'video'
              ? renderMedia(activeMedia, 'max-h-[85vh] w-full', true)
              : (
                  <img
                    src={buildUploadUrl(activeMedia.url)}
                    className="max-h-[85vh] w-full object-contain"
                    alt={`media-${activeIndex + 1}`}
                  />
                )}
          </div>

          <div className="absolute bottom-5 rounded-full bg-black/55 px-4 py-2 text-xs font-black text-white">
            {activeIndex + 1} / {mediaList.length}
          </div>
        </div>
      )}
    </>
  )
}

export default PostMediaGallery
