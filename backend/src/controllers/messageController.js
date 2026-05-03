const fs = require('fs')
const multer = require('multer')
const path = require('path')
const db = require('../config/db')
const { getIO } = require('../socket')

const messageUploadDir = path.join(process.cwd(), 'uploads')

const ensureUploadDir = () => {
  if (!fs.existsSync(messageUploadDir)) {
    fs.mkdirSync(messageUploadDir, { recursive: true })
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureUploadDir()
    cb(null, messageUploadDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `message-${uniqueSuffix}${path.extname(file.originalname)}`)
  },
})

const mediaFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('audio/')) {
    cb(null, true)
    return
  }

  cb(new Error('Chỉ hỗ trợ ảnh hoặc âm thanh'), false)
}

const upload = multer({
  storage,
  fileFilter: mediaFilter,
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
})

exports.uploadMessageMedia = upload.single('tep_tin')

const ensureMessageSchema = async () => {
  const [rows] = await db.query("SHOW COLUMNS FROM tin_nhan LIKE 'loai_tin_nhan'")
  const typeDefinition = rows[0]?.Type || ''

  if (!typeDefinition.includes("'audio'")) {
    await db.query(
      "ALTER TABLE tin_nhan MODIFY COLUMN loai_tin_nhan ENUM('text','image','audio','video_call_log') DEFAULT 'text'",
    )
  }
}

const checkRoomAccess = async (roomId, userId) => {
  const [rows] = await db.query(
    `
      SELECT 1
      FROM thanh_vien_phong_chat
      WHERE id_phong = ? AND id_nguoi_dung = ?
      LIMIT 1
    `,
    [roomId, userId],
  )

  return rows.length > 0
}

const getRoomSummaryById = async (roomId, userId) => {
  const [rows] = await db.query(
    `
      SELECT
        pc.id,
        pc.ten_nhom_chat,
        pc.loai_phong,
        CASE
          WHEN pc.loai_phong = 'nhom' THEN pc.ten_nhom_chat
          ELSE (
            SELECT nd.ten
            FROM thanh_vien_phong_chat tv2
            JOIN nguoi_dung nd ON nd.id = tv2.id_nguoi_dung
            WHERE tv2.id_phong = pc.id AND tv2.id_nguoi_dung != ?
            LIMIT 1
          )
        END AS ten_hien_thi,
        (
          SELECT tv2.id_nguoi_dung
          FROM thanh_vien_phong_chat tv2
          WHERE tv2.id_phong = pc.id AND tv2.id_nguoi_dung != ?
          LIMIT 1
        ) AS id_doi_phuong,
        (
          SELECT tn.noi_dung
          FROM tin_nhan tn
          WHERE tn.id_phong = pc.id
          ORDER BY tn.thoi_gian_gui DESC
          LIMIT 1
        ) AS tin_nhan_cuoi,
        (
          SELECT tn.loai_tin_nhan
          FROM tin_nhan tn
          WHERE tn.id_phong = pc.id
          ORDER BY tn.thoi_gian_gui DESC
          LIMIT 1
        ) AS loai_tin_nhan_cuoi,
        (
          SELECT COUNT(*)
          FROM thanh_vien_phong_chat tv3
          WHERE tv3.id_phong = pc.id
        ) AS so_thanh_vien
      FROM phong_chat pc
      WHERE pc.id = ?
      LIMIT 1
    `,
    [userId, userId, roomId],
  )

  return rows[0] || null
}

const getMessageById = async (messageId) => {
  const [rows] = await db.query(
    `
      SELECT
        tn.*,
        nd.ten AS ten_nguoi_gui,
        nd.anh_dai_dien
      FROM tin_nhan tn
      JOIN nguoi_dung nd ON nd.id = tn.id_nguoi_gui
      WHERE tn.id = ?
      LIMIT 1
    `,
    [messageId],
  )

  return rows[0] || null
}

const emitRoomRefresh = async (roomId) => {
  const io = getIO()
  if (!io) return

  const [members] = await db.query(
    'SELECT id_nguoi_dung FROM thanh_vien_phong_chat WHERE id_phong = ?',
    [roomId],
  )

  members.forEach((member) => {
    io.to(`user_${member.id_nguoi_dung}`).emit('rooms:refresh', { roomId })
  })
}

const emitNewMessage = async (roomId, message) => {
  const io = getIO()
  if (!io) return

  io.to(`chat_room_${roomId}`).emit('message:new', message)
  await emitRoomRefresh(roomId)
}

exports.getChatRooms = async (req, res) => {
  const userId = req.user.id

  try {
    const [rooms] = await db.query(
      `
        SELECT
          pc.id,
          pc.ten_nhom_chat,
          pc.loai_phong,
          CASE
            WHEN pc.loai_phong = 'nhom' THEN pc.ten_nhom_chat
            ELSE (
              SELECT nd.ten
              FROM thanh_vien_phong_chat tv2
              JOIN nguoi_dung nd ON nd.id = tv2.id_nguoi_dung
              WHERE tv2.id_phong = pc.id AND tv2.id_nguoi_dung != ?
              LIMIT 1
            )
          END AS ten_hien_thi,
          (
            SELECT tv2.id_nguoi_dung
            FROM thanh_vien_phong_chat tv2
            WHERE tv2.id_phong = pc.id AND tv2.id_nguoi_dung != ?
            LIMIT 1
          ) AS id_doi_phuong,
          (
            SELECT tn.noi_dung
            FROM tin_nhan tn
            WHERE tn.id_phong = pc.id
            ORDER BY tn.thoi_gian_gui DESC
            LIMIT 1
          ) AS tin_nhan_cuoi,
          (
            SELECT tn.loai_tin_nhan
            FROM tin_nhan tn
            WHERE tn.id_phong = pc.id
            ORDER BY tn.thoi_gian_gui DESC
            LIMIT 1
          ) AS loai_tin_nhan_cuoi,
          (
            SELECT COUNT(*)
            FROM thanh_vien_phong_chat tv3
            WHERE tv3.id_phong = pc.id
          ) AS so_thanh_vien
        FROM phong_chat pc
        JOIN thanh_vien_phong_chat tv ON pc.id = tv.id_phong
        WHERE tv.id_nguoi_dung = ?
        ORDER BY COALESCE(
          (
            SELECT tn.thoi_gian_gui
            FROM tin_nhan tn
            WHERE tn.id_phong = pc.id
            ORDER BY tn.thoi_gian_gui DESC
            LIMIT 1
          ),
          pc.ngay_tao
        ) DESC
      `,
      [userId, userId, userId],
    )

    res.json({ success: true, data: rooms })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.getMessagesByRoom = async (req, res) => {
  const { roomId } = req.params
  const userId = req.user.id

  try {
    const hasAccess = await checkRoomAccess(roomId, userId)
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Bạn không thuộc phòng chat này' })
    }

    const [rows] = await db.query(
      `
        SELECT
          tn.*,
          nd.ten AS ten_nguoi_gui,
          nd.anh_dai_dien
        FROM tin_nhan tn
        JOIN nguoi_dung nd ON nd.id = tn.id_nguoi_gui
        WHERE tn.id_phong = ?
        ORDER BY tn.thoi_gian_gui ASC
      `,
      [roomId],
    )

    res.json({ success: true, data: rows })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.sendMessage = async (req, res) => {
  const { id_phong, noi_dung } = req.body
  const userId = req.user.id

  try {
    await ensureMessageSchema()

    if (!id_phong || !String(noi_dung || '').trim()) {
      return res.status(400).json({ success: false, message: 'Thiếu nội dung tin nhắn' })
    }

    const hasAccess = await checkRoomAccess(id_phong, userId)
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Bạn không thuộc phòng chat này' })
    }

    const [result] = await db.query(
      'INSERT INTO tin_nhan (id_phong, id_nguoi_gui, noi_dung, loai_tin_nhan) VALUES (?, ?, ?, ?)',
      [id_phong, userId, String(noi_dung).trim(), 'text'],
    )

    const message = await getMessageById(result.insertId)
    await emitNewMessage(id_phong, message)

    res.json({ success: true, data: message })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.sendMediaMessage = async (req, res) => {
  const { id_phong } = req.body
  const userId = req.user.id
  const file = req.file

  try {
    await ensureMessageSchema()

    if (!id_phong || !file) {
      return res.status(400).json({ success: false, message: 'Thiếu tệp media' })
    }

    const hasAccess = await checkRoomAccess(id_phong, userId)
    if (!hasAccess) {
      return res.status(403).json({ success: false, message: 'Bạn không thuộc phòng chat này' })
    }

    const messageType = file.mimetype.startsWith('audio/') ? 'audio' : 'image'

    const [result] = await db.query(
      'INSERT INTO tin_nhan (id_phong, id_nguoi_gui, noi_dung, loai_tin_nhan) VALUES (?, ?, ?, ?)',
      [id_phong, userId, file.filename, messageType],
    )

    const message = await getMessageById(result.insertId)
    await emitNewMessage(id_phong, message)

    res.json({ success: true, data: message })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.createOrGetRoom = async (req, res) => {
  const userId = req.user.id
  const { id_doi_phuong } = req.body

  if (!id_doi_phuong) {
    return res.status(400).json({ success: false, message: 'Thiếu ID người nhận' })
  }

  try {
    const [existingRoom] = await db.query(
      `
        SELECT tv1.id_phong
        FROM thanh_vien_phong_chat tv1
        JOIN thanh_vien_phong_chat tv2 ON tv1.id_phong = tv2.id_phong
        JOIN phong_chat pc ON tv1.id_phong = pc.id
        WHERE tv1.id_nguoi_dung = ?
          AND tv2.id_nguoi_dung = ?
          AND pc.loai_phong = 'ca_nhan'
        LIMIT 1
      `,
      [userId, id_doi_phuong],
    )

    if (existingRoom.length > 0) {
      return res.json({ success: true, roomId: existingRoom[0].id_phong })
    }

    const [newRoom] = await db.query(
      "INSERT INTO phong_chat (loai_phong, ten_nhom_chat) VALUES ('ca_nhan', NULL)",
    )
    const roomId = newRoom.insertId

    await db.query(
      'INSERT INTO thanh_vien_phong_chat (id_phong, id_nguoi_dung) VALUES (?, ?), (?, ?)',
      [roomId, userId, roomId, id_doi_phuong],
    )

    await emitRoomRefresh(roomId)
    res.json({ success: true, roomId })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}

exports.createGroupRoom = async (req, res) => {
  const userId = req.user.id
  const { ten_nhom_chat, thanh_vien_ids } = req.body

  const normalizedMemberIds = Array.from(
    new Set((Array.isArray(thanh_vien_ids) ? thanh_vien_ids : []).map((id) => Number(id))),
  ).filter((id) => Number.isInteger(id) && id > 0 && id !== Number(userId))

  if (!String(ten_nhom_chat || '').trim()) {
    return res.status(400).json({ success: false, message: 'Tên nhóm không được để trống' })
  }

  if (normalizedMemberIds.length < 2) {
    return res.status(400).json({
      success: false,
      message: 'Cần chọn ít nhất 2 thành viên để tạo nhóm',
    })
  }

  try {
    const memberPlaceholders = normalizedMemberIds.map(() => '?').join(',')
    const [users] = await db.query(
      `
        SELECT id
        FROM nguoi_dung
        WHERE id IN (${memberPlaceholders})
      `,
      normalizedMemberIds,
    )

    if (users.length !== normalizedMemberIds.length) {
      return res.status(400).json({ success: false, message: 'Có thành viên không hợp lệ' })
    }

    const [newRoom] = await db.query(
      "INSERT INTO phong_chat (ten_nhom_chat, loai_phong) VALUES (?, 'nhom')",
      [String(ten_nhom_chat).trim()],
    )

    const roomId = newRoom.insertId
    const memberIds = [Number(userId), ...normalizedMemberIds]
    const valuePlaceholders = memberIds.map(() => '(?, ?)').join(', ')
    const params = memberIds.flatMap((memberId) => [roomId, memberId])

    await db.query(
      `INSERT INTO thanh_vien_phong_chat (id_phong, id_nguoi_dung) VALUES ${valuePlaceholders}`,
      params,
    )

    await emitRoomRefresh(roomId)
    res.json({ success: true, roomId })
  } catch (err) {
    res.status(500).json({ success: false, error: err.message })
  }
}
