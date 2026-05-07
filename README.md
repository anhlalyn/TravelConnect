# TravelConnect

TravelConnect la nen tang du lich ket hop mang xa hoi, ket noi khach du lich, doi tac khu du lich va quan tri vien trong cung mot he thong. Ung dung ho tro kham pha diem den, dang bai viet, dat ve, thanh toan, nhan tin thoi gian thuc va quan ly hoat dong booking.

## Tong quan

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MySQL 8
- Realtime: Socket.IO
- Upload: luu tai `backend/uploads/`
- Moi truong chay: Docker Compose

## Tinh nang chinh

- Dang ky tai khoan va xac thuc OTP qua email
- Dang nhap, quen mat khau, dat lai mat khau
- Dang bai viet voi anh va video
- Thich, binh luan, luu bai viet va danh gia
- Dat ve, thanh toan va check-in bang QR
- Quan ly dich vu, booking va thong ke cho khu du lich
- Nhan tin, ket ban, livestream va goi trong thoi gian thuc
- Dashboard quan tri cho nguoi dung, bai viet, booking va cau hinh he thong

## Cau truc thu muc

```text
ChuyenDe/
|- backend/              API Express, Socket.IO, business logic
|- frontend/             Client React + Vite
|- database/             SQL khoi tao du lieu
|- docs/                 Tai lieu bo sung
|- uploads/              Tep upload ngoai Docker
|- docker-compose.yml    Mot file Compose cho dev va prod
|- .env.example          Mau bien moi truong cho Docker
`- README.md
```

## Chay nhanh bang Docker

### 1. Tao file `.env`

Tai thu muc goc du an:

```powershell
copy .env.example .env
```

Mo file [`.env.example`] vua copy thanh `.env` va dien thong tin that:

```env
EMAIL_USER=yourgmail@gmail.com
EMAIL_PASS=your_16_char_gmail_app_password
```

Luu y:

- `EMAIL_PASS` phai la Gmail App Password, khong phai mat khau Gmail thuong
- neu thay doi app password, can cap nhat lai file `.env`

### 2. Chay profile `dev`

```powershell
docker compose --profile dev up --build
```

Sau khi chay xong:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Uploads: `http://localhost:3000/uploads`
- MySQL: `localhost:3307`

### 3. Neu da tung chay va bi dung container cu

```powershell
docker compose --profile dev down
docker rm -f travelconnect-db travelconnect-backend travelconnect-frontend
docker compose --profile dev up --build
```

## OTP email khi chay Docker

Ban Docker hien tai duoc cau hinh de gui OTP that ra email, khong dung mailbox test noi bo.

Dieu kien de OTP gui duoc:

- file `.env` phai ton tai o thu muc goc
- `EMAIL_USER` va `EMAIL_PASS` phai hop le
- tai khoan Gmail phai bat `2-Step Verification`
- `EMAIL_PASS` phai la `App Password`

Neu OTP khong gui duoc, kiem tra:

```powershell
docker compose --profile dev logs backend --tail 100
```

Loi thuong gap:

- `Missing credentials for "PLAIN"`: chua co `EMAIL_USER` hoac `EMAIL_PASS`
- `Username and Password not accepted`: sai app password hoac app password da bi thu hoi
- `The "EMAIL_USER" variable is not set`: chua tao file `.env` dung cho Docker

## Chay local khong dung Docker

### Backend

```powershell
cd backend
npm install
npm run dev
```

Can cau hinh them file `backend/.env` dua theo [backend/.env.example]

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

Neu can, co the tao file env rieng cho frontend dua theo [frontend/.env.example]
## Docker profiles

### `dev`

- Backend chay target `dev`
- Frontend chay Vite dev server
- MySQL map ra `3307`
- Yeu cau `EMAIL_USER` va `EMAIL_PASS` trong `.env`

### `prod`

```powershell
docker compose --profile prod up --build
```

- Backend chay target `prod`
- Frontend build static va phuc vu bang Nginx
- Frontend map ra `http://localhost`

## Bien moi truong quan trong

### Docker root `.env`

- `EMAIL_USER`: dia chi Gmail gui OTP
- `EMAIL_PASS`: Gmail App Password

### Backend runtime

- `PORT`
- `DB_HOST`
- `DB_USER`
- `DB_PASS`
- `DB_NAME`
- `JWT_SECRET`
- `CLIENT_URL`
- `DEFAULT_ADMIN_EMAIL`
- `DEFAULT_ADMIN_PASSWORD`
- `DEFAULT_ADMIN_NAME`

Trong profile `dev`, phan lon bien backend da duoc gan san trong Compose. Ban thuong chi can them `EMAIL_USER` va `EMAIL_PASS`.

## Tai khoan admin mac dinh

- Email: `admin@travelconnect.vn`
- Mat khau: `Admin@12345`

Backend co co che tu tao tai khoan admin mac dinh neu chua ton tai trong database.

## Cac nhom API chinh

- `/api/auth`: dang ky, dang nhap, OTP, quen mat khau
- `/api/posts`: bai viet, binh luan, like, save, danh gia
- `/api/bookings`: dat ve va xac thuc QR
- `/api/payments`: hoa don, thanh toan, nap tien
- `/api/businesses`: ho so va dich vu khu du lich
- `/api/messages`: phong chat va tin nhan
- `/api/admin`: dashboard va quan tri he thong

## Ghi chu

- File SQL khoi tao nam o [database/travelconnect.sql]
- Uploads duoc mount tu `./backend/uploads`
- File [docker-compose.yml] la nguon cau hinh chay Docker chinh
- File [`.env`] da duoc ignore trong Git de tranh lo thong tin mail

## Tai lieu

- [So do he thong](docs/so-do-he-thong.md)

## Thanh vien thuc hien

- Phan Dinh Luyen - 22050036
- Vu Duy Hoang - 22050038
- Nguyen Hoang Vu - 22050072
