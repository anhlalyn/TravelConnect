const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/', authMiddleware, notificationController.getMyNotifications);
router.put('/mark-read', authMiddleware, notificationController.markAllRead);

module.exports = router;