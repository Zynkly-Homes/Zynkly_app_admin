import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const AdminReports = () => {
    const [stats, setStats] = useState(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/admin/reports');
                setStats(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchStats();
    }, []);

    if (!stats) return <div>Loading...</div>;

    // Transform statusStats for chart
    const data = stats.statusStats.map(s => ({ name: s._id, count: s.count }));

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Reports & Analytics</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 font-medium">Total PG Companies</h3>
                    <p className="text-4xl font-bold text-gray-800 mt-2">{stats.totalPGs}</p>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <h3 className="text-gray-500 font-medium">Total Requests</h3>
                    <p className="text-4xl font-bold text-indigo-600 mt-2">{stats.totalRequests}</p>
                </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 h-96">
                <h3 className="text-lg font-bold mb-4">Request Status Distribution</h3>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="count" fill="#4f46e5" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default AdminReports;
