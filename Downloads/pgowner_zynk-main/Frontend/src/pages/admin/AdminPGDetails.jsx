import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Calendar, Hash, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const AdminPGDetails = () => {
    const { pgId } = useParams();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchRequests = async () => {
        try {
            const res = await api.get(`/admin/pg/${pgId}/requests`);
            setRequests(res.data);
            setLoading(false);
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, [pgId]);

    const handleStatusChange = async (requestId, newStatus) => {
        try {
            await api.put(`/admin/request/${requestId}/status`, { status: newStatus });
            // Optimistic update or refetch
            setRequests(requests.map(req =>
                req._id === requestId ? { ...req, status: newStatus } : req
            ));
            // alert('Status updated successfully');
        } catch (err) {
            console.error(err);
            alert('Failed to update status');
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
        <div className="space-y-6">
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
            </button>

            <div>
                <h2 className="text-3xl font-bold text-gray-800">PG Cleaning Requests</h2>
                <p className="text-gray-500 mt-1">Manage requests and update statuses.</p>
            </div>

            {loading ? (
                <div className="text-center py-10">Loading requests...</div>
            ) : requests.length === 0 ? (
                <div className="bg-white p-10 rounded-xl shadow-sm border border-gray-200 text-center text-gray-500">
                    No cleaning requests found for this PG.
                </div>
            ) : (
                <div className="bg-white shadow-sm rounded-xl border border-gray-200 overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room No / Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Notes</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Price (₹)</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {requests.map((req) => (
                                <tr key={req._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            {format(new Date(req.date), 'MMM dd, yyyy')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            {req.roomNumber || <span className="text-gray-400 italic">See Notes</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                        <div className="flex items-start gap-2">
                                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <span className="truncate">{req.notes || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                                        ₹{req.priceAtTimeOfRequest || 0}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <select
                                            value={req.status}
                                            onChange={(e) => handleStatusChange(req._id, e.target.value)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border outline-none cursor-pointer appearance-none ${getStatusColor(req.status)}`}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="In Progress">In Progress</option>
                                            <option value="Completed">Completed</option>
                                        </select>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default AdminPGDetails;
