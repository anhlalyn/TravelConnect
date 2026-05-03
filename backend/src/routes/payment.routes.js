const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/payments?status=pending
router.get('/', authMiddleware, paymentController.getPayments);

// DELETE /api/payments/:id
router.delete('/:id', authMiddleware, paymentController.deletePendingPayment);

// POST /api/payments/deposit
router.post('/deposit', authMiddleware, paymentController.depositMoney);

// POST /api/payments/execute
router.post('/execute', authMiddleware, paymentController.executePayment);

router.post('/create-invoice', authMiddleware, paymentController.createInvoice);

module.exports = router; // <--- CỰC KỲ QUAN TRỌNG
