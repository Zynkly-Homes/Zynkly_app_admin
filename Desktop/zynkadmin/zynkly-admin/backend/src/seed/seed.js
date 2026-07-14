require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const Admin = require('../models/Admin');
const User = require('../models/User');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');

const connectDB = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB for seeding');
};

const seed = async () => {
  await connectDB();

  // Clear existing data
  await Promise.all([
    Admin.deleteMany(),
    User.deleteMany(),
    Service.deleteMany(),
    Booking.deleteMany(),
    Payment.deleteMany(),
    Notification.deleteMany(),
    Settings.deleteMany(),
  ]);
  console.log('🗑️  Cleared existing data');

  // --- Admins ---
  const admins = await Admin.create([
    {
      name: 'Arjun Sharma',
      email: 'superadmin@zynkly.com',
      password: 'Admin@123',
      role: 'super_admin',
      phone: '+91 9876543210',
      isActive: true,
    },
    {
      name: 'Priya Mehta',
      email: 'admin@zynkly.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 9876543211',
      assignedState: 'Maharashtra',
      isActive: true,
    },
    {
      name: 'Rahul Verma',
      email: 'manager@zynkly.com',
      password: 'Admin@123',
      role: 'manager',
      phone: '+91 9876543212',
      assignedState: 'Delhi',
      isActive: true,
    },
  ]);
  console.log('👤 Admins seeded');

  // --- Users ---
  const users = await User.create([
    { name: 'Amit Kumar', email: 'amit@example.com', phone: '+91 9111111111', city: 'Mumbai', state: 'Maharashtra', pincode: '400001', status: 'active', totalBookings: 5, totalSpent: 4500 },
    { name: 'Sneha Patel', email: 'sneha@example.com', phone: '+91 9222222222', city: 'Pune', state: 'Maharashtra', pincode: '411001', status: 'active', totalBookings: 3, totalSpent: 2700 },
    { name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 9333333333', city: 'Delhi', state: 'Delhi', pincode: '110001', status: 'active', totalBookings: 8, totalSpent: 7200 },
    { name: 'Kavya Nair', email: 'kavya@example.com', phone: '+91 9444444444', city: 'Bangalore', state: 'Karnataka', pincode: '560001', status: 'active', totalBookings: 2, totalSpent: 1800 },
    { name: 'Rohit Gupta', email: 'rohit@example.com', phone: '+91 9555555555', city: 'Hyderabad', state: 'Telangana', pincode: '500001', status: 'blocked', totalBookings: 1, totalSpent: 900 },
    { name: 'Ananya Reddy', email: 'ananya@example.com', phone: '+91 9666666666', city: 'Chennai', state: 'Tamil Nadu', pincode: '600001', status: 'active', totalBookings: 4, totalSpent: 3600 },
    { name: 'Suresh Joshi', email: 'suresh@example.com', phone: '+91 9777777777', city: 'Jaipur', state: 'Rajasthan', pincode: '302001', status: 'active', totalBookings: 6, totalSpent: 5400 },
    { name: 'Meera Iyer', email: 'meera@example.com', phone: '+91 9888888888', city: 'Kolkata', state: 'West Bengal', pincode: '700001', status: 'active', totalBookings: 2, totalSpent: 1800 },
    { name: 'Deepak Yadav', email: 'deepak@example.com', phone: '+91 9999999991', city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001', status: 'inactive', totalBookings: 0, totalSpent: 0 },
    { name: 'Pooja Sharma', email: 'pooja@example.com', phone: '+91 9999999992', city: 'Ahmedabad', state: 'Gujarat', pincode: '380001', status: 'active', totalBookings: 7, totalSpent: 6300 },
  ]);
  console.log('👥 Users seeded');

  // --- Services ---
  const services = await Service.create([
    {
      name: 'Standard Home Cleaning',
      description: 'Complete home cleaning including all rooms, kitchen, and bathrooms.',
      category: 'home',
      price: 799,
      duration: '2-3 hours',
      includes: ['Dusting', 'Mopping', 'Bathroom cleaning', 'Kitchen cleaning', 'Vacuuming'],
      isActive: true,
      isPopular: true,
      totalBookings: 120,
    },
    {
      name: 'Deep Clean Package',
      description: 'Intensive deep cleaning for a thorough top-to-bottom clean.',
      category: 'deep_clean',
      price: 1499,
      duration: '4-6 hours',
      includes: ['All standard cleaning', 'Inside cabinets', 'Appliance cleaning', 'Window cleaning', 'Grout scrubbing'],
      isActive: true,
      isPopular: true,
      totalBookings: 85,
    },
    {
      name: 'Office Cleaning',
      description: 'Professional office and workspace cleaning service.',
      category: 'office',
      price: 1299,
      duration: '3-4 hours',
      includes: ['Desk cleaning', 'Floor mopping', 'Restroom sanitization', 'Trash removal', 'Common area cleaning'],
      isActive: true,
      isPopular: false,
      totalBookings: 45,
    },
    {
      name: 'Move-In/Move-Out Cleaning',
      description: 'Thorough cleaning for moving in or out of a property.',
      category: 'move_in_out',
      price: 1999,
      duration: '5-7 hours',
      includes: ['Full deep clean', 'Inside all cabinets', 'Appliance cleaning', 'Wall wiping', 'Balcony cleaning'],
      isActive: true,
      isPopular: false,
      totalBookings: 30,
    },
    {
      name: 'Post-Construction Cleaning',
      description: 'Specialized cleaning after renovation or construction work.',
      category: 'post_construction',
      price: 2499,
      duration: '6-8 hours',
      includes: ['Dust removal', 'Paint spot removal', 'Floor polishing', 'Window cleaning', 'Debris removal'],
      isActive: true,
      isPopular: false,
      totalBookings: 18,
    },
    {
      name: 'Bathroom Deep Clean',
      description: 'Focused deep cleaning for bathrooms and toilets.',
      category: 'home',
      price: 499,
      duration: '1-2 hours',
      includes: ['Tile scrubbing', 'Toilet sanitization', 'Mirror cleaning', 'Drain cleaning'],
      isActive: false,
      isPopular: false,
      totalBookings: 22,
    },
  ]);
  console.log('🧹 Services seeded');

  // --- Bookings ---
  const statuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'];
  const payStatuses = ['pending', 'paid', 'paid', 'paid', 'refunded'];
  const times = ['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'];
  const workers = ['Ramesh Kumar', 'Sunil Yadav', 'Pradeep Singh', 'Mohan Lal', 'Ravi Shankar'];
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad'];
  const states = ['Maharashtra', 'Delhi', 'Karnataka', 'Maharashtra', 'Telangana'];

  const bookings = [];
  for (let i = 0; i < 20; i++) {
    const statusIdx = i % 5;
    const userIdx = i % users.length;
    const serviceIdx = i % services.length;
    const cityIdx = i % cities.length;

    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() - Math.floor(Math.random() * 60));

    bookings.push({
      user: users[userIdx]._id,
      service: services[serviceIdx]._id,
      status: statuses[statusIdx],
      scheduledDate,
      scheduledTime: times[i % times.length],
      address: {
        street: `${100 + i} Main Street`,
        city: cities[cityIdx],
        state: states[cityIdx],
        pincode: `4000${String(i).padStart(2, '0')}`,
      },
      amount: services[serviceIdx].price,
      paymentStatus: payStatuses[statusIdx],
      assignedWorker: statusIdx > 0 ? workers[i % workers.length] : '',
      notes: i % 3 === 0 ? 'Please bring extra cleaning supplies.' : '',
    });
  }

  const createdBookings = await Booking.create(bookings);
  console.log('📋 Bookings seeded');

  // --- Payments ---
  const payments = [];
  const methods = ['upi', 'card', 'netbanking', 'cash', 'wallet'];

  for (let i = 0; i < createdBookings.length; i++) {
    const booking = createdBookings[i];
    if (booking.paymentStatus !== 'pending') {
      payments.push({
        booking: booking._id,
        user: booking.user,
        amount: booking.amount,
        method: methods[i % methods.length],
        status: booking.paymentStatus === 'paid' ? 'success' : booking.paymentStatus === 'refunded' ? 'refunded' : 'pending',
        transactionId: `TXN${Date.now()}${i}`,
      });
    }
  }

  await Payment.create(payments);
  console.log('💳 Payments seeded');

  // --- Notifications ---
  await Notification.create([
    {
      title: 'Welcome to Zynkly!',
      message: 'Thank you for joining Zynkly. Book your first cleaning service today!',
      type: 'in_app',
      target: 'all',
      sentBy: admins[0]._id,
      status: 'sent',
      sentCount: users.length,
    },
    {
      title: 'Special Offer - 20% Off',
      message: 'Get 20% off on all deep cleaning services this weekend. Use code CLEAN20.',
      type: 'push',
      target: 'active',
      sentBy: admins[1]._id,
      status: 'sent',
      sentCount: 8,
    },
    {
      title: 'Service Update',
      message: 'We have added new post-construction cleaning services in your area.',
      type: 'email',
      target: 'all',
      sentBy: admins[0]._id,
      status: 'sent',
      sentCount: users.length,
    },
  ]);
  console.log('🔔 Notifications seeded');

  // --- Settings ---
  await Settings.create({
    appName: 'Zynkly',
    contactEmail: 'support@zynkly.com',
    contactPhone: '+91 9876543210',
    address: '123 Business Park, Andheri East, Mumbai - 400069',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    maintenanceMode: false,
    allowRegistrations: true,
  });
  console.log('⚙️  Settings seeded');

  console.log('\n✅ Seed completed successfully!');
  console.log('\n🔑 Login credentials:');
  console.log('   Super Admin: superadmin@zynkly.com / Admin@123');
  console.log('   Admin:       admin@zynkly.com / Admin@123');
  console.log('   Manager:     manager@zynkly.com / Admin@123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
