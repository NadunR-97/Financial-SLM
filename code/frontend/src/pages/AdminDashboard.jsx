import { useState, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from "react-markdown";
// Navbar removed

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("files"); // Default to Files view
  const [loading, setLoading] = useState(false);

  // Data States
  const [user, setUser] = useState({ name: "Loading...", role: "...", email: "..." });
  const [files, setFiles] = useState([]);
  const [passwords, setPasswords] = useState({ old: "", new: "", confirm: "" });
  const [report, setReport] = useState("");
  const [msg, setMsg] = useState({ type: "", text: "" });

  const token = localStorage.getItem("token");

  // --- 1. INITIAL DATA FETCH ---
  useEffect(() => {
    fetchProfile();
    if (activeTab === "files") fetchFiles();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/profile", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchFiles = async () => {
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/files", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFiles(res.data.files);
    } catch (err) { console.error("Error fetching files", err); }
  };

  // --- 2. DELETE FILE HANDLER ---
  const handleDeleteFile = async (filename) => {
    if (!window.confirm(`Are you sure you want to delete "${filename}" from AI memory?`)) return;

    try {
      await axios.post("http://127.0.0.1:8000/admin/delete-file",
        { filename: filename },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // Refresh list
      fetchFiles();
      alert("File deleted successfully.");
    } catch (err) {
      alert("Failed to delete file.");
    }
  };

  // --- 3. GENERATE REPORT HANDLER ---
  const generateReport = async () => {
    setLoading(true);
    setReport("");
    try {
      const res = await axios.get("http://127.0.0.1:8000/admin/report-data", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReport(res.data.content);
    } catch (error) {
      setReport("Error generating report. Ensure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  // --- 4. PASSWORD CHANGE HANDLER ---
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setMsg({ type: "", text: "" });

    if (passwords.new !== passwords.confirm) {
      setMsg({ type: "error", text: "New passwords do not match!" });
      return;
    }
    try {
      await axios.post("http://127.0.0.1:8000/admin/change-password",
        { old_password: passwords.old, new_password: passwords.new },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMsg({ type: "success", text: "Password updated successfully!" });
      setPasswords({ old: "", new: "", confirm: "" });
    } catch (err) {
      setMsg({ type: "error", text: "Incorrect old password." });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Navbar removed */}

      <div className="flex flex-1 overflow-hidden">

        {/* SIDEBAR */}
        <div className="w-1/4 bg-gray-800 p-6 border-r border-gray-700">
          <h2 className="text-xl font-bold text-blue-400 mb-6 flex items-center gap-2">
            ⚙️ Admin Controls
          </h2>

          <div className="space-y-2">
            <button onClick={() => setActiveTab("files")} className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${activeTab === "files" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-700 text-gray-300"}`}>
              📚 Knowledge Base
            </button>
            <button onClick={() => setActiveTab("reports")} className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${activeTab === "reports" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-700 text-gray-300"}`}>
              📑 Board Report
            </button>
            <button onClick={() => setActiveTab("profile")} className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${activeTab === "profile" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-700 text-gray-300"}`}>
              👤 Profile
            </button>
            <button onClick={() => setActiveTab("security")} className={`w-full text-left px-4 py-3 rounded-lg transition font-medium ${activeTab === "security" ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-700 text-gray-300"}`}>
              🔒 Security
            </button>
          </div>
        </div>

        {/* CONTENT AREA */}
        <div className="w-3/4 p-8 overflow-y-auto bg-gray-900">

          {/* VIEW: KNOWLEDGE BASE (FILES) */}
          {activeTab === "files" && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-4">📚 Knowledge Base</h2>
              <p className="text-gray-400 mb-6">These files are currently stored in the AI's memory.</p>

              <div className="bg-gray-800 rounded-lg border border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-gray-700 text-gray-200">
                    <tr>
                      <th className="p-4">Filename</th>
                      <th className="p-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {files.length === 0 ? (
                      <tr><td colSpan="2" className="p-6 text-center text-gray-500">No files found in memory.</td></tr>
                    ) : (
                      files.map((file, idx) => (
                        <tr key={idx} className="hover:bg-gray-700/50 transition">
                          <td className="p-4 text-gray-300 font-medium">📄 {file}</td>
                          <td className="p-4 text-right">
                            <button
                              onClick={() => handleDeleteFile(file)}
                              className="px-3 py-1 bg-red-900/50 text-red-400 rounded border border-red-800 hover:bg-red-900 transition text-sm"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: REPORTS */}
          {activeTab === "reports" && (
            <div className="max-w-4xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Executive Financial Analysis</h2>
                <button onClick={generateReport} disabled={loading} className={`px-6 py-2 rounded font-bold shadow transition ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"}`}>
                  {loading ? "Generating..." : "Generate New Report"}
                </button>
              </div>
              {report ? (
                <div className="bg-white text-gray-900 p-10 rounded-xl shadow-2xl">
                  <div className="prose prose-lg max-w-none prose-headings:text-blue-900">
                    <ReactMarkdown>{report}</ReactMarkdown>
                  </div>
                </div>
              ) : (
                <div className="bg-gray-800 rounded-xl p-10 text-center border border-gray-700 opacity-75">
                  <p className="text-xl text-gray-400">Click "Generate New Report" to analyze all system data.</p>
                </div>
              )}
            </div>
          )}

          {/* VIEW: PROFILE */}
          {activeTab === "profile" && (
            <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-blue-400">User Profile</h3>
              <div className="space-y-4">
                <div><label className="block text-gray-400 text-sm mb-1">Full Name</label><input type="text" value={user.name} disabled className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-gray-300 cursor-not-allowed" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">Role</label><input type="text" value={user.role} disabled className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-green-400 font-bold cursor-not-allowed" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">Email</label><input type="text" value={user.email} disabled className="w-full bg-gray-900 border border-gray-600 rounded p-3 text-gray-300 cursor-not-allowed" /></div>
              </div>
            </div>
          )}

          {/* VIEW: SECURITY */}
          {activeTab === "security" && (
            <div className="max-w-xl mx-auto bg-gray-800 p-8 rounded-xl border border-gray-700">
              <h3 className="text-2xl font-bold mb-6 text-blue-400">Change Password</h3>
              {msg.text && (<div className={`p-3 mb-4 rounded text-sm font-bold ${msg.type === "success" ? "bg-green-900 text-green-200" : "bg-red-900 text-red-200"}`}>{msg.text}</div>)}
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div><label className="block text-gray-400 text-sm mb-1">Current Password</label><input type="password" value={passwords.old} onChange={(e) => setPasswords({ ...passwords, old: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-3 focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">New Password</label><input type="password" value={passwords.new} onChange={(e) => setPasswords({ ...passwords, new: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-3 focus:border-blue-500 outline-none" /></div>
                <div><label className="block text-gray-400 text-sm mb-1">Confirm New Password</label><input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} className="w-full bg-gray-900 border border-gray-600 rounded p-3 focus:border-blue-500 outline-none" /></div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded font-bold transition">Update Password</button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}