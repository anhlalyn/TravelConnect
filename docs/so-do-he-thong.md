# Sơ đồ nghiệp vụ TravelConnect

Tài liệu này mô tả ngắn các tác nhân chính và luồng hoạt động trọng tâm của hệ thống.

## 1. Sơ đồ Use Case

```mermaid
flowchart LR
    KD[Khách du lịch]
    DT[Đối tác khu du lịch]
    QT[Quản trị viên]

    UC1((Đăng ký tài khoản))
    UC2((Đăng nhập))
    UC3((Quên mật khẩu))
    UC4((Xem và cập nhật hồ sơ))
    UC5((Đăng bài chia sẻ))
    UC6((Khám phá bài viết))
    UC7((Đặt vé / booking))
    UC8((Quản lý dịch vụ khu du lịch))
    UC9((Xem thống kê))
    UC10((Quản lý người dùng))
    UC11((Duyệt và giám sát hệ thống))

    KD --> UC1
    KD --> UC2
    KD --> UC3
    KD --> UC4
    KD --> UC5
    KD --> UC6
    KD --> UC7

    DT --> UC1
    DT --> UC2
    DT --> UC3
    DT --> UC4
    DT --> UC8
    DT --> UC9

    QT --> UC2
    QT --> UC10
    QT --> UC11
```

## 2. Sơ đồ luồng hoạt động quên mật khẩu

```mermaid
flowchart TD
    A[Bắt đầu] --> B[Người dùng nhập email đã đăng ký]
    B --> C{Email tồn tại?}
    C -- Không --> D[Thông báo email không tồn tại]
    D --> B
    C -- Có --> E[Hệ thống tạo OTP và gửi email]
    E --> F[Người dùng nhập mã OTP]
    F --> G{OTP hợp lệ và còn hạn?}
    G -- Không --> H[Thông báo OTP sai hoặc hết hạn]
    H --> F
    G -- Có --> I[Người dùng nhập mật khẩu mới]
    I --> J{Mật khẩu hợp lệ?}
    J -- Không --> K[Thông báo lỗi xác nhận hoặc độ dài]
    K --> I
    J -- Có --> L[Hệ thống cập nhật mật khẩu]
    L --> M[Đánh dấu OTP đã sử dụng]
    M --> N[Thông báo thành công]
    N --> O[Kết thúc]
```

## 3. Mô tả ngắn luồng đăng nhập

```mermaid
flowchart TD
    A1[Người dùng nhập email và mật khẩu] --> B1[Frontend kiểm tra dữ liệu]
    B1 --> C1{Dữ liệu hợp lệ?}
    C1 -- Không --> D1[Hiển thị lỗi trên biểu mẫu]
    C1 -- Có --> E1[Gửi yêu cầu đăng nhập tới backend]
    E1 --> F1{Tài khoản tồn tại và đúng mật khẩu?}
    F1 -- Không --> G1[Trả thông báo thất bại]
    F1 -- Có --> H1[Backend trả token và thông tin người dùng]
    H1 --> I1[Frontend lưu token]
    I1 --> J1[Điều hướng vào trang chủ]
```

## 4. Tác nhân chính

- `Khách du lịch`: đăng ký, đăng nhập, khám phá bài viết, đặt vé, quản lý hồ sơ.
- `Đối tác khu du lịch`: quản lý hồ sơ khu du lịch, dịch vụ, booking và thống kê.
- `Quản trị viên`: giám sát hệ thống, quản lý người dùng và xử lý các vấn đề vận hành.
