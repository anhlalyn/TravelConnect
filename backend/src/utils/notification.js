const db = require('../config/db');

/**
 * Hàm tạo thông báo mới
 * @param {number} id_nguoi_nhan - ID người nhận thông báo
 * @param {number} id_nguoi_gui - ID người thực hiện hành động
 * @param {string} noi_dung - Nội dung hiển thị
 * @param {string} loai - 'thich', 'binh_luan', 'ket_ban', 'he_thong'
 * @param {number} id_lien_ket - ID bài viết hoặc ID đối tượng liên quan
 */
const createNotification = async (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai, id_lien_ket) => {
    try {
        // Không tạo thông báo nếu mình tự tương tác với chính mình
        if (id_nguoi_nhan === id_nguoi_gui) return;

        await db.query(
            `INSERT INTO thong_bao (id_nguoi_nhan, id_nguoi_gui, noi_dung, loai_thong_bao, id_lien_ket) 
             VALUES (?, ?, ?, ?, ?)`,
            [id_nguoi_nhan, id_nguoi_gui, noi_dung, loai, id_lien_ket]
        );
        console.log(`--- Đã tạo thông báo ${loai} cho User ${id_nguoi_nhan} ---`);
    } catch (err) {
        console.error("Lỗi tạo thông báo:", err);
    }
};

module.exports = { createNotification };