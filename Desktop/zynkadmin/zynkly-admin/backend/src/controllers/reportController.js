const User = require('../models/User');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

// @desc    Get reports summary
// @route   GET /api/reports/summary
// @access  Private
const getReportSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const query = Object.keys(dateFilter).length ? { createdAt: dateFilter } : {};

    const [users, bookings, payments] = await Promise.all([
      User.find(query).select('name createdAt status'),
      Booking.find(query).populate('user', 'name').populate('service', 'name'),
      Payment.find({ ...query, status: 'success' }),
    ]);

    const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      summary: {
        totalUsers: users.length,
        totalBookings: bookings.length,
        totalRevenue,
        completedBookings: bookings.filter((b) => b.status === 'completed').length,
        cancelledBookings: bookings.filter((b) => b.status === 'cancelled').length,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download bookings report as CSV
// @route   GET /api/reports/bookings/csv
// @access  Private
const downloadBookingsCSV = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const query = {};

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const bookings = await Booking.find(query)
      .populate('user', 'name email phone')
      .populate('service', 'name');

    // Ensure temp directory exists
    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, `bookings_${Date.now()}.csv`);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'bookingId', title: 'Booking ID' },
        { id: 'userName', title: 'Customer' },
        { id: 'userEmail', title: 'Email' },
        { id: 'serviceName', title: 'Service' },
        { id: 'status', title: 'Status' },
        { id: 'amount', title: 'Amount (INR)' },
        { id: 'scheduledDate', title: 'Scheduled Date' },
        { id: 'createdAt', title: 'Created At' },
      ],
    });

    const records = bookings.map((b) => ({
      bookingId: b.bookingId,
      userName: b.user?.name || 'N/A',
      userEmail: b.user?.email || 'N/A',
      serviceName: b.service?.name || 'N/A',
      status: b.status,
      amount: b.amount,
      scheduledDate: b.scheduledDate?.toLocaleDateString('en-IN'),
      createdAt: b.createdAt?.toLocaleDateString('en-IN'),
    }));

    await csvWriter.writeRecords(records);

    res.download(filePath, 'zynkly_bookings.csv', () => {
      fs.unlinkSync(filePath); // clean up after download
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download revenue report as CSV
// @route   GET /api/reports/revenue/csv
// @access  Private
const downloadRevenueCSV = async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'success' })
      .populate('user', 'name email')
      .populate('booking', 'bookingId');

    const tmpDir = path.join(__dirname, '../../tmp');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

    const filePath = path.join(tmpDir, `revenue_${Date.now()}.csv`);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'paymentId', title: 'Payment ID' },
        { id: 'bookingId', title: 'Booking ID' },
        { id: 'userName', title: 'Customer' },
        { id: 'amount', title: 'Amount (INR)' },
        { id: 'method', title: 'Method' },
        { id: 'status', title: 'Status' },
        { id: 'date', title: 'Date' },
      ],
    });

    const records = payments.map((p) => ({
      paymentId: p.paymentId,
      bookingId: p.booking?.bookingId || 'N/A',
      userName: p.user?.name || 'N/A',
      amount: p.amount,
      method: p.method,
      status: p.status,
      date: p.createdAt?.toLocaleDateString('en-IN'),
    }));

    await csvWriter.writeRecords(records);

    res.download(filePath, 'zynkly_revenue.csv', () => {
      fs.unlinkSync(filePath);
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getReportSummary, downloadBookingsCSV, downloadRevenueCSV };
