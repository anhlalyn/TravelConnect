# Deploy len Vercel

## Tinh hinh hien tai

Frontend `frontend/` co the deploy len Vercel duoc ngay.

Backend `backend/` hien chua phu hop de dua nguyen xi len Vercel vi dang phu thuoc vao:

- `Socket.IO/WebSocket` de nhan tin, goi video, livestream
- upload file vao thu muc local `uploads/`

Vercel Functions la mo hinh serverless, khong phu hop de giu ket noi WebSocket lau dai, va filesystem cua function la read-only, chi co `/tmp` tam thoi.

## Cach deploy frontend

1. Day code len GitHub.
2. Vao Vercel, tao project moi tu repo nay.
3. O muc `Root Directory`, chon `frontend`.
4. Framework Preset: de Vercel tu nhan dien `Vite`.
5. Build Command: `npm run build`
6. Output Directory: `dist`

## Environment variables cho frontend

Dat cac bien sau trong project `frontend` tren Vercel:

```env
VITE_API_BASE_URL=https://your-backend-domain/api
VITE_APP_BASE_URL=https://your-backend-domain
VITE_SOCKET_URL=https://your-realtime-backend-domain
```

Neu backend va socket dung chung mot domain thi `VITE_APP_BASE_URL` va `VITE_SOCKET_URL` co the giong nhau.

## File da them cho frontend

`frontend/vercel.json` da duoc them de:

- ho tro SPA routing khi refresh cac route React Router
- van giu cac file static nhu `assets/*`

## Backend nen dua len dau

De giu nguyen tinh nang hien tai, backend nen deploy tren mot noi co server stateful hon, vi du:

- Railway
- Render
- VPS
- Fly.io

Neu muon dua backend len Vercel sau nay, can doi it nhat 2 phan:

1. thay `Socket.IO` bang nha cung cap realtime phu hop voi serverless
2. thay upload local bang cloud storage nhu Vercel Blob, S3, Cloudinary...
