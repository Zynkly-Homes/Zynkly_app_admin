import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { ArrowLeft, Calendar, Hash, FileText, CheckCircle, Clock, AlertCircle, Plus, X, User, Phone } from 'lucide-react';
import { format } from 'date-fns';

const AdminPGDetails = () => {
    const { pgId } = useParams();
    const navigate = useNavigate();
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        roomNumber: '',
        contact: '',
        name: '',
        address: '',
        cleaningType: '',
        cleanerNameId: '',
        cleaningTime: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                roomNumber: formData.roomNumber,
                pgContact: formData.contact,
                name: formData.name,
                address: formData.address,
                cleanerNameId: formData.cleanerNameId,
                cleaningTime: formData.cleaningTime,
                cleaningType: formData.cleaningType,
                date: formData.date,
                notes: formData.notes
            };

            await api.post(`/admin/pg/${pgId}/requests`, payload);

            setShowModal(false);
            setFormData({
                roomNumber: '',
                contact: '',
                name: '',
                address: '',
                cleaningType: '',
                cleanerNameId: '',
                cleaningTime: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });

            fetchRequests();
            alert('Request submitted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to submit request');
        }
    };

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
            const status = err.response?.status;
            const msg = err.response?.data?.message || 'Unknown error';
            alert(`Failed to update price. Status: ${status}, Message: ${msg}`);
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Completed': return 'bg-green-100 text-green-700 border-green-200';
            case 'In Progress': return 'bg-blue-100 text-blue-700 border-blue-200';
            default: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    // Get PG Name from the first request if available (populated)
    const pgName = requests.length > 0 && requests[0].pgId?.name ? requests[0].pgId.name : 'Unknown PG';

    return (
        <div className="space-y-6">
            <button
                onClick={() => navigate('/admin/dashboard')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back to Dashboard
            </button>

            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800">{pgName} - Cleaning Requests</h2>
                    <p className="text-gray-500 mt-1">Manage requests and update statuses.</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-5 py-2.5 bg-green-600 text-white rounded-lg shadow-md hover:bg-green-700 hover:shadow-lg transition-all font-bold"
                >
                    <Plus className="w-5 h-5 mr-2" />
                    New Request
                </button>
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
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Time</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">PG Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Room No / Details</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Contact</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Cleaner</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Type</th>
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
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {req.cleaningTime || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {req.pgName || '-'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-700">
                                        <div className="flex items-center gap-2">
                                            <Hash className="w-4 h-4 text-gray-400" />
                                            {req.roomNumber || <span className="text-gray-400 italic">See Notes</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {req.name || req.requesterName || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {req.pgContact || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {req.cleanerNameId || '-'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                        {req.cleaningType || 'Regular'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600 max-w-xs">
                                        <div className="flex items-start gap-2">
                                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                                            <span className="truncate">{req.notes || '-'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
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

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="bg-gradient-to-r from-green-50 to-white px-8 py-6 border-b border-green-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">New Request for {pgName}</h3>
                                    <p className="text-green-600 text-sm font-medium">Fill in the details below</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            <div className="grid grid-cols-2 gap-5">
                                {/* Room Number */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <Hash className="w-4 h-4 mr-2 text-green-500" />
                                        Room No.
                                    </label>
                                    <input
                                        name="roomNumber"
                                        type="text"
                                        required
                                        value={formData.roomNumber}
                                        onChange={handleChange}
                                        placeholder="e.g. 101"
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                                {/* Date */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                        Date
                                    </label>
                                    <input
                                        name="date"
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-green-500" />
                                        Name
                                    </label>
                                    <input
                                        name="name"
                                        type="text"
                                        required
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="e.g. John Doe"
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                                {/* PG Address */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-green-500" />
                                        PG Address
                                    </label>
                                    <input
                                        name="address"
                                        type="text"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter full address"
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Cleaning Type */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-green-500" />
                                        Cleaning Type
                                    </label>
                                    <input
                                        name="cleaningType"
                                        type="text"
                                        value={formData.cleaningType}
                                        onChange={handleChange}
                                        placeholder="e.g. Regular, Deep Cleaning"
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                                {/* Cleaner Name / ID */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <User className="w-4 h-4 mr-2 text-green-500" />
                                        Cleaner Name / ID
                                    </label>
                                    <input
                                        name="cleanerNameId"
                                        type="text"
                                        value={formData.cleanerNameId}
                                        onChange={handleChange}
                                        placeholder="e.g. CleanPro or ID123"
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                {/* Cleaning Time */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <Calendar className="w-4 h-4 mr-2 text-green-500" />
                                        Cleaning Time
                                    </label>
                                    <input
                                        name="cleaningTime"
                                        type="time"
                                        value={formData.cleaningTime}
                                        onChange={handleChange}
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                                {/* Contact Details */}
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                        <Phone className="w-4 h-4 mr-2 text-green-500" />
                                        Contact Details <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                    </label>
                                    <input
                                        name="contact"
                                        type="text"
                                        value={formData.contact}
                                        onChange={handleChange}
                                        placeholder="Mobile Number"
                                        className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-green-500" />
                                    Notes <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                                </label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleChange}
                                    placeholder="Any specific instructions..."
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all resize-none min-h-[80px]"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                className="w-full py-4 rounded-xl bg-green-600 text-white font-bold text-lg shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-xl transition-all transform hover:-translate-y-0.5"
                            >
                                Submit Request
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPGDetails;
