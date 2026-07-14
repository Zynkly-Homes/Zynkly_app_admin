const Payment = require('../models/Payment');
const Booking = require('../models/Booking');

// @desc    Get all payments
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res) => {
  try {
    const { status, method, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = {};

    if (status && status !== 'all') query.status = status;
    if (method && method !== 'all') query.method = method;

    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Payment.countDocuments(query);

    const payments = await Payment.find(query)
      .populate('user', 'name email phone')
      .populate('booking', 'bookingId scheduledDate')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    // Revenue summary
    const successPayments = await Payment.find({ status: 'success' });
    const totalRevenue = successPayments.reduce((sum, p) => sum + p.amount, 0);

    res.status(200).json({
      success: true,
      payments,
      totalRevenue,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('user', 'name email phone')
      .populate('booking', 'bookingId scheduledDate status');

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process refund (placeholder)
// @route   PUT /api/payments/:id/refund
// @access  Private (super_admin)
const processRefund = async (req, res) => {
  try {
    const { refundAmount, refundReason } = req.body;

    const payment = await Payment.findById(req.params.id);
    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    if (payment.status !== 'success') {
      return res.status(400).json({ success: false, message: 'Only successful payments can be refunded' });
    }

    payment.status = 'refunded';
    payment.refundAmount = refundAmount || payment.amount;
    payment.refundReason = refundReason || '';
    payment.refundedAt = new Date();
    await payment.save();

    // Update booking payment status
    await Booking.findByIdAndUpdate(payment.booking, { paymentStatus: 'refunded' });

    res.status(200).json({ success: true, message: 'Refund processed successfully', payment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getPayments, getPayment, processRefund };
