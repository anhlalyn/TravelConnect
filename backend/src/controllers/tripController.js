const db = require('../config/db')

exports.getAllTrips = async (req, res) => {
  const userId = req.user.id

  try {
    const [rows] = await db.query(
      `
        SELECT
          cd.*,
          COUNT(lt.id) AS total_stops,
          COUNT(DISTINCT lt.id_khu_du_lich_lien_ket) AS linked_place_count
        FROM chuyen_di cd
        LEFT JOIN lich_trinh_chi_tiet lt ON lt.id_chuyen_di = cd.id
        WHERE cd.id_nguoi_dung = ?
        GROUP BY cd.id
        ORDER BY cd.ngay_bat_dau DESC
      `,
      [userId],
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy danh sách chuyến đi',
      error: err.message,
    })
  }
}

exports.createTrip = async (req, res) => {
  const { ten_chuyen_di, ngay_bat_dau, ngay_ket_thuc, che_do, linked_place_ids } = req.body
  const userId = req.user.id

  if (!ten_chuyen_di || !ngay_bat_dau) {
    return res.status(400).json({
      success: false,
      message: 'Vui lòng nhập tên và ngày bắt đầu',
    })
  }

  const linkedPlaceIds = Array.isArray(linked_place_ids)
    ? [...new Set(linked_place_ids.map((id) => Number(id)).filter(Number.isInteger))]
    : []

  const connection = await db.getConnection()

  try {
    await connection.beginTransaction()

    const [result] = await connection.query(
      'INSERT INTO chuyen_di (id_nguoi_dung, ten_chuyen_di, ngay_bat_dau, ngay_ket_thuc, che_do) VALUES (?, ?, ?, ?, ?)',
      [userId, ten_chuyen_di, ngay_bat_dau, ngay_ket_thuc, che_do || 'public'],
    )

    if (linkedPlaceIds.length) {
      const placeholders = linkedPlaceIds.map(() => '?').join(', ')
      const [places] = await connection.query(
        `
          SELECT
            nd.id,
            nd.ten,
            hs.ten_khu_du_lich,
            hs.vi_do,
            hs.kinh_do,
            hs.dia_chi_chi_tiet
          FROM nguoi_dung nd
          LEFT JOIN ho_so_khu_du_lich hs ON hs.id_nguoi_dung = nd.id
          WHERE nd.id IN (${placeholders}) AND nd.vai_tro = 'khu_du_lich'
        `,
        linkedPlaceIds,
      )

      for (let index = 0; index < linkedPlaceIds.length; index += 1) {
        const place = places.find((item) => item.id === linkedPlaceIds[index])
        if (!place) continue

        await connection.query(
          `
            INSERT INTO lich_trinh_chi_tiet (
              id_chuyen_di,
              ngay_thu,
              thoi_gian,
              hoat_dong,
              id_khu_du_lich_lien_ket,
              ghi_chu,
              vi_do,
              kinh_do
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          `,
          [
            result.insertId,
            index + 1,
            '08:00:00',
            `Khám phá ${place.ten_khu_du_lich || place.ten}`,
            place.id,
            place.dia_chi_chi_tiet || null,
            place.vi_do || null,
            place.kinh_do || null,
          ],
        )
      }
    }

    await connection.commit()

    res.json({
      success: true,
      id: result.insertId,
      message: 'Đã tạo chuyến đi thành công!',
    })
  } catch (err) {
    await connection.rollback()
    res.status(500).json({
      success: false,
      message: 'Lỗi tạo chuyến đi',
      error: err.message,
    })
  } finally {
    connection.release()
  }
}

exports.updateTrip = async (req, res) => {
  const { id } = req.params
  const { ten_chuyen_di, ngay_bat_dau, ngay_ket_thuc } = req.body
  const userId = req.user.id

  try {
    const [result] = await db.query(
      'UPDATE chuyen_di SET ten_chuyen_di = ?, ngay_bat_dau = ?, ngay_ket_thuc = ? WHERE id = ? AND id_nguoi_dung = ?',
      [ten_chuyen_di, ngay_bat_dau, ngay_ket_thuc, id, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' })
    }

    res.json({ success: true, message: 'Cập nhật thành công!' })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi cập nhật',
      error: err.message,
    })
  }
}

exports.deleteTrip = async (req, res) => {
  const { id } = req.params
  const userId = req.user.id

  try {
    const [result] = await db.query(
      'DELETE FROM chuyen_di WHERE id = ? AND id_nguoi_dung = ?',
      [id, userId],
    )

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy chuyến đi' })
    }

    res.json({
      success: true,
      message: 'Đã xóa chuyến đi và lịch trình liên quan!',
    })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa chuyến đi',
      error: err.message,
    })
  }
}

exports.getTripDetails = async (req, res) => {
  const { id } = req.params

  try {
    const [details] = await db.query(
      `
        SELECT lt.*, nd.ten AS ten_kdl, hso.vi_do, hso.kinh_do, hso.dia_chi_chi_tiet
        FROM lich_trinh_chi_tiet lt
        LEFT JOIN ho_so_khu_du_lich hso ON lt.id_khu_du_lich_lien_ket = hso.id_nguoi_dung
        LEFT JOIN nguoi_dung nd ON hso.id_nguoi_dung = nd.id
        WHERE lt.id_chuyen_di = ?
        ORDER BY lt.ngay_thu ASC, lt.thoi_gian ASC
      `,
      [id],
    )

    res.json({ success: true, data: details })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy chi tiết lịch trình',
      error: err.message,
    })
  }
}

exports.addTripActivity = async (req, res) => {
  const { id_chuyen_di, ngay_thu, thoi_gian, hoat_dong, id_khu_du_lich_lien_ket } = req.body

  if (!id_chuyen_di || !hoat_dong) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin hoạt động' })
  }

  try {
    await db.query(
      'INSERT INTO lich_trinh_chi_tiet (id_chuyen_di, ngay_thu, thoi_gian, hoat_dong, id_khu_du_lich_lien_ket) VALUES (?, ?, ?, ?, ?)',
      [id_chuyen_di, ngay_thu || 1, thoi_gian || '08:00:00', hoat_dong, id_khu_du_lich_lien_ket || null],
    )

    res.json({ success: true, message: 'Đã thêm điểm đến vào hành trình!' })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi thêm hoạt động',
      error: err.message,
    })
  }
}

exports.deleteActivity = async (req, res) => {
  const { id } = req.params

  try {
    const [result] = await db.query('DELETE FROM lich_trinh_chi_tiet WHERE id = ?', [id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy điểm dừng' })
    }

    res.json({ success: true, message: 'Đã xóa điểm dừng!' })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi xóa điểm dừng',
      error: err.message,
    })
  }
}

exports.getTrendingPlaces = async (req, res) => {
  try {
    const [rows] = await db.query(
      `
        SELECT
          nd.id,
          nd.ten AS ten_kdl,
          hso.tinh_thanh,
          hso.anh_dai_dien,
          hso.hinh_anh_bia,
          hso.dia_chi_chi_tiet,
          hso.vi_do,
          hso.kinh_do
        FROM ho_so_khu_du_lich hso
        JOIN nguoi_dung nd ON hso.id_nguoi_dung = nd.id
        WHERE hso.trang_thai_duyet = 'verified'
          AND hso.vi_do IS NOT NULL
          AND hso.kinh_do IS NOT NULL
        ORDER BY RAND()
        LIMIT 5
      `,
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Lỗi lấy gợi ý',
      error: err.message,
    })
  }
}
