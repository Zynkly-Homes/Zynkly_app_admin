const express = require('express');
const router = express.Router();
const pgController = require('../controllers/pgController');
const auth = require('../middleware/authMiddleware');

router.post('/requests', auth, pgController.createRequest);
router.get('/requests', auth, pgController.getMyRequests);
router.get('/stats', auth, pgController.getStats);

module.exports = router;
