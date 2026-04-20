/**
 * Application-wide constants for Zynkly Admin.
 */

// Booking status values — DB stores PENDING (uppercase) as default
export const BOOKING_STATUS = {
  PENDING: 'PENDING',
  CONFIRMED: 'CONFIRMED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

// Labels map both upper and lower case (DB may have either)
export const BOOKING_STATUS_LABELS = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  // lowercase aliases (in case some rows were written lowercase)
  pending: 'Pending',
  confirmed: 'Confirmed',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

// Payment status values
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded',
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  paid: 'Paid',
  failed: 'Failed',
  refunded: 'Refunded',
};

// Admin roles
export const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
};

export const ADMIN_ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
};

// Star ratings
export const RATING_STARS = [1, 2, 3, 4, 5];

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Sidebar nav items — super_admin property gates visibility
export const NAV_ITEMS = [
  { path: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', superAdminOnly: false },
  { path: '/bookings', label: 'Bookings', icon: 'CalendarDays', superAdminOnly: false },
  { path: '/customers', label: 'Customers', icon: 'Users', superAdminOnly: false },
  { path: '/cleaners', label: 'Cleaners', icon: 'UserCheck', superAdminOnly: false },
  { path: '/reviews', label: 'Reviews', icon: 'Star', superAdminOnly: false },
  { path: '/revenue', label: 'Revenue', icon: 'TrendingUp', superAdminOnly: false },
  { path: '/support', label: 'Support', icon: 'Headphones', superAdminOnly: false },
  // Super admin only
  { path: '/services', label: 'Services', icon: 'Sparkles', superAdminOnly: true },
  { path: '/pincodes', label: 'Pincodes', icon: 'MapPin', superAdminOnly: true },
  { path: '/admins', label: 'Admins', icon: 'Shield', superAdminOnly: true },
];
