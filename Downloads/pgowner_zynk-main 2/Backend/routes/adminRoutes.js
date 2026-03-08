const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/authMiddleware');

// Middleware to check admin role
const checkAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Access denied. Admin only.' });
    }
    next();
};

router.get('/pgs', auth, checkAdmin, adminController.getAllPGs);
router.post('/set-price', auth, checkAdmin, adminController.setPrice);
router.get('/requests', auth, checkAdmin, adminController.getAllRequests);
router.get('/reports', auth, checkAdmin, adminController.getReports);
router.get('/pg/:pgId/requests', auth, checkAdmin, adminController.getRequestsByPG);
router.put('/request/:requestId/status', auth, checkAdmin, adminController.updateRequestStatus);
router.put('/request/:requestId/details', auth, checkAdmin, adminController.updateRequestDetails); // New Route

router.post('/pg/:pgId/requests', auth, checkAdmin, adminController.createRequestForPG);

module.exports = router;
