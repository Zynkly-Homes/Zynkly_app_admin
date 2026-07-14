const express = require('express');
const router = express.Router();
const {
  getServices, getService, createService, updateService, toggleService, deleteService,
} = require('../controllers/serviceController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', protect, getServices);
router.post('/', protect, upload.single('image'), createService);
router.get('/:id', protect, getService);
router.put('/:id', protect, upload.single('image'), updateService);
router.put('/:id/toggle', protect, toggleService);
router.delete('/:id', protect, deleteService);

module.exports = router;
