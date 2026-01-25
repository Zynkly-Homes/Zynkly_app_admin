import React from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import { Home, List, LogOut } from 'lucide-react';

const PGLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-green-50">
            {/* Sidebar */}
            <div className="w-64 bg-white shadow-xl border-r border-green-100">
                <div className="p-6 flex items-center justify-center border-b border-green-100">
                    <div className="text-2xl font-bold text-green-700 tracking-wide flex items-center gap-2">
                        <span className="w-8 h-8 bg-green-600 text-white rounded-lg flex items-center justify-center text-lg">Z</span>
                        Zynkly
                    </div>
                </div>
                <nav className="mt-6 space-y-2 px-4">
                    <Link to="/dashboard" className="flex items-center px-4 py-3 text-gray-600 rounded-xl hover:bg-green-50 hover:text-green-700 transition-all duration-200 group">
                        <Home className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Dashboard</span>
                    </Link>
                    <Link to="/dashboard/requests" className="flex items-center px-4 py-3 text-gray-600 rounded-xl hover:bg-green-50 hover:text-green-700 transition-all duration-200 group">
                        <List className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                        <span className="font-medium">Requests</span>
                    </Link>
                </nav>
                <div className="absolute bottom-0 w-64 p-6 border-t">
                    <button onClick={handleLogout} className="flex items-center text-gray-700 hover:text-red-600">
                        <LogOut className="w-5 h-5 mr-3" />
                        Logout
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-auto">
                <div className="p-8">
                    <Outlet />
                </div>
            </div>
        </div>
    );
};

export default PGLayout;
