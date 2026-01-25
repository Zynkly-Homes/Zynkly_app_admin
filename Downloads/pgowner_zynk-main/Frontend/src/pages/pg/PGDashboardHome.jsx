import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Plus, CheckCircle, Calendar, Phone, Hash, FileText, User, X } from 'lucide-react';
import { format } from 'date-fns';

const PGDashboardHome = () => {
    const [stats, setStats] = useState({ totalRequests: 0, completedRequests: 0, currentBill: 0 });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        pgName: '',
        roomNumber: '',
        contact: '',
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const statsRes = await api.get('/pg/stats');
            setStats(statsRes.data);

            // Auto-fill PG Name
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.name) {
                setFormData(prev => ({ ...prev, pgName: user.name }));
            }
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const payload = {
                pgName: formData.pgName,
                roomNumber: formData.roomNumber,
                pgContact: formData.contact,
                date: formData.date,
                notes: formData.notes
            };

            await api.post('/pg/requests', payload);

            setShowModal(false);
            setFormData(prev => ({
                ...prev,
                roomNumber: '',
                contact: '',
                date: new Date().toISOString().split('T')[0],
                notes: ''
            }));

            fetchData();
            alert('Request submitted successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to submit request');
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;

    return (
        <div className="space-y-10 pb-10">
            {/* 1. Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-800 tracking-tight">
                        {formData.pgName ? `${formData.pgName}` : 'Zynkly Dashboard'}
                    </h2>
                    <p className="text-gray-500 mt-1">Manage your cleaning requests efficiently.</p>
                </div>
                <button onClick={fetchData} className="text-sm text-green-600 hover:text-green-800 underline">
                    Refresh Data
                </button>
            </div>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg border border-red-200">
                    {error}
                </div>
            )}

            {/* 2. Top Dashboard Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50 hover:shadow-md transition-shadow">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider text-green-700">Total Requests</h3>
                    <p className="text-4xl font-extrabold text-gray-800 mt-3">{stats.totalRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50 hover:shadow-md transition-shadow">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider text-green-700">Completed Cleanings</h3>
                    <p className="text-4xl font-extrabold text-green-600 mt-3">{stats.completedRequests}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-green-50 hover:shadow-md transition-shadow">
                    <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider text-green-700">Current Bill</h3>
                    <p className="text-4xl font-extrabold text-green-800 mt-3">₹{stats.currentBill}</p>
                </div>
            </div>

            {/* 3. Center Button for New Request */}
            <div className="flex justify-center py-8">
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center px-10 py-5 bg-green-600 text-white rounded-full shadow-lg shadow-green-200 hover:bg-green-700 hover:shadow-xl hover:scale-105 transition-all duration-300 text-xl font-bold"
                >
                    <Plus className="w-6 h-6 mr-3" />
                    New Cleaning Request
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-all">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        {/* Modal Header */}
                        <div className="bg-gradient-to-r from-green-50 to-white px-8 py-6 border-b border-green-100 flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
                                    <Plus className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">New Request</h3>
                                    <p className="text-green-600 text-sm font-medium">Fill in the details below</p>
                                </div>
                            </div>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="p-8 space-y-5">
                            {/* PG Name */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5 flex items-center">
                                    <User className="w-4 h-4 mr-2 text-green-500" />
                                    PG Name
                                </label>
                                <input
                                    name="pgName"
                                    type="text"
                                    required
                                    value={formData.pgName}
                                    onChange={handleChange}
                                    placeholder="Enter PG Name"
                                    className="w-full px-5 py-3 rounded-xl border border-gray-200 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-4 focus:ring-green-50 outline-none transition-all"
                                />
                            </div>

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

                            {/* Notes */}
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

export default PGDashboardHome;
