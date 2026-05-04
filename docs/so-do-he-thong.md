# Sơ đồ hệ thống TravelConnect

Tài liệu này tổng hợp các sơ đồ nghiệp vụ và dữ liệu cốt lõi của hệ thống `TravelConnect`, dựa trên các chức năng đang có trong mã nguồn: xác thực tài khoản, khám phá bài viết, booking, thanh toán, quản lý dịch vụ khu du lịch, thông báo, bạn bè, nhắn tin và quản trị hệ thống.

## 1. Sơ đồ Use Case

```mermaid
flowchart LR
    KD[Khách du lịch]
    DT[Đối tác khu du lịch]
    QT[Quản trị viên]

    UC1((Đăng ký tài khoản))
    UC2((Đăng nhập))
    UC3((Quên mật khẩu / OTP))
    UC4((Xem và cập nhật hồ sơ))
    UC5((Đăng bài chia sẻ))
    UC6((Khám phá bài viết))
    UC7((Lưu, thích, bình luận, đánh giá))
    UC8((Đặt vé / booking))
    UC9((Thanh toán ví))
    UC10((Xem booking của tôi))
    UC11((Kết bạn và nhắn tin))
    UC12((Quản lý hồ sơ khu du lịch))
    UC13((Quản lý gói dịch vụ))
    UC14((Quản lý booking và quét QR))
    UC15((Xem thống kê kinh doanh))
    UC16((Quản lý người dùng))
    UC17((Quản lý trạng thái hồ sơ khu du lịch))
    UC18((Quản lý danh mục và cấu hình nền tảng))
    UC19((Giám sát bài viết, thanh toán, booking))

    KD --> UC1
    KD --> UC2
    KD --> UC3
    KD --> UC4
    KD --> UC5
    KD --> UC6
    KD --> UC7
    KD --> UC8
    KD --> UC9
    KD --> UC10
    KD --> UC11

    DT --> UC1
    DT --> UC2
    DT --> UC3
    DT --> UC4
    DT --> UC5
    DT --> UC6
    DT --> UC12
    DT --> UC13
    DT --> UC14
    DT --> UC15
    DT --> UC11

    QT --> UC2
    QT --> UC16
    QT --> UC17
    QT --> UC18
    QT --> UC19
```

## 2. Sơ đồ luồng dữ liệu DFD

### 2.1. DFD mức ngữ cảnh

```mermaid
flowchart LR
    KD[Khách du lịch]
    DT[Đối tác khu du lịch]
    QT[Quản trị viên]
    TT[Hệ thống TravelConnect]
    EM[Email OTP]

    KD -->|Đăng ký, đăng nhập, booking, thanh toán,\nđăng bài, tương tác| TT
    TT -->|Token, kết quả xử lý,\nQR vé, thông báo| KD

    DT -->|Cập nhật hồ sơ KDL, dịch vụ,\nxử lý booking, xem thống kê| TT
    TT -->|Danh sách booking,\nphân tích, thông báo| DT

    QT -->|Quản lý tài khoản,\nquản trị cấu hình,\ngiám sát hệ thống| TT
    TT -->|Báo cáo tổng quan,\ndanh sách người dùng, cảnh báo| QT

    TT -->|Gửi OTP, email khôi phục mật khẩu| EM
    EM -->|Mã OTP tới người dùng| KD
    EM -->|Mã OTP tới đối tác| DT
```

### 2.2. DFD mức 1

```mermaid
flowchart TB
    KD[Khách du lịch]
    DT[Đối tác khu du lịch]
    QT[Quản trị viên]

    P1((1. Quản lý tài khoản))
    P2((2. Quản lý nội dung và cộng đồng))
    P3((3. Booking và thanh toán))
    P4((4. Vận hành khu du lịch))
    P5((5. Quản trị hệ thống))

    D1[(NguoiDung)]
    D2[(OTP_XacThuc)]
    D3[(BaiViet,\nBinhLuan,\nLuotThich,\nDanhGia,\nBaiVietDaLuu)]
    D4[(DatVe,\nThanhToan)]
    D5[(HoSoKhuDuLich,\nDichVu)]
    D6[(ThongBao,\nBanBe,\nPhongChat,\nTinNhan)]
    D7[(CauHinhNenTang,\nDanhMucBaiViet)]

    KD -->|Đăng ký, đăng nhập,\nquên mật khẩu| P1
    DT -->|Đăng ký, đăng nhập,\ncập nhật hồ sơ| P1
    P1 <--> D1
    P1 <--> D2

    KD -->|Đăng bài, xem feed,\nthích, lưu, bình luận, đánh giá,\nkết bạn, chat| P2
    DT -->|Đăng bài quảng bá,\nchat, nhận thông báo| P2
    P2 <--> D1
    P2 <--> D3
    P2 <--> D6
    P2 <--> D7

    KD -->|Tạo hóa đơn,\nthanh toán, xem booking,\nhủy booking| P3
    P3 <--> D1
    P3 <--> D4
    P3 --> D6

    DT -->|Quản lý dịch vụ,\nxác nhận booking,\nquét QR,\nxem thống kê| P4
    P4 <--> D4
    P4 <--> D5
    P4 --> D6

    QT -->|Quản lý hồ sơ KDL,\nquản lý người dùng,\ncấu hình hoa hồng,\ndanh mục bài viết| P5
    P5 <--> D1
    P5 <--> D4
    P5 <--> D5
    P5 <--> D6
    P5 <--> D7
```

## 3. Sơ đồ ERD

```mermaid
erDiagram
    NGUOI_DUNG ||--o| HO_SO_KHU_DU_LICH : so_huu
    NGUOI_DUNG ||--o{ BAI_VIET : dang
    NGUOI_DUNG ||--o{ DAT_VE : dat_ve_voi_tu_cach_khach
    NGUOI_DUNG ||--o{ DAT_VE : nhan_booking_voi_tu_cach_kdl
    NGUOI_DUNG ||--o{ THANH_TOAN : thanh_toan
    NGUOI_DUNG ||--o{ THONG_BAO : nhan_thong_bao
    NGUOI_DUNG ||--o{ THONG_BAO : gui_thong_bao
    NGUOI_DUNG ||--o{ BINH_LUAN : viet
    NGUOI_DUNG ||--o{ LUOT_THICH : thich
    NGUOI_DUNG ||--o{ BAI_VIET_DA_LUU : luu
    NGUOI_DUNG ||--o{ DANH_GIA_KDL : danh_gia
    NGUOI_DUNG ||--o{ BAN_BE : gui_loi_moi
    NGUOI_DUNG ||--o{ BAN_BE : nhan_loi_moi
    NGUOI_DUNG ||--o{ OTP_XAC_THUC : nhan_otp
    NGUOI_DUNG ||--o{ THANH_VIEN_PHONG_CHAT : tham_gia
    NGUOI_DUNG ||--o{ TIN_NHAN : gui_tin_nhan

    HO_SO_KHU_DU_LICH ||--o{ DICH_VU : cung_cap
    HO_SO_KHU_DU_LICH ||--o{ DANH_GIA_KDL : duoc_danh_gia

    BAI_VIET ||--o{ BINH_LUAN : co
    BAI_VIET ||--o{ LUOT_THICH : co
    BAI_VIET ||--o{ BAI_VIET_DA_LUU : duoc_luu
    BAI_VIET ||--o{ DANH_GIA_KDL : nhan_danh_gia

    PHONG_CHAT ||--o{ THANH_VIEN_PHONG_CHAT : gom
    PHONG_CHAT ||--o{ TIN_NHAN : chua

    NGUOI_DUNG {
        int id PK
        string ten
        string email
        string mat_khau
        enum vai_tro
        decimal so_du
        int diem_tin_cay
        string anh_dai_dien
        enum trang_thai_tai_khoan
        json so_thich_json
        boolean da_xac_thuc_otp
        datetime ngay_tao
    }

    HO_SO_KHU_DU_LICH {
        int id PK
        int id_nguoi_dung FK
        string ten_khu_du_lich
        string tinh_thanh
        string dia_chi_chi_tiet
        text mo_ta_tong_quan
        enum trang_thai_duyet
        text ghi_chu_duyet
        datetime ngay_duyet
    }

    BAI_VIET {
        int id PK
        int id_nguoi_dung FK
        string tieu_de
        text noi_dung
        json media_json
        json hinh_anh_json
        int id_kdl_gan_the
        string ten_kdl_gan_the
        string danh_muc
        json kiem_duyet_so_json
        datetime ngay_tao
    }

    DICH_VU {
        int id PK
        int id_khu_du_lich FK
        string ten_dich_vu
        decimal gia_tien
        text mo_ta
    }

    DAT_VE {
        int id PK
        int id_kdl FK
        int id_khach FK
        date ngay_den
        int so_ngay
        int so_nguoi
        string loai_ve
        string ten_khach
        decimal tong_tien
        string ma_ve
        text ma_qr
        enum trang_thai
        text ghi_chu
        datetime thoi_gian_quet_ve
        datetime ngay_tao
    }

    THANH_TOAN {
        int id PK
        int id_nguoi_dung FK
        int id_kdl FK
        string ten_kdl
        decimal tong_tien
        int id_nguoi_gioi_thieu
        date ngay_den
        int so_luong
        enum trang_thai
        string phuong_thuc
        string ma_tra_cuu
        datetime ngay_tao
    }

    THONG_BAO {
        int id PK
        int id_nguoi_nhan FK
        int id_nguoi_gui FK
        text noi_dung
        string loai_thong_bao
        int id_lien_ket
        boolean da_xem
        datetime ngay_tao
    }

    BINH_LUAN {
        int id PK
        int id_nguoi_dung FK
        int id_bai_viet FK
        text noi_dung
        datetime ngay_tao
    }

    LUOT_THICH {
        int id PK
        int id_nguoi_dung FK
        int id_bai_viet FK
        datetime ngay_tao
    }

    BAI_VIET_DA_LUU {
        int id PK
        int id_nguoi_dung FK
        int id_bai_viet FK
        datetime ngay_luu
    }

    DANH_GIA_KDL {
        int id PK
        int id_kdl FK
        int id_bai_viet FK
        int id_nguoi_dung FK
        int so_sao
        text noi_dung
        datetime ngay_tao
    }

    BAN_BE {
        int id PK
        int id_nguoi_gui FK
        int id_nguoi_nhan FK
        enum trang_thai
        datetime ngay_tao
    }

    OTP_XAC_THUC {
        int id PK
        string email
        string ma_otp
        string loai
        datetime het_han
        boolean da_su_dung
    }

    PHONG_CHAT {
        int id PK
        string ten_nhom_chat
        enum loai_phong
        datetime ngay_tao
    }

    THANH_VIEN_PHONG_CHAT {
        int id PK
        int id_phong FK
        int id_nguoi_dung FK
    }

    TIN_NHAN {
        int id PK
        int id_phong FK
        int id_nguoi_gui FK
        text noi_dung
        enum loai_tin_nhan
        datetime thoi_gian_gui
    }
```

## 4. Sơ đồ User Flow

```mermaid
flowchart TD
    A[Bắt đầu] --> B{Người dùng đã có tài khoản?}
    B -- Chưa --> C[Đăng ký]
    C --> D[Xác thực OTP]
    D --> E[Đăng nhập]
    B -- Rồi --> E

    E --> F{Vai trò người dùng}

    F -- Khách du lịch --> G[Trang chủ / Explore]
    G --> H[Xem bài viết khu du lịch]
    H --> I{Muốn tương tác hay đặt vé?}
    I -- Tương tác --> J[Thích, bình luận, lưu, đánh giá, kết bạn, chat]
    I -- Đặt vé --> K[Chọn khu du lịch / gói dịch vụ]
    K --> L[Tạo hóa đơn]
    L --> M[Thanh toán ví]
    M --> N[Nhận booking + mã QR]
    N --> O[Xem booking của tôi]

    F -- Đối tác khu du lịch --> P[Dashboard khu du lịch]
    P --> Q[Cập nhật hồ sơ khu du lịch]
    P --> R[Quản lý gói dịch vụ]
    P --> S[Nhận booking mới]
    S --> T[Xác nhận / hủy / quét QR]
    T --> U[Xem thống kê và đánh giá]

    F -- Quản trị viên --> V[Admin dashboard]
    V --> W[Quản lý người dùng]
    V --> X[Quản lý trạng thái hồ sơ khu du lịch]
    V --> Y[Quản lý danh mục và cấu hình]
    V --> Z[Giám sát booking, thanh toán, hệ thống]
```

## 5. Sơ đồ luồng hoạt động hệ thống

Phần này mô tả chi tiết các luồng hoạt động chính của hệ thống `TravelConnect`, từ lúc người dùng đăng ký tài khoản cho đến khi hoàn tất booking, quản lý dịch vụ và giám sát hệ thống.

### 5.1. Luồng đăng ký, xác thực OTP và đăng nhập

```mermaid
flowchart TD
    A1[Bắt đầu] --> B1[Người dùng chọn loại tài khoản]
    B1 --> C1{Vai trò}
    C1 -- Khách du lịch --> D1[Nhập họ tên, email,\nmật khẩu, sở thích]
    C1 -- Khu du lịch --> E1[Nhập tên khu du lịch / doanh nghiệp,\nemail, mật khẩu]
    D1 --> F1[Gửi yêu cầu đăng ký]
    E1 --> F1
    F1 --> G1{Email đã tồn tại?}
    G1 -- Có --> H1[Thông báo trùng email]
    H1 --> B1
    G1 -- Không --> I1[Hệ thống tạo tài khoản\nchưa xác thực OTP]
    I1 --> J1[Tạo mã OTP đăng ký]
    J1 --> K1[Gửi OTP qua email]
    K1 --> L1[Người dùng nhập OTP]
    L1 --> M1{OTP hợp lệ và còn hạn?}
    M1 -- Không --> N1[Thông báo OTP sai hoặc hết hạn]
    N1 --> L1
    M1 -- Có --> O1[Kích hoạt tài khoản]
    O1 --> P1{Vai trò là khu du lịch?}
    P1 -- Có --> Q1[Tạo hoặc cập nhật hồ sơ khu du lịch]
    Q1 --> R1[Tự động duyệt hồ sơ khu du lịch]
    P1 -- Không --> S1[Bỏ qua bước hồ sơ KDL]
    R1 --> T1[Người dùng đăng nhập]
    S1 --> T1
    T1 --> U1[Nhập email và mật khẩu]
    U1 --> V1{Thông tin đúng?}
    V1 -- Không --> W1[Thông báo đăng nhập thất bại]
    W1 --> U1
    V1 -- Có --> X1[Tạo JWT token]
    X1 --> Y1[Trả về thông tin người dùng]
    Y1 --> Z1[Điều hướng đến trang phù hợp theo vai trò]
```

### 5.2. Luồng khám phá, đăng bài và tương tác nội dung

```mermaid
flowchart TD
    A2[Người dùng đăng nhập thành công] --> B2[Truy cập trang Khám phá]
    B2 --> C2[Hệ thống tải danh sách bài viết khu du lịch]
    C2 --> D2[Hệ thống tải danh mục bài viết]
    D2 --> E2[Hiển thị feed khám phá]
    E2 --> F2{Người dùng là ai?}

    F2 -- Khách du lịch --> G2[Xem bài viết, lọc theo danh mục,\ntìm kiếm theo nội dung]
    G2 --> H2{Có muốn tương tác?}
    H2 -- Có --> I2[Thích / lưu / bình luận / đánh giá]
    I2 --> J2[Cập nhật dữ liệu tương tác]
    J2 --> K2[Hiển thị lại bài viết đã cập nhật]
    H2 -- Không --> L2[Tiếp tục khám phá bài khác]

    F2 -- Khu du lịch --> M2[Nhập tiêu đề, danh mục,\nnội dung và media]
    M2 --> N2[Gửi yêu cầu đăng bài]
    N2 --> O2{Nội dung hợp lệ?}
    O2 -- Không --> P2[Thông báo lỗi dữ liệu]
    P2 --> M2
    O2 -- Có --> Q2[Tải ảnh/video lên hệ thống]
    Q2 --> R2[Tạo bản ghi bài viết]
    R2 --> S2[Tạo dữ liệu kiểm duyệt số]
    S2 --> T2[Lưu bài viết vào cơ sở dữ liệu]
    T2 --> U2[Làm mới danh sách Khám phá]
    U2 --> V2[Hiển thị bài viết vừa đăng]
```

### 5.3. Luồng đặt vé, thanh toán và check-in QR

```mermaid
flowchart TD
    A3[Khách du lịch chọn bài viết hoặc hồ sơ khu du lịch] --> B3[Xem thông tin khu du lịch]
    B3 --> C3[Xem danh sách gói dịch vụ]
    C3 --> D3[Chọn loại tour, ngày đi,\nsố lượng khách, ghi chú]
    D3 --> E3[Gửi yêu cầu tạo hóa đơn]
    E3 --> F3{Dữ liệu booking hợp lệ?}
    F3 -- Không --> G3[Thông báo lỗi dữ liệu]
    G3 --> D3
    F3 -- Có --> H3[Tạo hóa đơn thanh toán\ntrạng thái pending]
    H3 --> I3[Người dùng xác nhận thanh toán]
    I3 --> J3{Số dư ví đủ?}
    J3 -- Không --> K3[Thông báo không đủ số dư]
    K3 --> L3[Nạp tiền vào ví hoặc hủy]
    L3 --> I3
    J3 -- Có --> M3[Trừ tiền trong ví]
    M3 --> N3[Cập nhật hóa đơn completed]
    N3 --> O3[Tạo booking trạng thái pending]
    O3 --> P3[Sinh mã vé và dữ liệu QR]
    P3 --> Q3[Gửi thông báo cho khu du lịch]
    Q3 --> R3[Khách du lịch xem booking của tôi]
    R3 --> S3[Khu du lịch mở màn hình quản lý booking]
    S3 --> T3[Xem chi tiết booking]
    T3 --> U3{Khu du lịch xử lý booking}
    U3 -- Xác nhận --> V3[Cập nhật booking confirmed]
    U3 -- Hủy --> W3[Cập nhật booking cancelled]
    V3 --> X3[Gửi thông báo xác nhận cho khách]
    W3 --> Y3[Gửi thông báo hủy cho khách]
    X3 --> Z3[Khách đến check-in tại khu du lịch]
    Z3 --> A4[Khu du lịch quét mã QR]
    A4 --> B4{QR hợp lệ và booking đã xác nhận?}
    B4 -- Không --> C4[Thông báo quét thất bại]
    B4 -- Có --> D4[Cập nhật booking completed]
    D4 --> E4[Lưu thời gian quét vé]
    E4 --> F4[Gửi thông báo hoàn tất cho khách]
```

### 5.4. Luồng quản lý hồ sơ và dịch vụ khu du lịch

```mermaid
flowchart TD
    A5[Đối tác khu du lịch đăng nhập] --> B5[Truy cập hồ sơ cá nhân]
    B5 --> C5[Cập nhật tên khu du lịch, tỉnh thành,\nmô tả, địa chỉ, tọa độ]
    C5 --> D5[Tải ảnh đại diện hoặc ảnh bìa]
    D5 --> E5[Gửi yêu cầu cập nhật hồ sơ]
    E5 --> F5[Hệ thống lưu hồ sơ khu du lịch]
    F5 --> G5[Giữ trạng thái hồ sơ đang hiển thị]
    G5 --> H5[Đối tác mở quản lý gói dịch vụ]
    H5 --> I5{Thao tác với dịch vụ}
    I5 -- Thêm mới --> J5[Nhập tên dịch vụ, giá tiền, mô tả]
    I5 -- Chỉnh sửa --> K5[Cập nhật thông tin dịch vụ]
    I5 -- Xóa --> L5[Xóa dịch vụ khỏi hệ thống]
    J5 --> M5[Lưu dịch vụ]
    K5 --> M5
    L5 --> N5[Làm mới danh sách dịch vụ]
    M5 --> N5
    N5 --> O5[Hiển thị danh sách dịch vụ mới nhất]
    O5 --> P5[Khách du lịch có thể chọn dịch vụ khi booking]
```

### 5.5. Luồng quản trị và giám sát hệ thống

```mermaid
flowchart TD
    A6[Quản trị viên đăng nhập] --> B6[Truy cập Admin Dashboard]
    B6 --> C6[Hệ thống tải số liệu tổng quan]
    C6 --> D6[Hiển thị người dùng, bài viết,\nbooking, thanh toán, thông báo]
    D6 --> E6{Quản trị viên muốn xử lý gì?}

    E6 -- Quản lý người dùng --> F6[Xem danh sách tài khoản]
    F6 --> G6[Chọn tài khoản]
    G6 --> H6{Khóa hay mở khóa?}
    H6 -- Khóa --> I6[Cập nhật trạng thái suspended]
    H6 -- Mở khóa --> J6[Cập nhật trạng thái active]
    I6 --> K6[Gửi thông báo cho người dùng]
    J6 --> K6

    E6 -- Quản lý hồ sơ KDL --> L6[Xem danh sách khu du lịch]
    L6 --> M6[Kiểm tra trạng thái hồ sơ]
    M6 --> N6{Cần thay đổi trạng thái?}
    N6 -- Có --> O6[Chuyển verified / pending / rejected]
    O6 --> P6[Lưu ghi chú quản trị]
    P6 --> Q6[Gửi thông báo cho đối tác]
    N6 -- Không --> R6[Giữ nguyên trạng thái]

    E6 -- Quản lý nền tảng --> S6[Cập nhật tỷ lệ hoa hồng]
    S6 --> T6[Lưu cấu hình]
    E6 -- Quản lý danh mục --> U6[Thêm / sửa / xóa danh mục bài viết]
    U6 --> V6[Lưu danh mục]
    E6 -- Giám sát giao dịch --> W6[Xem danh sách booking và thanh toán]
    W6 --> X6[Theo dõi trạng thái toàn hệ thống]
```

### 5.6. Luồng quên mật khẩu

```mermaid
flowchart TD
    A7[Bắt đầu] --> B7[Người dùng nhập email]
    B7 --> C7{Email tồn tại?}
    C7 -- Không --> D7[Thông báo email không hợp lệ]
    D7 --> B7
    C7 -- Có --> E7[Hệ thống tạo OTP quên mật khẩu]
    E7 --> F7[Gửi OTP qua email]
    F7 --> G7[Người dùng nhập OTP]
    G7 --> H7{OTP đúng và còn hạn?}
    H7 -- Không --> I7[Thông báo OTP sai hoặc hết hạn]
    I7 --> G7
    H7 -- Có --> J7[Người dùng nhập mật khẩu mới]
    J7 --> K7{Mật khẩu mới hợp lệ?}
    K7 -- Không --> L7[Thông báo lỗi độ dài hoặc xác nhận]
    L7 --> J7
    K7 -- Có --> M7[Mã hóa mật khẩu mới]
    M7 --> N7[Cập nhật bảng người dùng]
    N7 --> O7[Đánh dấu OTP đã sử dụng]
    O7 --> P7[Thông báo đổi mật khẩu thành công]
    P7 --> Q7[Kết thúc]
```

## 6. Mô tả ngắn các thành phần chính

- `Khách du lịch`: đăng ký, đăng nhập, khám phá nội dung, tương tác xã hội, đặt vé, thanh toán, theo dõi booking.
- `Đối tác khu du lịch`: quản lý hồ sơ khu du lịch, dịch vụ, booking, check-in QR, xem thống kê và đánh giá.
- `Quản trị viên`: giám sát hệ thống, quản lý người dùng, quản lý trạng thái hồ sơ KDL, quản lý danh mục và cấu hình nền tảng.
- `Kho dữ liệu cốt lõi`: `nguoi_dung`, `ho_so_khu_du_lich`, `bai_viet`, `dich_vu`, `dat_ve`, `thanh_toan`, `thong_bao`.
