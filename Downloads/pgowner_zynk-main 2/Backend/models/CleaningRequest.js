const mongoose = require('mongoose');

const CleaningRequestSchema = new mongoose.Schema({
    pgId: { type: mongoose.Schema.Types.ObjectId, ref: 'PGCompany', required: true },
    name: { type: String }, // Name of the person requesting (e.g. Student Name)
    address: { type: String }, // PG Address
    cleanerNameId: { type: String }, // Cleaner Name / Cleaner ID
    cleaningTime: { type: String }, // Cleaning Time
    cleaningType: { type: String, default: 'Regular' }, // Type of cleaning (Regular, Deep, etc.)
    roomNumber: { type: String }, // Made optional to support new form flow if needed
    pgName: { type: String },
    pgContact: { type: String },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    notes: { type: String },
    priceAtTimeOfRequest: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('CleaningRequest', CleaningRequestSchema);
