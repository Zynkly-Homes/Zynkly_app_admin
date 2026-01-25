import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, Users, FileText, BarChart2, LogOut } from 'lucide-react';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-gray-100">
            <div className="w-64 bg-gray-900 shadow-md text-white">
                <div className="p-6 border-b border-gray-800">
                    <h1 className="text-2xl font-bold">Clean Admin</h1>
                </div>
                <nav className="mt-6">
                    <Link to="/admin/dashboard" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">
                        <Users className="w-5 h-5 mr-3" />
                        PG Companies
                    </Link>
                    <Link to="/admin/requests" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">
                        <FileText className="w-5 h-5 mr-3" />
                        All Requests
                    </Link>
                    <Link to="/admin/reports" className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white">
                        <BarChart2 className="w-5 h-5 mr-3" />
                        Reports
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-6 border-t border-gray-800">
                    <button onClick={handleLogout} className="flex items-center text-gray-300 hover:text-red-400">
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default AdminLayout;
