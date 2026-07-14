const express = require('express');
const router = express.Router();
const {
  getUsers, getUser, createUser, updateUser, toggleUserStatus, deleteUser,
} = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

router.get('/', protect, getUsers);
router.post('/', protect, createUser);
router.get('/:id', protect, getUser);
router.put('/:id', protect, updateUser);
router.put('/:id/toggle-status', protect, toggleUserStatus);
router.delete('/:id', protect, authorize('super_admin'), deleteUser);

module.exports = router;
