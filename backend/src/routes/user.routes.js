const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authMiddleware = require('../middlewares/auth.middleware');

// ==========================================
// 1. ROUTE HỒ SƠ (PROFILE & SETTINGS)
// ==========================================

// Lấy thông tin profile của bất kỳ ai (public)
router.get('/profile/:id', userController.getUserProfile);
router.get('/search', authMiddleware, userController.searchGlobal);

// Cập nhật thông tin hồ sơ (Cần đăng nhập + Upload ảnh)
// Sử dụng uploadFields đã định nghĩa trong Controller
router.put(
    '/profile/update', 
    authMiddleware, 
    userController.uploadFields, 
    userController.updateProfile
);

// Đổi mật khẩu
router.put('/change-password', authMiddleware, userController.changePassword);


// ==========================================
// 2. ROUTE BẠN BÈ (FRIENDS)
// ==========================================

// Lấy danh sách gợi ý kết bạn
router.get('/friends/suggest', authMiddleware, userController.getSuggestFriends);

// Lấy danh sách lời mời đã nhận
router.get('/friends/requests', authMiddleware, userController.getFriendRequests);

// Lấy danh sách bạn bè đã kết bạn
router.get('/friends/list', authMiddleware, userController.getFriendsList);

// Gửi lời mời kết bạn
router.post('/friends/add', authMiddleware, userController.addFriend);

// Chấp nhận lời mời kết bạn
router.post('/friends/accept', authMiddleware, userController.acceptFriend);

router.get('/suggest-kdl', authMiddleware, userController.getSuggestKdl);
module.exports = router;
