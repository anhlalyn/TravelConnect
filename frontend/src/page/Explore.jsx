const db = require('../config/db');
const { createNotification } = require('../utils/notification');

// 1. Lấy bài viết phân luồng (Home vs Explore)
exports.getAllPosts = async (req, res) => {
    const userId = Number(req.user.id);
    const { mode } = req.query; // 'explore' hoặc 'home'

    try {
        let queryStr = "";
        let queryParams = [];

        if (mode === 'explore') {
            // KHÁM PHÁ: Chỉ lấy bài của Khu du lịch
            queryStr = `
                SELECT DISTINCT bv.*, nd.ten AS ten_nguoi_dang, nd.anh_dai_dien, nd.vai_tro
                FROM bai_viet bv
                JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
                WHERE nd.vai_tro = 'khu_du_lich'
                ORDER BY bv.ngay_tao DESC`;
        } else {
            // TRANG CHỦ: Bài cá nhân + Bài bạn bè (Loại bỏ KDL)
            queryStr = `
                SELECT DISTINCT bv.*, nd.ten AS ten_nguoi_dang, nd.anh_dai_dien, nd.vai_tro
                FROM bai_viet bv
                JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
                WHERE nd.vai_tro != 'khu_du_lich' 
                AND (bv.id_nguoi_dung = ? 
                OR bv.id_nguoi_dung IN (
                    SELECT id_nguoi_nhan FROM ban_be WHERE id_nguoi_gui = ? AND trang_thai = 'da_ket_ban'
                    UNION
                    SELECT id_nguoi_gui FROM ban_be WHERE id_nguoi_nhan = ? AND trang_thai = 'da_ket_ban'
                ))
                ORDER BY bv.ngay_tao DESC`;
            queryParams = [userId, userId, userId];
        }

        const [posts] = await db.query(queryStr, queryParams);

        const formattedPosts = posts.map(post => ({
            ...post,
            hinh_anh_json: typeof post.hinh_anh_json === 'string' 
                ? JSON.parse(post.hinh_anh_json) 
                : (post.hinh_anh_json || [])
        }));

        res.json({ success: true, data: formattedPosts });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 2. Đăng bài mới (Xử lý upload ảnh)
exports.createPost = async (req, res) => {
    try {
        const { tieu_de, noi_dung, id_kdl_gan_the, ten_kdl_gan_the } = req.body;
        const id_nguoi_dung = req.user.id;
        let hinh_anh_list = req.files ? req.files.map(file => file.filename) : [];

        const [result] = await db.query(
            `INSERT INTO bai_viet (id_nguoi_dung, tieu_de, noi_dung, hinh_anh_json, id_kdl_gan_the, ten_kdl_gan_the) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [id_nguoi_dung, tieu_de || "Khám phá", noi_dung, JSON.stringify(hinh_anh_list), id_kdl_gan_the || null, ten_kdl_gan_the || null]
        );
        res.json({ success: true, message: "Đăng bài thành công!", postId: result.insertId });
    } catch (err) {
        res.status(500).json({ success: false, error: "Lỗi đăng bài" });
    }
};

// 3. Lấy chi tiết bài viết & Đánh giá (Dành cho PostDetail.jsx)
exports.getPostDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const [posts] = await db.query(`
            SELECT bv.*, nd.ten AS ten_kdl, nd.anh_dai_dien, hs.dia_chi_chi_tiet, nd.id AS id_nguoi_dang
            FROM bai_viet bv
            JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
            LEFT JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
            WHERE bv.id = ?`, [id]);

        if (posts.length === 0) return res.status(404).json({ success: false, message: "Không tìm thấy" });

        // Lấy đúng ID người đăng (KDL) để lấy danh sách đánh giá
        const idKDL = posts[0].id_nguoi_dang;

        const [reviews] = await db.query(`
            SELECT dg.*, nd.ten, nd.anh_dai_dien 
            FROM danh_gia_kdl dg
            JOIN nguoi_dung nd ON dg.id_nguoi_dung = nd.id
            WHERE dg.id_kdl = ? 
            ORDER BY dg.ngay_tao DESC`, [idKDL]);

        const post = posts[0];
        post.hinh_anh_json = typeof post.hinh_anh_json === 'string' ? JSON.parse(post.hinh_anh_json) : (post.hinh_anh_json || []);

        res.json({ success: true, post, reviews: reviews || [] });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. Gửi đánh giá KDL (Dùng cho Khám phá)
exports.createReview = async (req, res) => {
    const { id_kdl, so_sao, noi_dung } = req.body;
    const id_nguoi_dung = req.user.id;
    try {
        // Kiểm tra xem id_kdl có tồn tại không
        if(!id_kdl) return res.status(400).json({ success: false, message: "Thiếu ID Khu du lịch" });

        await db.query(
            "INSERT INTO danh_gia_kdl (id_kdl, id_nguoi_dung, so_sao, noi_dung) VALUES (?, ?, ?, ?)",
            [id_kdl, id_nguoi_dung, so_sao, noi_dung]
        );
        res.json({ success: true, message: "Cảm ơn bạn đã đánh giá!" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// ... Các hàm Like, Comment, Save giữ nguyên ...
exports.likePost = async (req, res) => {
    const { id_bai_viet } = req.body;
    const userId = req.user.id;
    try {
        const [exist] = await db.query("SELECT id FROM luot_thich WHERE id_nguoi_dung = ? AND id_bai_viet = ?", [userId, id_bai_viet]);
        if (exist.length > 0) {
            await db.query("DELETE FROM luot_thich WHERE id_nguoi_dung = ? AND id_bai_viet = ?", [userId, id_bai_viet]);
            return res.json({ success: true, liked: false });
        }
        await db.query("INSERT INTO luot_thich (id_nguoi_dung, id_bai_viet) VALUES (?, ?)", [userId, id_bai_viet]);
        res.json({ success: true, liked: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};

exports.toggleSavePost = async (req, res) => {
    const { id_bai_viet } = req.body;
    const userId = req.user.id;
    try {
        const [exist] = await db.query("SELECT id FROM bai_viet_da_luu WHERE id_nguoi_dung = ? AND id_bai_viet = ?", [userId, id_bai_viet]);
        if (exist.length > 0) {
            await db.query("DELETE FROM bai_viet_da_luu WHERE id_nguoi_dung = ? AND id_bai_viet = ?", [userId, id_bai_viet]);
            return res.json({ success: true, saved: false });
        }
        await db.query("INSERT INTO bai_viet_da_luu (id_nguoi_dung, id_bai_viet) VALUES (?, ?)", [userId, id_bai_viet]);
        res.json({ success: true, saved: true });
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
};