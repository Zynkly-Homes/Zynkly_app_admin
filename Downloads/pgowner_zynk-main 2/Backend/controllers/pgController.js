const CleaningRequest = require('../models/CleaningRequest');
const PGCompany = require('../models/PGCompany');
const mongoose = require('mongoose');

exports.createRequest = async (req, res) => {
    const { roomNumber, date, notes, pgName, pgContact, requesterName, name, address, cleanerNameId, cleaningTime, cleaningType } = req.body;
    try {
        const pg = await PGCompany.findById(req.user.id);
        if (!pg) return res.status(404).json({ message: 'PG not found' });

        const newRequest = new CleaningRequest({
            pgId: req.user.id,
            roomNumber: roomNumber || 'N/A', // Default if missing
            pgName: pgName || pg.name, // Use provided name or fallback to user name
            pgContact,
            name: name || requesterName,
            address,
            cleanerNameId,
            cleaningTime,
            cleaningType,
            date,
            notes,
            priceAtTimeOfRequest: pg.pricePerRoom, // Capture price at request time
            status: 'Pending'
        });

        await newRequest.save();
        res.json(newRequest);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getMyRequests = async (req, res) => {
    try {
        const objectId = new mongoose.Types.ObjectId(req.user.id);

        const requests = await CleaningRequest.find({ pgId: objectId }).sort({ date: -1 });
        res.json(requests);
    } catch (err) {
        console.error('Get My Requests Error:', err);
        res.status(500).json({ message: 'Server Error' });
    }
};

exports.getStats = async (req, res) => {
    try {
        const pgId = req.user.id;
        console.log('--- GET STATS DEBUG ---');
        console.log('User ID from Token:', pgId);

        const objectIdPgId = new mongoose.Types.ObjectId(pgId);

        const totalRequests = await CleaningRequest.countDocuments({ pgId: objectIdPgId });
        console.log('Total Requests Found:', totalRequests);

        const completedRequests = await CleaningRequest.countDocuments({ pgId: objectIdPgId, status: 'Completed' });
        console.log('Completed Requests Found:', completedRequests);

        // Calculate Bill for Completed Requests
        const billAggregation = await CleaningRequest.aggregate([
            { $match: { pgId: objectIdPgId, status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$priceAtTimeOfRequest' } } }
        ]);

        const currentBill = billAggregation.length > 0 ? billAggregation[0].total : 0;
        console.log('Current Bill:', currentBill);

        res.json({
            totalRequests,
            completedRequests,
            currentBill
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};
