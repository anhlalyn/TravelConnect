const resolveEnvValue = (value, fallback) =>
  value === undefined ? fallback : value

export const API_BASE_URL = resolveEnvValue(
  import.meta.env.VITE_API_BASE_URL,
  'http://localhost:3000/api',
)

export const APP_BASE_URL = resolveEnvValue(
  import.meta.env.VITE_APP_BASE_URL,
  'http://localhost:3000',
)

export const SOCKET_URL = resolveEnvValue(
  import.meta.env.VITE_SOCKET_URL,
  resolveEnvValue(import.meta.env.VITE_APP_BASE_URL, 'http://localhost:3000'),
)

export const buildUploadUrl = (filename) => {
  if (!filename) return ''
  if (/^https?:\/\//i.test(filename)) return filename
  return `${APP_BASE_URL}/uploads/${filename}`
}
