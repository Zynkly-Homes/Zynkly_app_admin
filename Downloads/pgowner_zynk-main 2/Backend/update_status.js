const mongoose = require('mongoose');
const CleaningRequest = require('./models/CleaningRequest');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/pg-dashboard')
    .then(async () => {
        console.log('Connected to DB');
        // PG ID from my previous run: 6975cff6fe5d622d6d5107f3
        const pgId = '6975cff6fe5d622d6d5107f3';
        const requests = await CleaningRequest.find({ pgId: pgId });
        if (requests.length > 0) {
            const reqToUpdate = requests[0];
            console.log('Updating request:', reqToUpdate._id);
            reqToUpdate.status = 'Completed';
            await reqToUpdate.save();
            console.log('Updated to Completed');
        } else {
            console.log('No requests found to update');
        }
        process.exit();
    })
    .catch(err => console.error(err));
