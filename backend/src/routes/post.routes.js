const express = require('express');
const router = express.Router();
const postController = require('../controllers/postController');
const authMiddleware = require('../middlewares/auth.middleware');
const upload = require('../middlewares/load.middleware'); 

// 1. Chức năng tương tác
router.get('/saved-list', authMiddleware, postController.getSavedPosts);
router.post('/save', authMiddleware, postController.toggleSavePost);
router.post('/like', authMiddleware, postController.likePost);
router.post('/comment', authMiddleware, postController.commentPost);

// Dòng này nãy bị lỗi vì controller chưa có hàm, giờ đã ổn:
router.get('/:id/comments', authMiddleware, postController.getCommentsByPost);

// 2. Chi tiết & Đánh giá
router.get('/detail/:id', authMiddleware, postController.getPostDetail);
router.post('/review', authMiddleware, postController.createReview);

// 3. Bài viết
router.get('/', authMiddleware, postController.getAllPosts);
router.post('/', authMiddleware, upload.array('hinh_anh', 5), postController.createPost);

// 4. Thao tác phụ (Dùng optional chaining để an toàn)
if (postController.updatePost) router.put('/:id', authMiddleware, postController.updatePost);
if (postController.deletePost) router.delete('/:id', authMiddleware, postController.deletePost);

module.exports = router;