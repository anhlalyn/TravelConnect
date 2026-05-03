const express = require('express');
const router = express.Router();
const friendCtrl = require('../controllers/friendController');
const authMiddleware = require('../middlewares/auth.middleware');

router.get('/suggest', authMiddleware, friendCtrl.getSuggestFriends);
router.get('/requests', authMiddleware, friendCtrl.getFriendRequests);
router.get('/list', authMiddleware, friendCtrl.getFriendList);

router.post('/add', authMiddleware, friendCtrl.sendRequest);
router.post('/accept', authMiddleware, friendCtrl.acceptRequest);
router.post('/unfriend', authMiddleware, friendCtrl.unfriend); // THÊM ROUTE NÀY

module.exports = router;