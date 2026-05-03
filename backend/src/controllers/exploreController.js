// src/controllers/exploreController.js
const db = require('../config/db');
const { ensurePlatformColumns } = require('../utils/platformSchema');
const { normalizeMediaList } = require('../utils/postCompliance');

exports.getExplorePlaces = async (req, res) => {
    try {
        await ensurePlatformColumns();
        const [places] = await db.query(`
            SELECT 
                nd.id, 
                hs.ten_khu_du_lich AS ten, 
                nd.anh_dai_dien, 
                hs.tinh_thanh, 
                hs.mo_ta_tong_quan,
                hs.vi_do,
                hs.kinh_do
            FROM nguoi_dung nd
            JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
            WHERE nd.vai_tro = 'khu_du_lich' 
            AND hs.trang_thai_duyet = 'verified'
            ORDER BY RAND() 
            LIMIT 20
        `);
        res.json({ success: true, data: places });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
exports.getExplorePosts = async (req, res) => {
    try {
        await ensurePlatformColumns();
        const userId = req.user.id;
        const [posts] = await db.query(`
            SELECT 
                bv.*, 
                nd.ten AS ten_nguoi_dang, 
                nd.anh_dai_dien, 
                nd.vai_tro,
                hs.ten_khu_du_lich,
                hs.dia_chi_chi_tiet AS dia_chi,
                -- Kiểm tra xem user hiện tại đã lưu bài này chưa
                IF((SELECT 1 FROM bai_viet_da_luu WHERE id_nguoi_dung = ? AND id_bai_viet = bv.id LIMIT 1), 1, 0) AS da_luu
            FROM bai_viet bv
            JOIN nguoi_dung nd ON bv.id_nguoi_dung = nd.id
            LEFT JOIN ho_so_khu_du_lich hs ON nd.id = hs.id_nguoi_dung
            WHERE nd.vai_tro = 'khu_du_lich'
            ORDER BY bv.ngay_tao DESC
        `, [userId]);

        const formatted = posts.map(p => ({
            ...p,
            da_luu: Boolean(p.da_luu),
            hinh_anh_json: typeof p.hinh_anh_json === 'string' 
                ? JSON.parse(p.hinh_anh_json) 
                : (p.hinh_anh_json || []),
            media_json: normalizeMediaList(
                typeof p.media_json === 'string' ? JSON.parse(p.media_json) : (p.media_json || []),
                typeof p.hinh_anh_json === 'string' ? JSON.parse(p.hinh_anh_json) : (p.hinh_anh_json || []),
            ),
            kiem_duyet_so_json:
                typeof p.kiem_duyet_so_json === 'string'
                    ? JSON.parse(p.kiem_duyet_so_json || '{}')
                    : (p.kiem_duyet_so_json || null),
        }));

        res.json({ success: true, data: formatted });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};
