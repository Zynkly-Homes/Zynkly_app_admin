const mongoose = require('mongoose');

const CleaningRequestSchema = new mongoose.Schema({
    pgId: { type: mongoose.Schema.Types.ObjectId, ref: 'PGCompany', required: true },
    roomNumber: { type: String }, // Made optional to support new form flow if needed
    pgName: { type: String },
    pgContact: { type: String },
    date: { type: Date, required: true },
    status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    notes: { type: String },
    priceAtTimeOfRequest: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('CleaningRequest', CleaningRequestSchema);
