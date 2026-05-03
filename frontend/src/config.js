export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export const APP_BASE_URL =
  import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000'

export const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL || import.meta.env.VITE_APP_BASE_URL || 'http://localhost:3000'

export const buildUploadUrl = (filename) => {
  if (!filename) return ''
  if (/^https?:\/\//i.test(filename)) return filename
  return `${APP_BASE_URL}/uploads/${filename}`
}
