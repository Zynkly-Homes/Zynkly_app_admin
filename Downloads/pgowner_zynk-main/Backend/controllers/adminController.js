const Admin = require('../models/Admin');
const PGCompany = require('../models/PGCompany');
const CleaningRequest = require('../models/CleaningRequest');

exports.getAllPGs = async (req, res) => {
    try {
        const pgs = await PGCompany.find().select('-password');
        // TODO: Aggregate actual stats per PG if needed here or separate endpoint
        // For now, return basic PG info
        res.json(pgs);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.setPrice = async (req, res) => {
    const { pgId, price } = req.body;
    try {
        const pg = await PGCompany.findById(pgId);
        if (!pg) return res.status(404).json({ message: 'PG not found' });

        pg.pricePerRoom = price;
        await pg.save();
        res.json(pg);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getAllRequests = async (req, res) => {
    try {
        const requests = await CleaningRequest.find()
            .populate('pgId', 'name email')
            .sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getReports = async (req, res) => {
    // Basic aggregation
    try {
        const totalPGs = await PGCompany.countDocuments();
        const totalRequests = await CleaningRequest.countDocuments();

        // Example: Requests per status
        const statusStats = await CleaningRequest.aggregate([
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);

        res.json({
            totalPGs,
            totalRequests,
            statusStats
        });
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// New: Get Requests for a specific PG
exports.getRequestsByPG = async (req, res) => {
    try {
        const requests = await CleaningRequest.find({ pgId: req.params.pgId }).sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// New: Update Request Status
exports.updateRequestStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const request = await CleaningRequest.findById(req.params.requestId);
        if (!request) return res.status(404).json({ message: 'Request not found' });

        request.status = status;
        await request.save();
        res.json(request);
    } catch (err) {
        res.status(500).json({ message: 'Server Error' });
    }
};
