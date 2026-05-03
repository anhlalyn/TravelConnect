const db = require('../config/db');

// 1. Gửi lời mời kết bạn
exports.sendRequest = async (req, res) => {
    const { id_nguoi_nhan } = req.body;
    const id_nguoi_gui = req.user.id;

    if (id_nguoi_gui === Number(id_nguoi_nhan)) {
        return res.status(400).json({ success: false, message: "Bạn không thể kết bạn với chính mình" });
    }

    try {
        await db.query(
            "INSERT INTO ban_be (id_nguoi_gui, id_nguoi_nhan, trang_thai) VALUES (?, ?, 'cho_xac_nhan')",
            [id_nguoi_gui, id_nguoi_nhan]
        );

        await db.query(
            "INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao, id_lien_ket) VALUES (?, ?, ?, ?, ?)",
            [id_nguoi_nhan, id_nguoi_gui, "đã gửi cho bạn một lời mời kết bạn", "ket_ban", id_nguoi_gui]
        );

        res.json({ success: true, message: "Đã gửi lời mời" });
    } catch (err) {
        res.status(400).json({ success: false, message: "Yêu cầu đã tồn tại hoặc lỗi hệ thống" });
    }
};

// 2. Lấy danh sách lời mời ĐANG CHỜ
exports.getFriendRequests = async (req, res) => {
    const userId = req.user.id;
    try {
        const [requests] = await db.query(`
            SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.vai_tro, bb.ngay_tao
            FROM ban_be bb
            JOIN nguoi_dung nd ON bb.id_nguoi_gui = nd.id
            WHERE bb.id_nguoi_nhan = ? AND bb.trang_thai = 'cho_xac_nhan'
            ORDER BY bb.ngay_tao DESC
        `, [userId]);
        res.json({ success: true, data: requests });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 3. Lấy danh sách bạn bè chính thức
exports.getFriendList = async (req, res) => {
    const userId = req.user.id;
    try {
        const [friends] = await db.query(`
            SELECT nd.id, nd.ten, nd.anh_dai_dien, nd.vai_tro
            FROM ban_be bb
            JOIN nguoi_dung nd ON (bb.id_nguoi_gui = nd.id OR bb.id_nguoi_nhan = nd.id)
            WHERE (bb.id_nguoi_gui = ? OR bb.id_nguoi_nhan = ?) 
            AND bb.trang_thai = 'da_ket_ban'
            AND nd.id != ?
        `, [userId, userId, userId]);
        res.json({ success: true, data: friends });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 4. Lấy gợi ý bạn bè
exports.getSuggestFriends = async (req, res) => {
    const userId = req.user.id;
    try {
        const [users] = await db.query(`
            SELECT id, ten, anh_dai_dien, vai_tro FROM nguoi_dung 
            WHERE id != ? 
            AND id NOT IN (
                SELECT id_nguoi_nhan FROM ban_be WHERE id_nguoi_gui = ?
                UNION
                SELECT id_nguoi_gui FROM ban_be WHERE id_nguoi_nhan = ?
            ) 
            AND vai_tro != 'admin'
            ORDER BY RAND() LIMIT 9
        `, [userId, userId, userId]);
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 5. Chấp nhận lời mời
exports.acceptRequest = async (req, res) => {
    const { id_nguoi_gui } = req.body;
    const id_nguoi_nhan = req.user.id;
    try {
        const [result] = await db.query(
            "UPDATE ban_be SET trang_thai = 'da_ket_ban' WHERE id_nguoi_gui = ? AND id_nguoi_nhan = ? AND trang_thai = 'cho_xac_nhan'",
            [id_nguoi_gui, id_nguoi_nhan]
        );

        if (result.affectedRows > 0) {
            // Thông báo ngược lại cho người gửi
            await db.query(
                "INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao, id_lien_ket) VALUES (?, ?, ?, ?, ?)",
                [id_nguoi_gui, id_nguoi_nhan, "đã chấp nhận lời mời kết bạn", "ket_ban", id_nguoi_nhan]
            );
        }

        res.json({ success: true, message: "Đã trở thành bạn bè" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// 6. Hủy kết bạn hoặc từ chối lời mời (MỚI)
exports.unfriend = async (req, res) => {
    const { id_doi_phuong } = req.body;
    const userId = req.user.id;
    try {
        await db.query(`
            DELETE FROM ban_be 
            WHERE (id_nguoi_gui = ? AND id_nguoi_nhan = ?) 
            OR (id_nguoi_gui = ? AND id_nguoi_nhan = ?)
        `, [userId, id_doi_phuong, id_doi_phuong, userId]);

        res.json({ success: true, message: "Đã thực hiện thay đổi" });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};