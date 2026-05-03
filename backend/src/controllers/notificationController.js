const db = require('../config/db');

exports.getMyNotifications = async (req, res) => {
    const userId = req.user.id;
    try {
        const [rows] = await db.query(`
            SELECT tb.*, nd.ten AS ten_nguoi_gui, nd.anh_dai_dien 
            FROM thong_bao tb
            JOIN nguoi_dung nd ON tb.id_nguoi_gui = nd.id
            WHERE tb.id_nguoi_nhan = ?
            ORDER BY tb.ngay_tao DESC
            LIMIT 20
        `, [userId]);
        
        res.json({ success: true, data: rows });
    } catch (err) {
        console.error("Lỗi getNotifications:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};

// Hàm đánh dấu tất cả đã xem
exports.markAllRead = async (req, res) => {
    const userId = req.user.id;
    try {
        await db.query("UPDATE thong_bao SET da_xem = TRUE WHERE id_nguoi_nhan = ?", [userId]);
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};