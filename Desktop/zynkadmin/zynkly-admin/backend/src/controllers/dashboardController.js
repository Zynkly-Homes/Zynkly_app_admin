const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Service = require('../models/Service');

// @desc    Get dashboard stats
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = async (req, res) => {
  try {
    const [totalUsers, totalBookings, totalServices, payments, recentBookings] = await Promise.all([
      User.countDocuments({ status: 'active' }),
      Booking.countDocuments(),
      Service.countDocuments({ isActive: true }),
      Payment.find({ status: 'success' }),
      Booking.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('user', 'name email')
        .populate('service', 'name'),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    // Booking status breakdown
    const [pending, confirmed, completed, cancelled] = await Promise.all([
      Booking.countDocuments({ status: 'pending' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalBookings,
        totalServices,
        totalRevenue,
        bookingStatus: { pending, confirmed, completed, cancelled },
        recentBookings,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get monthly revenue chart data (last 6 months)
// @route   GET /api/dashboard/revenue-chart
// @access  Private
const getRevenueChart = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);
    sixMonthsAgo.setHours(0, 0, 0, 0);

    const data = await Payment.aggregate([
      {
        $match: {
          status: 'success',
          createdAt: { $gte: sixMonthsAgo },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = data.map((d) => ({
      month: months[d._id.month - 1],
      revenue: d.revenue,
      bookings: d.count,
    }));

    res.status(200).json({ success: true, chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get user growth chart data (last 6 months)
// @route   GET /api/dashboard/user-growth
// @access  Private
const getUserGrowth = async (req, res) => {
  try {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
    sixMonthsAgo.setDate(1);

    const data = await User.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartData = data.map((d) => ({
      month: months[d._id.month - 1],
      users: d.count,
    }));

    res.status(200).json({ success: true, chartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getStats, getRevenueChart, getUserGrowth };
