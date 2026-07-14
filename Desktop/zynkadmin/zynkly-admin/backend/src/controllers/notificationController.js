const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Get all notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);
    const total = await Notification.countDocuments();

    const notifications = await Notification.find()
      .populate('sentBy', 'name')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    res.status(200).json({
      success: true,
      notifications,
      pagination: { total, page: Number(page), pages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send notification
// @route   POST /api/notifications/send
// @access  Private
const sendNotification = async (req, res) => {
  try {
    const { title, message, type, target, targetUsers } = req.body;

    // Count how many users will receive it
    let sentCount = 0;
    if (target === 'all') {
      sentCount = await User.countDocuments({ status: 'active' });
    } else if (target === 'specific' && targetUsers) {
      sentCount = targetUsers.length;
    } else if (target === 'active') {
      sentCount = await User.countDocuments({ status: 'active' });
    }

    const notification = await Notification.create({
      title,
      message,
      type,
      target,
      targetUsers: target === 'specific' ? targetUsers : [],
      sentBy: req.admin._id,
      status: 'sent',
      sentCount,
    });

    // In production: integrate with FCM, Twilio, SendGrid etc.
    // For now, we just save the record

    res.status(201).json({
      success: true,
      message: `Notification sent to ${sentCount} users`,
      notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private
const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }
    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getNotifications, sendNotification, deleteNotification };
