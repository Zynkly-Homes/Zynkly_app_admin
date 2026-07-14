const express = require('express');
const router = express.Router();
const {
  getBookings, getBooking, updateBookingStatus, updateBooking, deleteBooking,
} = require('../controllers/bookingController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getBookings);
router.get('/:id', protect, getBooking);
router.put('/:id/status', protect, updateBookingStatus);
router.put('/:id', protect, updateBooking);
router.delete('/:id', protect, deleteBooking);

module.exports = router;
