const Admin = require('../models/Admin');
const PGCompany = require('../models/PGCompany');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await Admin.findOne({ email });
        let role = 'admin';

        if (!user) {
            user = await PGCompany.findOne({ email });
            role = 'pg';
        }

        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.json({ token, role, user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.registerPG = async (req, res) => {
    let { name, email, password, address, contact, phone } = req.body;

    // Allow phone to be used as contact
    if (!contact && phone) {
        contact = phone;
    }

    // Validation
    if (!name || !email || !password || !address || !contact) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        let user = await PGCompany.findOne({ email });
        if (user) return res.status(409).json({ message: 'PG Company already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new PGCompany({
            name,
            email,
            password: hashedPassword,
            address,
            contact
        });

        await user.save();

        const token = jwt.sign({ id: user._id, role: 'pg' }, process.env.JWT_SECRET || 'secret', { expiresIn: '1d' });
        res.status(201).json({ token, role: 'pg', user: { id: user._id, name: user.name, email: user.email } });
    } catch (err) {
        console.error("Register PG Error:", err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};
