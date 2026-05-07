const express = require('express');
const router = express.Router();
const db = require('../config/db');
const paymentController = require('../controllers/paymentController');
const authMiddleware = require('../middlewares/auth.middleware');

// GET /api/payments?status=pending
router.get('/', authMiddleware, paymentController.getPayments);

// DELETE /api/payments/:id
router.delete('/:id', authMiddleware, paymentController.deletePendingPayment);

// POST /api/payments/deposit
router.post('/deposit', authMiddleware, paymentController.depositMoney);

// POST /api/payments/withdraw
router.post('/withdraw', authMiddleware, async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    const method = req.body.method || 'bank_transfer';
    const accountNumber = String(req.body.accountNumber || '').trim();
    const accountName = String(req.body.accountName || '').trim();
    const bankName = String(req.body.bankName || '').trim();

    if (!amount || amount < 10000) {
      return res.status(400).json({
        success: false,
        message: 'So tien rut toi thieu la 10.000d.',
      });
    }

    if (!accountNumber || !accountName) {
      return res.status(400).json({
        success: false,
        message: 'Vui long nhap day du thong tin nhan tien.',
      });
    }

    const [users] = await db.query('SELECT so_du FROM nguoi_dung WHERE id = ? LIMIT 1', [
      req.user.id,
    ]);

    const currentBalance = Number(users[0]?.so_du || 0);

    if (currentBalance < amount) {
      return res.status(400).json({
        success: false,
        message: 'So du hien tai khong du de rut tien.',
      });
    }

    await db.query('UPDATE nguoi_dung SET so_du = so_du - ? WHERE id = ?', [
      amount,
      req.user.id,
    ]);

    return res.json({
      success: true,
      message: `Da tao yeu cau rut ${amount.toLocaleString('vi-VN')}d qua ${
        method === 'momo' ? 'vi MoMo' : 'tai khoan ngan hang'
      }.`,
      data: {
        amount,
        method,
        accountNumber,
        accountName,
        bankName: bankName || null,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Khong the xu ly yeu cau rut tien luc nay.',
      error: error.message,
    });
  }
});

// POST /api/payments/execute
router.post('/execute', authMiddleware, paymentController.executePayment);

router.post('/create-invoice', authMiddleware, paymentController.createInvoice);

module.exports = router; // <--- CỰC KỲ QUAN TRỌNG
