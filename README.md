# TravelConnect

TravelConnect là nền tảng du lịch kết hợp mạng xã hội, giúp kết nối khách du lịch, đối tác khu du lịch và quản trị viên trong cùng một hệ thống. Người dùng có thể khám phá điểm đến, đăng bài chia sẻ, đặt vé, thanh toán bằng ví nội bộ, quản lý dịch vụ, nhắn tin thời gian thực và theo dõi hoạt động booking.

## Điểm nổi bật

- Xác thực tài khoản bằng OTP qua email
- Hỗ trợ 2 vai trò chính: khách du lịch và đối tác khu du lịch
- Trang khám phá dành cho bài viết của khu du lịch
- Đăng bài với ảnh và video
- Thích, bình luận, lưu bài viết và đánh giá
- Đặt vé và check-in bằng mã QR
- Thanh toán qua ví nội bộ và theo dõi lịch sử thanh toán
- Quản lý dịch vụ và thống kê cho khu du lịch
- Kết bạn, nhắn tin và livestream
- Trang quản trị cho người dùng, khu du lịch, booking, thanh toán, danh mục và cấu hình hệ thống

## Công nghệ sử dụng

- Frontend: React, Vite, Tailwind CSS, React Router, Axios, Framer Motion, Socket.IO Client
- Backend: Node.js, Express, MySQL, JWT, Multer, Nodemailer, Socket.IO
- Cơ sở dữ liệu: MySQL 8
- Realtime: Socket.IO
- Môi trường chạy: Docker Compose

## Cấu trúc thư mục

```text
TravelConnect/
├─ backend/           # API Express, socket server, controllers, routes
├─ frontend/          # Ứng dụng client React + Vite
├─ database/          # File SQL khởi tạo dữ liệu
├─ docs/              # Tài liệu và sơ đồ hệ thống
├─ docker-compose.yml # Môi trường chạy local đầy đủ
└─ README.md
```

## Vai trò trong hệ thống

- `Khách du lịch`: khám phá nội dung, tương tác bài viết, đặt vé, thanh toán, theo dõi booking
- `Đối tác khu du lịch`: quản lý hồ sơ, đăng bài giới thiệu, quản lý dịch vụ, xử lý booking
- `Quản trị viên`: quản lý người dùng, theo dõi hệ thống, quản lý danh mục và cấu hình nền tảng

## Chức năng chính

### 1. Xác thực và hồ sơ

- Đăng ký tài khoản theo vai trò
- Xác thực OTP qua email
- Đăng nhập bằng JWT
- Quên mật khẩu và đặt lại mật khẩu
- Cập nhật hồ sơ cá nhân, ảnh đại diện và ảnh bìa khu du lịch

### 2. Khám phá và mạng xã hội

- Xem bài viết từ các khu du lịch
- Lọc theo danh mục và tìm kiếm nội dung
- Đăng bài với nhiều loại media
- Thích, bình luận, lưu bài viết và đánh giá
- Gợi ý bạn bè và gửi lời mời kết bạn

### 3. Booking và thanh toán

- Xem dịch vụ của khu du lịch
- Tạo hóa đơn trước khi thanh toán
- Thanh toán bằng ví nội bộ
- Tạo booking sau khi thanh toán thành công
- Sinh mã vé và mã QR
- Quét QR khi check-in

### 4. Vận hành khu du lịch

- Cập nhật hồ sơ khu du lịch
- Thêm, sửa, xóa gói dịch vụ
- Xem danh sách booking và chi tiết booking
- Xác nhận, hủy và hoàn tất booking
- Theo dõi thống kê và đánh giá

### 5. Quản trị hệ thống

- Theo dõi người dùng, booking, thanh toán và bài viết mới
- Khóa và mở khóa tài khoản
- Quản lý trạng thái hồ sơ khu du lịch
- Quản lý tỷ lệ hoa hồng giới thiệu
- Thêm, sửa, xóa danh mục bài viết

## Hướng dẫn chạy dự án

### Cách 1: Chạy bằng Docker Compose

Tại thư mục gốc của dự án:

```bash
docker compose up --build
```

Sau khi chạy xong:

- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:3000/api`
- Thư mục upload: `http://localhost:3000/uploads`
- MySQL: `localhost:3307`

## Ghi chú môi trường

Cấu hình Docker hiện đã có sẵn các biến môi trường để chạy local:

- `DB_HOST=db`
- `DB_USER=root`
- `DB_PASS=root`
- `DB_NAME=travelconnect`
- `PORT=3000`
- `JWT_SECRET=travelconnect-secret`
- `CLIENT_URL=http://localhost:5173`

Nếu muốn chức năng gửi OTP hoạt động thật, hãy cập nhật trong `docker-compose.yml`:

- `EMAIL_USER`
- `EMAIL_PASS`

## Tài khoản quản trị mặc định

- Email: `admin@travelconnect.vn`
- Mật khẩu: `Admin@12345`

## Chạy local không dùng Docker

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Bạn cũng cần chuẩn bị:

- Một MySQL server đang chạy
- Một database tên `travelconnect`
- Import dữ liệu từ `database/travelconnect.sql`
- Cấu hình biến môi trường cho backend

## Các nhóm API chính

- `/api/auth` - xác thực, OTP, hồ sơ người dùng
- `/api/posts` - bài viết, bình luận, lượt thích, lưu bài, đánh giá
- `/api/bookings` - booking và xác thực QR
- `/api/payments` - tạo hóa đơn, thanh toán, nạp tiền
- `/api/businesses` - hồ sơ và dịch vụ khu du lịch
- `/api/messages` - phòng chat và tin nhắn
- `/api/admin` - dashboard quản trị và cấu hình nền tảng

## Tài liệu

Xem thêm:

- [Sơ đồ hệ thống](docs/so-do-he-thong.md)

## Lưu ý

- File upload được lưu trong `backend/uploads/`
- Cơ sở dữ liệu được khởi tạo từ `database/travelconnect.sql` khi Docker chạy lần đầu
- Backend có cơ chế tự tạo tài khoản admin mặc định

## Thành viên thực hiện
- Phan Đình Luyến - 22050036
- Vũ Duy Hoàng - 22050038
- Nguyễn Hoàng Vũ - 22050072