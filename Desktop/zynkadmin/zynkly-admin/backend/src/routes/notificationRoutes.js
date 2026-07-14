const express = require('express');
const router = express.Router();
const { getNotifications, sendNotification, deleteNotification } = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getNotifications);
router.post('/send', protect, sendNotification);
router.delete('/:id', protect, deleteNotification);

module.exports = router;
