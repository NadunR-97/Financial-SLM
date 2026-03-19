import { useState, useEffect } from "react";
import API from "../api";

export default function Profile() {
    const [profile, setProfile] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchProfileData = async () => {
            try {
                const [profileRes, historyRes] = await Promise.all([
                    API.get("/admin/profile"),
                    API.get("/admin/history")
                ]);
                setProfile(profileRes.data.profile);
                setHistory(historyRes.data.history);
            } catch (err) {
                setError("Failed to load profile data.");
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-10 h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-10">
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl">
                    {error}
                </div>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-8 animate-fade-in pb-20 pt-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">My Profile</h1>
                    <p className="text-gray-400 mt-1">Manage your account and view your appraisal history.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* User Stats Card */}
                <div className="col-span-1 bg-gray-800 rounded-2xl border border-gray-700 p-6 flex flex-col items-center shadow-lg">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-3xl font-bold text-white shadow-xl mb-4 border-4 border-gray-900">
                        {profile?.role === "Admin" ? "AD" : "CA"}
                    </div>
                    <h2 className="text-xl font-bold text-white">{profile?.fullName}</h2>
                    <p className="text-blue-400 font-semibold mb-6">{profile?.role}</p>

                    <div className="w-full space-y-3">
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">Email Address</p>
                            <p className="text-sm text-gray-200 font-medium">{profile?.email}</p>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 flex justify-between">
                            <div>
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Department</p>
                                <p className="text-sm text-gray-200 font-medium">{profile?.department}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Branch</p>
                                <p className="text-sm text-gray-200 font-medium">{profile?.branch}</p>
                            </div>
                        </div>
                        <div className="bg-gray-900 p-3 rounded-lg border border-gray-700 border-l-4 border-l-green-500">
                            <p className="text-xs text-gray-500 uppercase tracking-wider">My Approval Limit</p>
                            <p className="text-lg text-green-400 font-bold">LKR {profile?.approvalLimit?.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                {/* History Table */}
                <div className="col-span-2 bg-gray-800 rounded-2xl border border-gray-700 shadow-lg overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-700 bg-gray-800/80">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <span className="text-blue-500">📋</span> Recent Appraisals
                        </h2>
                        <p className="text-sm text-gray-400">Your audit trail of generated credit reports.</p>
                    </div>

                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-900/50 text-gray-400 uppercase text-xs tracking-wider border-b border-gray-700">
                                <tr>
                                    <th className="px-6 py-4 font-medium">Date</th>
                                    <th className="px-6 py-4 font-medium">Customer Profile snippet</th>
                                    <th className="px-6 py-4 font-medium">Facility</th>
                                    <th className="px-6 py-4 font-medium">System Decision</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-700/50">
                                {history.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="px-6 py-12 text-center text-gray-500 italic">
                                            No appraisals generated yet.
                                        </td>
                                    </tr>
                                ) : (
                                    history.map((record) => (
                                        <tr key={record.id} className="hover:bg-gray-700/20 transition-colors">
                                            <td className="px-6 py-4 text-gray-300 whitespace-nowrap">{record.timestamp}</td>
                                            <td className="px-6 py-4 text-gray-400 truncate max-w-xs">{record.customer}</td>
                                            <td className="px-6 py-4 text-gray-300">{record.loanDetails}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${record.decision.includes("Approve") ? "bg-green-500/10 text-green-400 border-green-500/20" :
                                                        record.decision.includes("Pending") ? "bg-yellow-500/10 text-yellow-500 border-yellow-500/20" :
                                                            "bg-red-500/10 text-red-400 border-red-500/20"
                                                    }`}>
                                                    {record.decision}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
