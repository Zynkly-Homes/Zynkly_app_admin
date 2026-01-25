import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { format } from 'date-fns';

const PGRequests = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRequests = async () => {
            try {
                const res = await api.get('/pg/requests');
                setRequests(res.data);
                setLoading(false);
            } catch (err) {
                console.error(err);
                setLoading(false);
            }
        };
        fetchRequests();
    }, []);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'text-green-600 bg-green-100';
            case 'In Progress': return 'text-blue-600 bg-blue-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">Request History</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Room</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Notes</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">Loading...</td></tr>
                        ) : requests.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-4 text-center">No requests found.</td></tr>
                        ) : (
                            requests.map((req) => (
                                <tr key={req._id}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{format(new Date(req.date), 'MMM dd, yyyy')}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.roomNumber}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(req.status)}`}>
                                            {req.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">₹{req.priceAtTimeOfRequest || 0}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{req.notes || '-'}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default PGRequests;
