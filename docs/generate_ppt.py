import sys
import os

try:
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.enum.shapes import MSO_SHAPE
except ImportError:
    print("python-pptx is not installed. Installing it now...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "python-pptx"])
    from pptx import Presentation
    from pptx.util import Inches, Pt
    from pptx.dml.color import RGBColor
    from pptx.enum.text import PP_ALIGN
    from pptx.enum.shapes import MSO_SHAPE

def create_presentation():
    prs = Presentation()
    # Set to widescreen 16:9
    prs.slide_width = Inches(13.333)
    prs.slide_height = Inches(7.5)

    # Color Palette
    COLOR_DARK_BG = RGBColor(15, 23, 42)      # Deep slate/navy
    COLOR_LIGHT_BG = RGBColor(248, 250, 252)  # Light grey
    COLOR_PRIMARY_TEXT = RGBColor(30, 41, 59) # Slate 800
    COLOR_SECONDARY_TEXT = RGBColor(71, 85, 105) # Slate 600
    COLOR_ACCENT = RGBColor(14, 165, 233)     # Light blue/sky
    COLOR_WHITE = RGBColor(255, 255, 255)
    COLOR_CARD_BG = RGBColor(255, 255, 255)
    COLOR_BORDER = RGBColor(226, 232, 240)

    # Blank layout for custom designs
    blank_slide_layout = prs.slide_layouts[6]

    # Helper: Set background color
    def set_slide_background(slide, color):
        background = slide.background
        fill = background.fill
        fill.solid()
        fill.fore_color.rgb = color

    # Helper: Add header to light slides
    def add_slide_header(slide, title_text):
        # Header background shape
        shape = slide.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(1.2)
        )
        shape.fill.solid()
        shape.fill.fore_color.rgb = COLOR_DARK_BG
        shape.line.fill.background() # No border
        
        # Title text
        txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.2), Inches(12.333), Inches(0.8))
        tf = txBox.text_frame
        tf.word_wrap = True
        p = tf.paragraphs[0]
        p.text = title_text
        p.font.size = Pt(28)
        p.font.bold = True
        p.font.color.rgb = COLOR_WHITE
        p.font.name = "Arial"
        p.alignment = PP_ALIGN.LEFT

    # Helper: Add cards/columns to slides
    def add_card(slide, left, top, width, height, title, items, is_accented=False):
        # Card Background
        card = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
        card.fill.solid()
        if is_accented:
            card.fill.fore_color.rgb = COLOR_DARK_BG
            text_color = COLOR_WHITE
            title_color = COLOR_ACCENT
        else:
            card.fill.fore_color.rgb = COLOR_CARD_BG
            text_color = COLOR_PRIMARY_TEXT
            title_color = COLOR_DARK_BG
            card.line.color.rgb = COLOR_BORDER

        # Card Text Frame
        txBox = slide.shapes.add_textbox(left + Inches(0.2), top + Inches(0.2), width - Inches(0.4), height - Inches(0.4))
        tf = txBox.text_frame
        tf.word_wrap = True

        # Card Title
        p_title = tf.paragraphs[0]
        p_title.text = title
        p_title.font.size = Pt(20)
        p_title.font.bold = True
        p_title.font.color.rgb = title_color
        p_title.font.name = "Arial"
        p_title.space_after = Pt(14)

        # Card Items
        for item in items:
            p = tf.add_paragraph()
            p.text = "• " + item
            p.font.size = Pt(14)
            p.font.color.rgb = text_color
            p.font.name = "Arial"
            p.space_after = Pt(8)

    # ----------------------------------------------------
    # SLIDE 1: Title Slide (Dark)
    # ----------------------------------------------------
    slide1 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide1, COLOR_DARK_BG)

    # Subtitle or Topic Indicator
    txBox = slide1.shapes.add_textbox(Inches(1.0), Inches(1.5), Inches(11.333), Inches(0.6))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = "BÁO CÁO CHUYÊN ĐỀ PHÁT TRIỂN HỆ THỐNG"
    p.font.size = Pt(18)
    p.font.bold = True
    p.font.color.rgb = COLOR_ACCENT
    p.font.name = "Arial"

    # Main Title
    txBox = slide1.shapes.add_textbox(Inches(1.0), Inches(2.2), Inches(11.333), Inches(2.0))
    tf = txBox.text_frame
    tf.word_wrap = True
    p = tf.paragraphs[0]
    p.text = "TRAVELCONNECT - NỀN TẢNG MẠNG XÃ HỘI & ĐẶT VÉ DU LỊCH TÍCH HỢP"
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE
    p.font.name = "Arial"

    # Student Info Card
    infoBox = slide1.shapes.add_textbox(Inches(1.0), Inches(4.5), Inches(8.0), Inches(2.0))
    tf = infoBox.text_frame
    
    p = tf.paragraphs[0]
    p.text = "Sinh viên thực hiện: "
    p.font.size = Pt(16)
    p.font.color.rgb = COLOR_WHITE
    run = p.add_run()
    run.text = "Phan Định Luyện"
    run.font.bold = True
    run.font.color.rgb = COLOR_ACCENT
    p.space_after = Pt(8)

    p2 = tf.add_paragraph()
    p2.text = "Mã số sinh viên: "
    p2.font.size = Pt(16)
    p2.font.color.rgb = COLOR_WHITE
    run2 = p2.add_run()
    run2.text = "22050036"
    run2.font.bold = True
    p2.space_after = Pt(8)

    # Decorator Line
    line = slide1.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(1.0), Inches(4.3), Inches(3.0), Inches(0.05))
    line.fill.solid()
    line.fill.fore_color.rgb = COLOR_ACCENT
    line.line.fill.background()

    # ----------------------------------------------------
    # SLIDE 2: Đặt vấn đề (Problem)
    # ----------------------------------------------------
    slide2 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide2, COLOR_LIGHT_BG)
    add_slide_header(slide2, "1. Đặt Vấn Đề & Lý Do Chọn Đề Tài")

    add_card(
        slide2,
        Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5),
        "Thực trạng & Khó khăn",
        [
            "Nhu cầu du lịch tự túc và tìm kiếm thông tin review chân thực tăng cao.",
            "Sự phân mảnh: Người dùng phải chuyển đổi quá nhiều ứng dụng (App review, App nhắn tin, App đặt vé riêng biệt).",
            "Mất nhiều thời gian để quản lý lịch trình và xác thực giao dịch vé thủ công."
        ]
    )

    add_card(
        slide2,
        Inches(7.133), Inches(2.0), Inches(5.2), Inches(4.5),
        "Giải pháp từ TravelConnect",
        [
            "Mô hình 'All-in-One' tích hợp Mạng xã hội + Đặt vé + Nhắn tin gọi điện realtime.",
            "Tự động hóa hoàn toàn quy trình mua vé, xuất vé QR và check-in nhanh bằng camera.",
            "Giao diện thân thiện kết nối trực tiếp Khách du lịch - Đối tác khu du lịch - Admin."
        ],
        is_accented=True
    )

    # ----------------------------------------------------
    # SLIDE 3: Mục tiêu & Phạm vi (Goal & Scope)
    # ----------------------------------------------------
    slide3 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide3, COLOR_LIGHT_BG)
    add_slide_header(slide3, "2. Mục Tiêu & Phạm Vi Đề Tài")

    add_card(
        slide3,
        Inches(1.0), Inches(2.0), Inches(3.5), Inches(4.5),
        "Khách Du Lịch (User)",
        [
            "Tìm kiếm địa điểm du lịch.",
            "Đăng bài viết chia sẻ, tương tác (like, comment, save).",
            "Đặt vé dịch vụ trực tuyến và nhận mã QR check-in.",
            "Gọi điện video, nhắn tin thời gian thực."
        ]
    )

    add_card(
        slide3,
        Inches(4.916), Inches(2.0), Inches(3.5), Inches(4.5),
        "Khu Du Lịch (Business)",
        [
            "Đăng ký thông tin, thiết lập hồ sơ khu du lịch.",
            "Đăng bán các gói vé/dịch vụ.",
            "Quét mã QR của khách trực tiếp bằng camera điện thoại để check-in.",
            "Quản lý booking và xem biểu đồ thống kê doanh thu."
        ]
    )

    add_card(
        slide3,
        Inches(8.833), Inches(2.0), Inches(3.5), Inches(4.5),
        "Hệ Thống (Admin)",
        [
            "Quản lý danh sách người dùng và doanh nghiệp đối tác.",
            "Duyệt các yêu cầu đăng ký kinh doanh.",
            "Quản lý bài viết và tương tác của người dùng.",
            "Thống kê tổng quan hoạt động và cấu hình hệ thống."
        ]
    )

    # ----------------------------------------------------
    # SLIDE 4: Kiến trúc công nghệ (Tech Stack)
    # ----------------------------------------------------
    slide4 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide4, COLOR_LIGHT_BG)
    add_slide_header(slide4, "3. Kiến Trúc & Công Nghệ Sử Dụng")

    add_card(
        slide4,
        Inches(1.0), Inches(2.0), Inches(3.5), Inches(4.5),
        "Frontend Client",
        [
            "React.js & Vite: Tốc độ build nhanh, tối ưu hóa giao diện Single Page.",
            "Tailwind CSS: Xây dựng giao diện Responsive, hiện đại và tùy biến cao.",
            "Lucide React: Bộ biểu tượng thiết kế tối giản, trực quan."
        ]
    )

    add_card(
        slide4,
        Inches(4.916), Inches(2.0), Inches(3.5), Inches(4.5),
        "Backend & Database",
        [
            "Node.js & Express.js: Xử lý API tốc độ cao, khả năng chịu tải tốt.",
            "MySQL 8: Cơ sở dữ liệu quan hệ chặt chẽ, tối ưu truy vấn.",
            "JWT & Bcrypt: Bảo mật tài khoản và xác thực API phân quyền."
        ]
    )

    add_card(
        slide4,
        Inches(8.833), Inches(2.0), Inches(3.5), Inches(4.5),
        "Realtime & Deployment",
        [
            "Socket.IO: Truyền tin nhắn thời gian thực và quản lý phòng chat.",
            "WebRTC: Kết nối cuộc gọi thoại, gọi video và livestream peer-to-peer.",
            "Docker & Docker Compose: Đồng bộ môi trường chạy dev & production."
        ],
        is_accented=True
    )

    # ----------------------------------------------------
    # SLIDE 5: Tính năng chính (Features)
    # ----------------------------------------------------
    slide5 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide5, COLOR_LIGHT_BG)
    add_slide_header(slide5, "4. Các Phân Hệ Tính Năng Chính")

    add_card(
        slide5,
        Inches(1.0), Inches(2.0), Inches(5.2), Inches(2.1),
        "Xác thực & Mạng xã hội",
        [
            "Đăng ký, gửi mã xác thực OTP thực qua Gmail.",
            "Đăng bài viết kèm ảnh/video, like, comment, lưu trữ."
        ]
    )

    add_card(
        slide5,
        Inches(1.0), Inches(4.4), Inches(5.2), Inches(2.1),
        "Thương mại & Check-in QR",
        [
            "Đặt vé trực tuyến, xuất vé dạng QR Code bảo mật.",
            "Khu du lịch quét QR Code check-in nhanh."
        ]
    )

    add_card(
        slide5,
        Inches(7.133), Inches(2.0), Inches(5.2), Inches(4.5),
        "Realtime Communication & Stream",
        [
            "Nhắn tin tức thời (realtime chat) cá nhân và nhóm.",
            "Đàm thoại trực tiếp (Video Call) công nghệ WebRTC kết nối peer-to-peer mượt mà.",
            "Tích hợp phát Livestream trực tiếp trên nền tảng mạng xã hội kết nối người xem.",
            "Tự động bật/tắt thiết bị camera và micro trực quan."
        ],
        is_accented=True
    )

    # ----------------------------------------------------
    # SLIDE 6: Thiết kế Database (Database Design)
    # ----------------------------------------------------
    slide6 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide6, COLOR_LIGHT_BG)
    add_slide_header(slide6, "5. Thiết Kế Cơ Sở Dữ Liệu (MySQL)")

    add_card(
        slide6,
        Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5),
        "Thực thể chính & Quan hệ",
        [
            "nguoi_dung: Quản lý tài khoản khách hàng, khu du lịch, admin.",
            "bai_viet, binh_luan, tuong_tac: Lưu thông tin hoạt động mạng xã hội.",
            "dat_ve, ve_dich_vu: Quản lý thông tin đặt chỗ và trạng thái vé.",
            "tin_nhan, phong_chat: Quản lý thông tin nhắn tin realtime."
        ]
    )

    add_card(
        slide6,
        Inches(7.133), Inches(2.0), Inches(5.2), Inches(4.5),
        "Đặc điểm thiết kế DB",
        [
            "Chuẩn hóa dữ liệu để tránh dư thừa dữ liệu (Data redundancy).",
            "Sử dụng ràng buộc khóa ngoại (Foreign Keys) để đảm bảo tính toàn vẹn tham chiếu.",
            "Lưu trữ dữ liệu dạng JSON cho các thuộc tính động (ví dụ: danh sách sở thích).",
            "Tối ưu hóa các truy vấn JOIN để lấy dữ liệu bài viết kèm tương tác và thông tin người đăng."
        ]
    )

    # ----------------------------------------------------
    # SLIDE 7: Điểm sáng kỹ thuật (Technical Highlights)
    # ----------------------------------------------------
    slide7 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide7, COLOR_LIGHT_BG)
    add_slide_header(slide7, "6. Điểm Sáng Kỹ Thuật & Tối Ưu Hóa")

    add_card(
        slide7,
        Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5),
        "Hàng đợi ICE Candidate (WebRTC)",
        [
            "Vấn đề: Ứng dụng WebRTC bị lỗi đen màn hình do các gói tin địa chỉ mạng (ICE Candidate) của người gọi đến trước khi người nhận bấm chấp nhận cuộc gọi.",
            "Giải pháp: Xây dựng cơ chế hàng đợi (Queue) lưu trữ tạm thời các ICE candidate.",
            "Kết quả: Ngay sau khi bấm OK kết nối, các gói tin được lấy ra và add đồng loạt, thiết lập camera và âm thanh mượt mà 100%."
        ],
        is_accented=True
    )

    add_card(
        slide7,
        Inches(7.133), Inches(2.0), Inches(5.2), Inches(4.5),
        "Tính ổn định & Triển khai",
        [
            "Gửi mail OTP thực tế: Sử dụng Nodemailer kết nối App Password bảo mật an toàn.",
            "Docker hóa toàn bộ: Dễ dàng cấu hình và khởi chạy ứng dụng với một lệnh duy nhất.",
            "Cơ chế tự khởi tạo Admin mặc định khi database trống, tăng tính tiện lợi khi cài đặt hệ thống."
        ]
    )

    # ----------------------------------------------------
    # SLIDE 8: Demo Giao Diện (UI Mockups)
    # ----------------------------------------------------
    slide8 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide8, COLOR_LIGHT_BG)
    add_slide_header(slide8, "7. Demo Một Số Giao Diện Hệ Thống")

    add_card(
        slide8,
        Inches(1.0), Inches(2.0), Inches(3.5), Inches(4.5),
        "Mạng Xã Hội & Đặt Vé",
        [
            "Bảng tin hiển thị bài đăng ảnh/video đẹp mắt.",
            "Trang thông tin khu du lịch với các nút Đặt vé nhanh.",
            "Biểu mẫu điền thông tin và thanh toán hóa đơn."
        ]
    )

    add_card(
        slide8,
        Inches(4.916), Inches(2.0), Inches(3.5), Inches(4.5),
        "Nhắn Tin & Gọi Video",
        [
            "Khung trò chuyện thời gian thực tích hợp gửi ảnh.",
            "Giao diện gọi Video hiển thị trực tiếp camera local và đối phương toàn màn hình.",
            "Nút bật tắt mic/camera trực quan."
        ],
        is_accented=True
    )

    add_card(
        slide8,
        Inches(8.833), Inches(2.0), Inches(3.5), Inches(4.5),
        "Trang Đối Tác & Admin",
        [
            "Vé QR Code gửi về cho khách hàng.",
            "Trang quản lý booking và quét mã QR check-in.",
            "Biểu đồ thống kê doanh thu theo thời gian của khu du lịch."
        ]
    )

    # ----------------------------------------------------
    # SLIDE 9: Đánh giá & Hướng phát triển (Evaluation)
    # ----------------------------------------------------
    slide9 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide9, COLOR_LIGHT_BG)
    add_slide_header(slide9, "8. Kết Quả & Hướng Phát Triển")

    add_card(
        slide9,
        Inches(1.0), Inches(2.0), Inches(5.2), Inches(4.5),
        "Đánh giá kết quả",
        [
            "Hoàn thiện 100% các tính năng nghiệp vụ cốt lõi theo kế hoạch đặt ra.",
            "Kết nối chat tức thời và gọi video, livestream hoạt động ổn định và mượt mà.",
            "Hệ thống database được tối ưu truy vấn tốt, đảm bảo tốc độ phản hồi nhanh."
        ]
    )

    add_card(
        slide9,
        Inches(7.133), Inches(2.0), Inches(5.2), Inches(4.5),
        "Hướng phát triển đề tài",
        [
            "Tích hợp các cổng thanh toán điện tử chính thức (VNPay, MoMo, PayPal).",
            "Sử dụng công nghệ AI đề xuất địa điểm du lịch (Recommendation System) theo sở thích.",
            "Phát triển phiên bản ứng dụng di động Hybrid (React Native/Flutter) để tối ưu trải nghiệm scan QR."
        ],
        is_accented=True
    )

    # ----------------------------------------------------
    # SLIDE 10: Conclusion (Dark)
    # ----------------------------------------------------
    slide10 = prs.slides.add_slide(blank_slide_layout)
    set_slide_background(slide10, COLOR_DARK_BG)

    # Main Title
    txBox = slide10.shapes.add_textbox(Inches(1.0), Inches(2.5), Inches(11.333), Inches(1.5))
    tf = txBox.text_frame
    p = tf.paragraphs[0]
    p.text = "CẢM ƠN HỘI ĐỒNG THẦY CÔ VÀ CÁC BẠN ĐÃ LẮNG NGHE!"
    p.font.size = Pt(32)
    p.font.bold = True
    p.font.color.rgb = COLOR_WHITE
    p.font.name = "Arial"
    p.alignment = PP_ALIGN.CENTER

    # Subtitle
    txBox2 = slide10.shapes.add_textbox(Inches(1.0), Inches(4.0), Inches(11.333), Inches(1.0))
    tf2 = txBox2.text_frame
    p2 = tf2.paragraphs[0]
    p2.text = "Em xin kính mong nhận được các ý kiến đóng góp và câu hỏi từ Hội đồng chuyên môn."
    p2.font.size = Pt(20)
    p2.font.color.rgb = COLOR_ACCENT
    p2.font.name = "Arial"
    p2.alignment = PP_ALIGN.CENTER

    # Save presentation
    output_path = "docs/TravelConnect_Slides.pptx"
    prs.save(output_path)
    print(f"Presentation saved to {output_path} successfully!")

if __name__ == "__main__":
    create_presentation()
