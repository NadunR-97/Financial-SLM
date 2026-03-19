import { useState, useEffect } from "react";
import axios from "axios";

export default function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // Form State
    const [formData, setFormData] = useState({
        username: "", email: "", password: "", full_name: "",
        role: "Credit_Analyst", department: "Retail Banking",
        branch_code: "HQ", approval_limit: 0
    });

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.get("http://127.0.0.1:8000/admin/users", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setUsers(res.data);
        } catch (err) {
            alert("Error fetching users: " + (err.response?.data?.detail || err.message));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === "approval_limit" ? Number(value) : value
        }));
    };

    const openCreateModal = () => {
        setEditingUserId(null);
        setFormData({
            username: "", email: "", password: "", full_name: "",
            role: "Credit_Analyst", department: "Retail Banking",
            branch_code: "HQ", approval_limit: 0
        });
        setIsModalOpen(true);
    };

    const openEditModal = (user) => {
        setEditingUserId(user.id);
        setFormData({
            username: user.username, // Read-only usually, but we populate it
            email: user.email,
            password: "", // Leave blank unless changing
            full_name: user.full_name,
            role: user.role,
            department: user.department,
            branch_code: user.branch_code,
            approval_limit: user.approval_limit
        });
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        const headers = { "Authorization": `Bearer ${token}` };

        try {
            if (editingUserId) {
                // Update user
                const payload = { ...formData };
                if (!payload.password) delete payload.password; // Dont update password if blank
                delete payload.username; // Dont update username

                await axios.put(`http://127.0.0.1:8000/admin/users/${editingUserId}`, payload, { headers });
            } else {
                // Create user
                await axios.post("http://127.0.0.1:8000/admin/users", formData, { headers });
            }
            setIsModalOpen(false);
            fetchUsers();
        } catch (err) {
            alert("Error saving user: " + (err.response?.data?.detail || err.message));
        }
    };

    const handleDelete = async (id, username) => {
        if (username === "admin") return alert("Cannot delete root admin.");
        if (!window.confirm(`Are you sure you want to delete ${username}?`)) return;

        try {
            const token = localStorage.getItem("token");
            await axios.delete(`http://127.0.0.1:8000/admin/users/${id}`, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            fetchUsers();
        } catch (err) {
            alert("Error deleting user: " + (err.response?.data?.detail || err.message));
        }
    };

    return (
        <div className="flex flex-col h-full p-8 bg-gray-900 text-white selection:bg-blue-500 relative">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-white">
                        User <span className="text-blue-500">Management</span>
                    </h1>
                    <p className="text-gray-400 mt-1">Administer roles, limits, and system access.</p>
                </div>
                <button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold shadow-lg transition"
                >
                    + Add New User
                </button>
            </div>

            <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-2xl">
                {loading ? (
                    <div className="p-12 flex justify-center"><div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full"></div></div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-gray-300">
                            <thead className="bg-gray-900/50 text-xs uppercase text-gray-400 border-b border-gray-700">
                                <tr>
                                    <th className="px-6 py-4">User</th>
                                    <th className="px-6 py-4">Role</th>
                                    <th className="px-6 py-4">Branch</th>
                                    <th className="px-6 py-4">Approval Limit</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700">
                                {users.map((u) => (
                                    <tr key={u.id} className="hover:bg-gray-700/50 transition">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-white">{u.full_name || u.username}</div>
                                            <div className="text-xs text-gray-500">{u.email}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${u.role === 'admin' ? 'bg-red-500/20 text-red-400 border border-red-500/50' : 'bg-blue-500/20 text-blue-400 border border-blue-500/50'}`}>
                                                {u.role.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-400">{u.branch_code}</td>
                                        <td className="px-6 py-4 font-mono text-green-400">
                                            LKR {u.approval_limit.toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button onClick={() => openEditModal(u)} className="text-blue-400 hover:text-blue-300 mr-4 font-bold">Edit</button>
                                            <button onClick={() => handleDelete(u.id, u.username)} className={`font-bold ${u.username === 'admin' ? 'text-gray-600 cursor-not-allowed' : 'text-red-400 hover:text-red-300'}`}>Delete</button>
                                        </td>
                                    </tr>
                                ))}
                                {users.length === 0 && (
                                    <tr><td colSpan="5" className="p-8 text-center text-gray-500">No users found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl animate-[slideUp_0.2s_ease-out]">
                        <div className="p-6 border-b border-gray-700 flex justify-between items-center bg-gray-900">
                            <h2 className="text-xl font-bold text-white">{editingUserId ? "Edit User" : "Create New User"}</h2>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white">✕</button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Username</label>
                                    <input required name="username" value={formData.username} onChange={handleInputChange} disabled={!!editingUserId} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 disabled:opacity-50" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Full Name</label>
                                    <input required name="full_name" value={formData.full_name} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Email</label>
                                    <input required type="email" name="email" value={formData.email} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Password {editingUserId && "(Leave blank to keep)"}</label>
                                    <input type="password" name="password" value={formData.password} onChange={handleInputChange} required={!editingUserId} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Role</label>
                                    <select name="role" value={formData.role} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500">
                                        <option value="Credit_Analyst">Credit Analyst</option>
                                        <option value="Credit_Manager">Credit Manager</option>
                                        <option value="Junior_Analyst">Junior Analyst</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Branch Code</label>
                                    <input required name="branch_code" value={formData.branch_code} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Department</label>
                                    <input required name="department" value={formData.department} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-400 mb-1 uppercase tracking-wider">Approval Limit (LKR)</label>
                                    <input required type="number" name="approval_limit" value={formData.approval_limit} onChange={handleInputChange} className="w-full bg-gray-900 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500 font-mono text-green-400" />
                                </div>
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-700 mt-6 !mt-8">
                                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-gray-400 hover:text-white font-bold transition">Cancel</button>
                                <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-lg font-bold shadow-lg transition">Save User</button>
                            </div>
                        </form>
                    </div>
                </div >
            )
            }

            <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
        </div >
    );
}
