import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
    const [pgs, setPgs] = useState([]);
    const [editPriceId, setEditPriceId] = useState(null);
    const [newPrice, setNewPrice] = useState('');

    const fetchPgs = async () => {
        try {
            const res = await api.get('/admin/pgs');
            setPgs(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchPgs();
    }, []);

    const handleUpdatePrice = async (pgId) => {
        try {
            await api.post('/admin/set-price', { pgId, price: newPrice });
            setEditPriceId(null);
            fetchPgs();
            alert('Price updated');
        } catch (err) {
            console.error(err);
            alert('Failed to update price');
        }
    };

    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-800 mb-8">PG Companies</h2>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price/Room (₹)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {pgs.map((pg) => (
                            <tr key={pg._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">
                                    <Link to={`/admin/pg/${pg._id}`} className="hover:underline">
                                        {pg.name}
                                    </Link>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pg.email}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pg.address}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{pg.contact}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {editPriceId === pg._id ? (
                                        <div className="flex items-center">
                                            <span className="mr-1">₹</span>
                                            <input
                                                type="number"
                                                className="border rounded p-1 w-20"
                                                value={newPrice}
                                                onChange={(e) => setNewPrice(e.target.value)}
                                            />
                                        </div>
                                    ) : (
                                        `₹${pg.pricePerRoom || 0}`
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    {editPriceId === pg._id ? (
                                        <>
                                            <button onClick={() => handleUpdatePrice(pg._id)} className="text-green-600 hover:text-green-900 mr-2">Save</button>
                                            <button onClick={() => setEditPriceId(null)} className="text-gray-600 hover:text-gray-900">Cancel</button>
                                        </>
                                    ) : (
                                        <button onClick={() => { setEditPriceId(pg._id); setNewPrice(pg.pricePerRoom); }} className="text-indigo-600 hover:text-indigo-900">
                                            Edit Price
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminDashboard;
