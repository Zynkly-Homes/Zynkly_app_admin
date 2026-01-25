import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import RegisterPG from './pages/RegisterPG';

import PGLayout from './layouts/PGLayout';
import PGDashboardHome from './pages/pg/PGDashboardHome';
import PGRequests from './pages/pg/PGRequests';

import AdminLayout from './layouts/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminRequests from './pages/admin/AdminRequests';
import AdminReports from './pages/admin/AdminReports';
import AdminPGDetails from './pages/admin/AdminPGDetails';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<RegisterPG />} />

        {/* Admin Flow */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="pg/:pgId" element={<AdminPGDetails />} />
        </Route>

        {/* PG Flow */}
        <Route path="/dashboard" element={<PGLayout />}>
          <Route index element={<PGDashboardHome />} />
          <Route path="requests" element={<PGRequests />} />
        </Route>

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
