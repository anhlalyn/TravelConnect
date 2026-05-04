# TravelConnect Frontend

## Danh gia nhanh

Website cua ban da co tinh chat chuyen doi so kha ro, vi no da so hoa nhieu quy trinh thuong lam thu cong:

- Dang ky, dang nhap va xac thuc nguoi dung
- Dat ve tham quan theo ngay va so luong
- Tao hoa don, nap tien vao vi va thanh toan online
- Quan ly thong bao, booking va ket qua thanh toan

No khong chi la trang gioi thieu thong tin, ma da la mot he thong giao dich va van hanh so cho du lich.

## Tai khoan admin mac dinh

- Email: `admin@travelconnect.vn`
- Mat khau: `Admin@12345`

## tài khoản người du lịch
anhlalyn14.03@gmail.com
140320
## tài khoản khu du lịch
dinhluyenvipro@gmail.com
123456

## Chay bang Docker

Tai thu muc goc du an, chay:

```bash
copy .env.example .env
docker compose --profile dev up --build
```

Sau khi chay:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- MySQL: `localhost:3307`

## Ghi chu

- File `docker-compose.yml` la file Compose duy nhat, co profile `dev` va `prod`, va dung MySQL 8.
- O profile `dev`, hay copy `.env.example` thanh `.env` va dien `EMAIL_USER`, `EMAIL_PASS` truoc khi chay Docker.
