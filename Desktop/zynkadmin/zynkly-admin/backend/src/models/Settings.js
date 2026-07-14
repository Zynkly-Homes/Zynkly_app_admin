const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    appName: {
      type: String,
      default: 'Zynkly',
    },
    appLogo: {
      type: String,
      default: '',
    },
    contactEmail: {
      type: String,
      default: 'support@zynkly.com',
    },
    contactPhone: {
      type: String,
      default: '+91 9999999999',
    },
    address: {
      type: String,
      default: '',
    },
    currency: {
      type: String,
      default: 'INR',
    },
    timezone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    maintenanceMode: {
      type: Boolean,
      default: false,
    },
    allowRegistrations: {
      type: Boolean,
      default: true,
    },
    smtpHost: {
      type: String,
      default: '',
    },
    smtpPort: {
      type: String,
      default: '587',
    },
    smtpUser: {
      type: String,
      default: '',
    },
    smtpPass: {
      type: String,
      default: '',
      select: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
