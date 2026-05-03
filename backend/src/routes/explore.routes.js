const express = require('express');
const router = express.Router();
// 1. Kiểm tra kỹ đường dẫn đến file Controller
const exploreCtrl = require('../controllers/exploreController');
const authMiddleware = require('../middlewares/auth.middleware');

// In ra log để kiểm tra hàm có bị undefined không (có thể xóa sau khi chạy)
console.log("Hàm getExplorePlaces:", exploreCtrl.getExplorePlaces);
console.log("Hàm getExplorePosts:", exploreCtrl.getExplorePosts);

// 2. Định nghĩa các Route
// Phải đảm bảo exploreCtrl.getExplorePlaces là một function
router.get('/places', authMiddleware, exploreCtrl.getExplorePlaces);

router.get('/posts', authMiddleware, exploreCtrl.getExplorePosts);

module.exports = router;