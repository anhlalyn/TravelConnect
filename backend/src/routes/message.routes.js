const express = require('express')
const router = express.Router()
const messageCtrl = require('../controllers/messageController')
const authMiddleware = require('../middlewares/auth.middleware')

router.get('/rooms', authMiddleware, messageCtrl.getChatRooms)
router.get('/room/:roomId', authMiddleware, messageCtrl.getMessagesByRoom)
router.post('/send', authMiddleware, messageCtrl.sendMessage)
router.post(
  '/send-media',
  authMiddleware,
  messageCtrl.uploadMessageMedia,
  messageCtrl.sendMediaMessage,
)
router.post('/create-room', authMiddleware, messageCtrl.createOrGetRoom)
router.post('/create-group', authMiddleware, messageCtrl.createGroupRoom)

module.exports = router
