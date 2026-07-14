const express = require('express');
const router = express.Router();
const { getStats, getRevenueChart, getUserGrowth } = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/stats', protect, getStats);
router.get('/revenue-chart', protect, getRevenueChart);
router.get('/user-growth', protect, getUserGrowth);

module.exports = router;
