const mongoose = require('mongoose');
const PGCompany = require('./models/PGCompany');
const CleaningRequest = require('./models/CleaningRequest');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Create Mock PG
        const pg = new PGCompany({
            name: 'Test PG',
            email: `testpg_${Date.now()}@example.com`,
            password: 'password',
            contact: '1234567890',
            address: '123 Test St',
            pricePerRoom: 100
        });
        await pg.save();
        console.log('PG Created:', pg._id);

        // 2. Create Request (Pending)
        const request = new CleaningRequest({
            pgId: pg._id,
            roomNumber: '101',
            date: new Date(),
            priceAtTimeOfRequest: pg.pricePerRoom,
            status: 'Pending'
        });
        await request.save();
        console.log('Request Created:', request._id, 'Status:', request.status);

        // 3. Admin updates status to 'Completed'
        const reqToUpdate = await CleaningRequest.findById(request._id);
        reqToUpdate.status = 'Completed';
        await reqToUpdate.save();
        console.log('Request Updated to Completed');

        // 4. Get Stats (Simulate pgController logic)
        const pgId = pg._id.toString(); // Simulator req.user.id (string)

        console.log('Querying stats for PG ID (String):', pgId);

        const totalRequests = await CleaningRequest.countDocuments({ pgId: pgId });
        const completedRequests = await CleaningRequest.countDocuments({ pgId: pgId, status: 'Completed' });

        const billAggregation = await CleaningRequest.aggregate([
            { $match: { pgId: new mongoose.Types.ObjectId(pgId), status: 'Completed' } },
            { $group: { _id: null, total: { $sum: '$priceAtTimeOfRequest' } } }
        ]);
        const currentBill = billAggregation.length > 0 ? billAggregation[0].total : 0;

        console.log('--- STATS ---');
        console.log('Total Requests:', totalRequests);
        console.log('Completed Requests:', completedRequests);
        console.log('Current Bill:', currentBill);

        if (totalRequests === 0 || completedRequests === 0 || currentBill === 0) {
            console.log('FAIL: Some stats are zero!');
        } else {
            console.log('PASS: Stats reflected correctly.');
        }

        await PGCompany.deleteOne({ _id: pg._id });
        await CleaningRequest.deleteOne({ _id: request._id });
        console.log('Cleanup done');
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
