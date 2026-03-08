const mongoose = require('mongoose');

const PGCompanySchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    address: { type: String, required: true },
    contact: { type: String, required: true },
    pricePerRoom: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('PGCompany', PGCompanySchema);
