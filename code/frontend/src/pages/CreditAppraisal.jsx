import { useState } from "react";
import API from "../api";
import ReactMarkdown from "react-markdown";
// Navbar removed

export default function CreditAppraisal() {
  const [formData, setFormData] = useState({
    profile: "",
    amount: "",
    tenure: "",
    rate: "",
    security: "Property Mortgage",
  });

  // --- 1. SEPARATE STATE FOR FILE TYPES ---
  const [financialFiles, setFinancialFiles] = useState([]);
  const [cribFiles, setCribFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setReport(null);

    const data = new FormData();
    data.append("customer_profile", formData.profile);
    data.append("loan_amount", formData.amount);
    data.append("loan_tenure", formData.tenure);
    data.append("interest_rate", formData.rate);
    data.append("security", formData.security);

    // --- 2. MERGE FILES BEFORE SENDING ---
    // The backend expects a list called "files", so we add both sets to it.
    for (let i = 0; i < financialFiles.length; i++) {
      data.append("files", financialFiles[i]);
    }
    for (let i = 0; i < cribFiles.length; i++) {
      data.append("files", cribFiles[i]);
    }

    try {
      const response = await API.post("/analyze-credit", data, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      setReport(response.data.appraisal_report);
    } catch (error) {
      console.error("Appraisal Failed:", error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again.");
        window.location.href = "/";
      } else {
        alert("Error generating appraisal. Check backend logs.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      {/* Navbar removed */}

      <div className="flex flex-1 overflow-hidden">
        {/* INPUT PANEL (Left) */}
        <div className="w-1/3 p-6 border-r border-gray-700 overflow-y-auto bg-gray-800/50">
          <h2 className="text-2xl font-bold text-blue-400 mb-6 flex items-center gap-2">
            <span>⚖️</span> New Application
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Customer Profile */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Customer Profile</label>
              <textarea
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 h-24 focus:border-blue-500 outline-none"
                placeholder="Business history, nature of business..."
                value={formData.profile}
                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                required
              />
            </div>

            {/* Loan Amount */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Loan Amount</label>
              <input
                type="text"
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
                placeholder="E.g., 50,000,000 LKR"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                required
              />
            </div>

            <div className="flex gap-4">
              {/* Tenure */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Tenure (Months)</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
                  placeholder="E.g., 60"
                  value={formData.tenure}
                  onChange={(e) => setFormData({ ...formData, tenure: e.target.value })}
                  required
                />
              </div>

              {/* Interest Rate */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-300 mb-2">Interest Rate (%)</label>
                <input
                  type="text"
                  className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
                  placeholder="E.g., 18.5"
                  value={formData.rate}
                  onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Security */}
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-2">Proposed Security</label>
              <select
                className="w-full p-3 bg-gray-800 rounded-lg border border-gray-600 focus:border-blue-500 outline-none"
                value={formData.security}
                onChange={(e) => setFormData({ ...formData, security: e.target.value })}
              >
                <option>Property Mortgage</option>
                <option>Cash / Fixed Deposit</option>
                <option>Vehicle Hypothecation</option>
                <option>Corporate Guarantee</option>
                <option>Unsecured / Clean</option>
              </select>
            </div>

            {/* --- 3. SEPARATE UPLOAD BOXES --- */}

            {/* Box 1: Financial Statements */}
            <div className="p-4 bg-gray-800 rounded-lg border border-dashed border-gray-500 hover:border-blue-500 transition">
              <label className="block text-sm font-bold text-blue-300 mb-2">
                📂 1. Upload Financial Statements
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFinancialFiles(e.target.files)}
                className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {financialFiles.length > 0 ? `✅ ${financialFiles.length} file(s) selected` : "Required: Audited Accounts, Bank Statements"}
              </p>
            </div>

            {/* Box 2: CRIB Reports */}
            <div className="p-4 bg-gray-800 rounded-lg border border-dashed border-gray-500 hover:border-purple-500 transition">
              <label className="block text-sm font-bold text-purple-300 mb-2">
                📋 2. Upload CRIB Reports
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setCribFiles(e.target.files)}
                className="block w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-purple-600 file:text-white hover:file:bg-purple-700 cursor-pointer"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                {cribFiles.length > 0 ? `✅ ${cribFiles.length} file(s) selected` : "Required: CRIB for Company & Directors"}
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-lg font-bold text-lg shadow-lg transition transform active:scale-95 ${loading ? "bg-gray-600 cursor-not-allowed" : "bg-green-600 hover:bg-green-500"
                }`}
            >
              {loading ? "Analyzing Risk..." : "Generate Appraisal"}
            </button>
          </form>
        </div>

        {/* RESULT PANEL (Right) */}
        <div className="w-2/3 p-8 bg-gray-900 overflow-y-auto">
          {report ? (
            <div className="bg-white text-gray-900 p-10 rounded-xl shadow-2xl max-w-4xl mx-auto min-h-[80vh]">
              <div className="border-b-2 border-gray-200 pb-6 mb-8 flex justify-between items-center">
                <div>
                  <h1 className="text-3xl font-extrabold text-gray-800">Credit Appraisal Memorandum</h1>
                  <p className="text-gray-500 mt-1">Automated Risk Assessment</p>
                </div>
                <div className="text-right">
                  <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide">
                    AI Generated
                  </span>
                  <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              <div className="prose prose-lg max-w-none prose-headings:text-blue-800 prose-strong:text-gray-900">
                <ReactMarkdown>{report}</ReactMarkdown>
              </div>

              <div className="mt-12 border-t pt-6 text-center bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 font-medium">Final Management Decision</p>
                <div className="flex justify-center gap-4 mt-3">
                  <button className="px-6 py-2 border-2 border-green-600 text-green-700 font-bold rounded hover:bg-green-50">Approve</button>
                  <button className="px-6 py-2 border-2 border-red-600 text-red-700 font-bold rounded hover:bg-red-50">Decline</button>
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-60">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-32 w-32 mb-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={0.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-2xl font-bold">Ready to Analyze</h3>
              <p className="mt-2 text-lg">Upload your Financials and CRIB reports to begin.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}