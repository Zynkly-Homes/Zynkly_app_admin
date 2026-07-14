const express = require('express');
const router = express.Router();
const { getReportSummary, downloadBookingsCSV, downloadRevenueCSV } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getReportSummary);
router.get('/bookings/csv', protect, downloadBookingsCSV);
router.get('/revenue/csv', protect, downloadRevenueCSV);

module.exports = router;
