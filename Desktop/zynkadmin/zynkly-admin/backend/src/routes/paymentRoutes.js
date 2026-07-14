const express = require('express');
const router = express.Router();
const { getPayments, getPayment, processRefund } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getPayments);
router.get('/:id', protect, getPayment);
router.put('/:id/refund', protect, authorize('super_admin'), processRefund);

module.exports = router;
