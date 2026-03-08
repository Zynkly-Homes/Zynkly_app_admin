const mongoose = require('mongoose');
const PGCompany = require('./models/PGCompany');
const CleaningRequest = require('./models/CleaningRequest');
require('dotenv').config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('--- DB DUMP ---');

        const pgs = await PGCompany.find();
        console.log(`Found ${pgs.length} PGs:`);
        pgs.forEach(pg => {
            console.log(`PG: "${pg.name}" | ID: ${pg._id} | Email: ${pg.email}`);
        });

        const requests = await CleaningRequest.find();
        console.log(`\nFound ${requests.length} Requests:`);
        requests.forEach(req => {
            console.log(`Req ID: ${req._id} | PG ID: ${req.pgId} | Status: ${req.status} | Price: ${req.priceAtTimeOfRequest}`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

run();
