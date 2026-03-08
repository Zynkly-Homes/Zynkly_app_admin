import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';

const AdminRequests = () => {
    const [requests, setRequests] = useState([]);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/admin/requests');
                setRequests(res.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchRequests();
    }, []);

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await api.put(`/admin/request/${requestId}/status`, { status: newStatus });
            setRequests(requests.map(req =>
                req._id === requestId ? { ...req, status: newStatus } : req
            ));
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
        }
    };

    const handlePriceUpdate = async (requestId, newPrice) => {
        try {
            await api.put(`/admin/request/${requestId}/details`, { priceAtTimeOfRequest: newPrice });
            setRequests(requests.map(req =>
                req._id === requestId ? { ...req, priceAtTimeOfRequest: newPrice } : req
            ));
        } catch (err) {
            console.error(err);
            alert('Failed to update price');
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">All Cleaning Requests</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PG Company</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Requester</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price (Snapshot)</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {requests.map((req) => (
                            <tr key={req._id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{req.pgId?.name || 'Unknown'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(req.date), 'MMM dd, yyyy')}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.requesterName || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.pgContact || '-'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.cleaningType || 'Regular'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.roomNumber}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <select
                                        value={req.status}
                                        onChange={(e) => handleStatusChange(req._id, e.target.value)}
                                        className={`px-3 py-1 rounded-full text-xs font-semibold border outline-none cursor-pointer appearance-none ${getStatusColor(req.status)}`}
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Completed">Completed</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <div className="flex items-center">
                                        <span className="mr-1">₹</span>
                                        <input
                                            type="number"
                                            className="w-20 px-2 py-1 border rounded text-sm font-bold resize-none"
                                            defaultValue={req.priceAtTimeOfRequest || 0}
                                            onBlur={(e) => handlePriceUpdate(req._id, e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    handlePriceUpdate(req._id, e.currentTarget.value);
                                                    e.currentTarget.blur();
                                                }
                                            }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminRequests;
