import { useState, useRef, useEffect, useMemo } from "react";
import axios from "axios";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function ProductAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // --- INTERACTIVE BI STATE ---
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [globalYearSlicer, setGlobalYearSlicer] = useState("All");

  // --- CHAT STATE ---
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! I am your Enterprise Data Agent. Ask me complex math questions about this dataset!" }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatOpen]);

  // --- DATA INGESTION ---
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post("http://127.0.0.1:8000/analyze-sales", formData, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setTimeout(() => setData(res.data), 300);
    } catch (err) {
      console.error(err);
      alert("❌ Analysis failed.");
    } finally { setLoading(false); }
  };

  const handleLiveConnection = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://127.0.0.1:8000/analytics/live-sales", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      setTimeout(() => setData(res.data), 300);
    } catch (err) {
      console.error(err);
      alert("❌ Live Connection failed.");
    } finally { setLoading(false); }
  };

  // --- CHAT HANDLER ---
  const handleSend = async () => {
    if (!input.trim() || !data?.csv_context) return;

    const userMsg = { role: "user", text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setChatLoading(true);

    try {
      const res = await axios.post("http://127.0.0.1:8000/chat-sales", {
        question: userMsg.text,
        context: data.csv_context
      });
      const botMsg = { role: "bot", text: res.data.answer };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "bot", text: "⚠️ Error running Data Agent." }]);
    } finally { setChatLoading(false); }
  };

  const handleExport = () => {
    if (!data) return;
    let csvContent = "data:text/csv;charset=utf-8,Year,Product,Revenue\n";
    data.products.forEach(row => csvContent += `Summary,${row.product},${row.revenue}\n`);
    data.yearly_trend.forEach(row => csvContent += `${row.year},Total Sales,${row.revenue}\n`);
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", "financial_report.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- CROSS-FILTERING & ML COMPUTATIONS ---
  const filteredProducts = useMemo(() => {
    if (!data) return [];
    let list = data.products;
    if (selectedProduct) {
      list = list.filter(p => p.product === selectedProduct);
    }
    return list;
  }, [data, selectedProduct]);

  const chartDataWithForecast = useMemo(() => {
    if (!data || !data.yearly_trend || data.yearly_trend.length === 0) return [];

    // Clone historical data
    const chartData = data.yearly_trend.map(d => ({ ...d }));

    // Inject ML Predictions if available
    if (data.ml_predictions && Object.keys(data.ml_predictions).length > 0) {
      const lastYear = parseInt(chartData[chartData.length - 1].year);
      const futureYear = lastYear + 1;
      const totalForecast = Object.values(data.ml_predictions).reduce((a, b) => a + b, 0);

      // Connect the historic line to the forecast line
      chartData[chartData.length - 1].forecasted_revenue = chartData[chartData.length - 1].revenue;

      // Add the future projection point
      chartData.push({
        year: `${futureYear} (ML Forecast)`,
        revenue: null, // No actual revenue yet
        forecasted_revenue: totalForecast
      });
    }
    return chartData;
  }, [data]);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-sans selection:bg-blue-500 selection:text-white">
      <div className="flex-1 overflow-y-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-300">
              Enterprise Dashboard
            </h1>
            <p className="text-gray-400 mt-1">BI & Pandasi Data Agent Workspace</p>
          </div>
          {data && (
            <div className="flex gap-3 items-center">
              {/* Slicer */}
              <select
                value={globalYearSlicer}
                onChange={(e) => setGlobalYearSlicer(e.target.value)}
                className="bg-gray-800 border border-gray-600 rounded-lg text-sm text-white px-3 py-2 outline-none focus:border-blue-500"
              >
                <option value="All">All Years</option>
                {data.yearly_trend.map(t => (
                  <option key={t.year} value={t.year}>{t.year}</option>
                ))}
              </select>

              <button onClick={() => { setData(null); setSelectedProduct(null) }} className="px-5 py-2 bg-gray-800 border border-gray-600 hover:bg-gray-700 rounded-lg text-sm font-bold transition shadow-lg">
                ⬅ Close DB
              </button>
              <button onClick={handleExport} className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 rounded-lg text-sm font-bold transition shadow-lg transform hover:-translate-y-1">
                📥 Export Report
              </button>
            </div>
          )}
        </div>

        {/* UPLOAD & LIVE DATASOURCE SECTION */}
        {!data && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-[60vh] max-w-4xl mx-auto items-center">

            {/* File Upload Pane */}
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-gray-600 rounded-3xl bg-gray-800/30 backdrop-blur-sm transition-all hover:border-blue-500 group h-full">
              <div className="p-6 rounded-full bg-gray-800 mb-6 group-hover:scale-110 transition duration-300">
                <span className="text-4xl">📁</span>
              </div>
              <p className="text-2xl font-bold text-gray-300 mb-2">Upload Excel / CSV</p>
              <p className="text-sm text-gray-500 mb-6 text-center">Standard static file ingestion pipeline.</p>
              <label className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 active:scale-95">
                <span>Select File</span>
                <input type="file" accept=".xlsx,.xls,.csv,.json" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>

            {/* Live Database Pane */}
            <div className="flex flex-col items-center justify-center p-12 border-2 border-solid border-indigo-700 rounded-3xl bg-gradient-to-br from-indigo-900/30 to-purple-900/30 backdrop-blur-sm transition-all hover:border-indigo-400 shadow-[0_0_30px_rgba(79,70,229,0.2)] group h-full">
              <div className="p-6 rounded-full bg-indigo-900 mb-6 group-hover:scale-110 transition duration-300 relative">
                <span className="text-4xl">⚡</span>
                <span className="absolute top-0 right-0 h-4 w-4 bg-green-400 rounded-full animate-ping"></span>
              </div>
              <p className="text-2xl font-bold text-gray-300 mb-2">Connect Live DB</p>
              <p className="text-sm text-gray-500 mb-6 text-center">Stream directly from the Enterprise Financial Data Warehouse.</p>
              <button
                onClick={handleLiveConnection}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-8 py-3 rounded-full font-bold shadow-lg transition transform hover:scale-105 active:scale-95 flex items-center gap-2"
              >
                <span>Connect</span>
                {loading && <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>}
              </button>
            </div>

          </div>
        )}

        {/* DASHBOARD GRID */}
        {data && (
          <div className="space-y-8 animate-[slideUp_0.6s_ease-out] pb-24">

            {/* CROSS-FILTER WARNING */}
            {selectedProduct && (
              <div className="bg-blue-900/40 border border-blue-500 text-blue-200 px-4 py-3 rounded-lg flex justify-between items-center backdrop-blur-sm">
                <span><strong>Cross-Filter Active:</strong> Viewing isolated metrics for <i>{selectedProduct}</i>.</span>
                <button onClick={() => setSelectedProduct(null)} className="text-sm bg-blue-600 hover:bg-blue-500 px-3 py-1 rounded font-bold">Clear Filter</button>
              </div>
            )}

            {/* 1. METRICS (YoY updated + Anomalies) */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">

              <div className="relative overflow-hidden bg-gray-800 rounded-xl p-5 shadow-2xl border border-gray-700">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Overall Growth (YoY)</h3>
                <div className="flex items-end gap-3">
                  <p className={`text-3xl font-bold ${data.overall_yoy >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.overall_yoy >= 0 ? '▲' : '▼'} {Math.abs(data.overall_yoy)}%
                  </p>
                </div>
              </div>

              <div className="relative overflow-hidden bg-gray-800 rounded-xl p-5 shadow-2xl border border-gray-700">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Top Revenue Driver</h3>
                <p className="text-xl font-bold text-white truncate">{data.top_earner.product}</p>
                <p className="text-green-400 text-lg font-mono mt-1">{(data.top_earner.revenue / 1000000).toFixed(1)}M</p>
              </div>

              <div className="relative overflow-hidden bg-gray-800 rounded-xl p-5 shadow-2xl border border-gray-700">
                <h3 className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Needs Attention</h3>
                <p className="text-xl font-bold text-white truncate">{data.lowest_earner.product}</p>
                <p className="text-red-400 text-lg font-mono mt-1">{(data.lowest_earner.revenue / 1000000).toFixed(1)}M</p>
              </div>

              {/* NEW: ANOMALY DETECTION KPI */}
              <div className={`relative overflow-hidden rounded-xl p-5 shadow-2xl border ${data.total_anomalies > 0 ? 'bg-red-900/60 border-red-500 animate-pulse' : 'bg-gray-800 border-gray-700'}`}>
                <h3 className={`text-xs font-bold uppercase tracking-wider mb-2 ${data.total_anomalies > 0 ? 'text-red-200' : 'text-gray-400'}`}>
                  Data Integrity Alerts
                </h3>
                <p className="text-3xl font-bold text-white mb-1">
                  {data.total_anomalies > 0 ? `⚠️ ${data.total_anomalies}` : '✅ 0'}
                </p>
                <p className={`text-xs ${data.total_anomalies > 0 ? 'text-red-300' : 'text-green-400'}`}>
                  {data.total_anomalies > 0 ? "Statistical Outliers Found" : "Dataset Clean"}
                </p>
              </div>

              <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 to-purple-900 rounded-xl p-5 shadow-2xl border border-indigo-700">
                <h3 className="text-indigo-200 text-xs font-bold uppercase tracking-wider mb-2">AI Strategic Outlook</h3>
                <p className="text-xs text-white italic leading-snug line-clamp-3">"{data.ai_forecast}"</p>
              </div>
            </div>

            {/* 2. CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

              {/* Product Pie (Clickable for Cross-Filtering) */}
              <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-xl col-span-1">
                <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2"><span className="text-blue-400">🍰</span> Revenue Market Share</span>
                  <span className="text-[10px] text-gray-500 bg-gray-900 px-2 py-1 rounded">Interactive</span>
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.products}
                        cx="50%" cy="50%"
                        innerRadius={50} outerRadius={80}
                        paddingAngle={5}
                        dataKey="revenue"
                        onClick={(entry) => setSelectedProduct(entry.product === selectedProduct ? null : entry.product)}
                        className="cursor-pointer hover:opacity-80 transition-opacity"
                      >
                        {data.products.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                            opacity={selectedProduct ? (selectedProduct === entry.product ? 1 : 0.3) : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Product Bar Chart (Cross-Filtered) */}
              <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-xl col-span-2">
                <h3 className="text-sm font-bold mb-4">Product Performance Ranking</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={filteredProducts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="product" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${value / 1000000}M`} tick={{ fontSize: 12 }} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} cursor={{ fill: '#1f2937' }} />
                      <Bar dataKey="revenue" radius={[4, 4, 0, 0]}>
                        {filteredProducts.map((entry, index) => (
                          <Cell key={`bar-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Area Chart - Full Width */}
              <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-xl col-span-1 lg:col-span-3">
                <h3 className="text-sm font-bold mb-4 flex items-center justify-between">
                  <span className="flex items-center gap-2 text-green-400">📈 Historic Growth & ML Forecast Horizon</span>
                  {data?.ml_accuracy && <span className="text-[10px] bg-green-900/40 text-green-300 px-2 py-1 rounded border border-green-800">Scikit-Learn Verified</span>}
                </h3>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartDataWithForecast}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.8} />
                          <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                      <XAxis dataKey="year" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" tickFormatter={(value) => `${value / 1000000}M`} />
                      <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                      <Area type="monotone" dataKey="revenue" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" name="Historical Revenue" />
                      <Area type="monotone" dataKey="forecasted_revenue" stroke="#F59E0B" strokeWidth={3} strokeDasharray="5 5" fillOpacity={1} fill="url(#colorForecast)" name="Predicted Revenue" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

            </div>

            {/* 3. NEW: ACADEMIC MODEL VALIDATION & FEATURE IMPORTANCE */}
            {data.ml_accuracy && data.correlation_matrix && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">

                {/* Model Accuracy KPIs */}
                <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-xl col-span-1 flex flex-col justify-center">
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2 text-indigo-400">
                    <span>🔬</span> Predictive Model Verification
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-lg">
                      <span className="text-xs font-bold text-gray-400">Mean Absolute Error (MAE)</span>
                      <span className="font-mono text-indigo-300">${data.ml_accuracy.mae?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-lg">
                      <span className="text-xs font-bold text-gray-400">Root Mean Sq Error (RMSE)</span>
                      <span className="font-mono text-purple-300">${data.ml_accuracy.rmse?.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center bg-gray-900 border border-gray-700 p-3 rounded-lg">
                      <span className="text-xs font-bold text-gray-400">R² Coefficient</span>
                      <span className="font-mono text-green-300 font-bold">{data.ml_accuracy.r2_score}</span>
                    </div>
                  </div>
                </div>

                {/* Pandas Correlation Matrix */}
                <div className="bg-gray-800/80 backdrop-blur p-6 rounded-2xl border border-gray-700 shadow-xl col-span-2 overflow-hidden">
                  <h3 className="text-sm font-bold mb-4 flex items-center gap-2 text-blue-400">
                    <span>🧪</span> Feature Importance: Product Correlation Matrix
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr>
                          <th className="py-2 px-3 border-b border-gray-700 text-gray-400 bg-gray-900 rounded-tl-lg">Product Effect</th>
                          {data.correlation_matrix.map(c => (
                            <th key={c.product} className="py-2 px-3 border-b border-gray-700 text-gray-300 truncate max-w-[100px]">{c.product}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.correlation_matrix.map((row, i) => (
                          <tr key={i} className="hover:bg-gray-700/50 transition">
                            <td className="py-2 px-3 border-b border-gray-700 font-bold bg-gray-900 text-gray-300">{row.product}</td>
                            {data.correlation_matrix.map(col => {
                              const val = row[col.product];
                              // Heatmap coloring based on correlation value
                              let colorClass = "text-gray-400";
                              if (val > 0.7 && val < 1) colorClass = "text-green-400 font-bold";
                              else if (val < -0.7) colorClass = "text-red-400 font-bold";
                              else if (val === 1) colorClass = "text-gray-500";

                              return (
                                <td key={col.product} className={`py-2 px-3 border-b border-gray-700 font-mono ${colorClass}`}>
                                  {val}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>
            )}

            {/* 4. DATA INTEGRITY ALERT TABLE */}
            {data.total_anomalies > 0 && (
              <div className="bg-red-950/30 border-2 border-red-900 rounded-2xl p-6 shadow-2xl mt-8 animate-[pulse_3s_ease-in-out_infinite]">
                <h3 className="text-lg font-bold text-red-400 mb-4 flex items-center gap-2">
                  <span>🚨</span> Critical Anomalies Detected (Z-Score &gt; 2.0)
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-red-900/50">
                        <th className="py-3 px-4 text-xs font-bold uppercase text-red-300">Product</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase text-red-300">Year</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase text-red-300 text-right">Anomalous Revenue</th>
                        <th className="py-3 px-4 text-xs font-bold uppercase text-red-300">Statistical Trigger</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.anomalies.map((anomaly, idx) => (
                        <tr key={idx} className="border-b border-red-900/30 bg-red-900/10 hover:bg-red-900/20 transition-colors">
                          <td className="py-3 px-4 text-sm font-semibold text-white">{anomaly.product}</td>
                          <td className="py-3 px-4 text-sm text-gray-300">{anomaly.year}</td>
                          <td className="py-3 px-4 text-sm font-mono text-red-400 text-right">${anomaly.revenue.toLocaleString()}</td>
                          <td className="py-3 px-4 text-sm text-red-300 italic">{anomaly.reason}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- FLOATING CHAT BUTTON & WINDOW --- */}
        {data && (
          <>
            <button
              onClick={() => setChatOpen(!chatOpen)}
              className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-6 py-4 rounded-full shadow-2xl transition transform hover:scale-110 z-50 flex items-center gap-3 border border-indigo-400"
            >
              <span className="text-3xl">🤖</span>
              <span className="font-bold">Enterprise Data Agent</span>
            </button>

            {chatOpen && (
              <div className="fixed bottom-24 right-6 w-[400px] h-[600px] bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl flex flex-col z-50 overflow-hidden animate-[slideUp_0.3s_ease-out]">
                {/* Chat Header */}
                <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-5 border-b border-gray-700 flex justify-between items-center shadow-md">
                  <div>
                    <h3 className="font-bold text-blue-400 flex items-center gap-2 text-lg">
                      🤖 Dataset Copilot
                    </h3>
                    <p className="text-xs text-green-400 ml-7 animate-pulse">Python Code Sandbox Active</p>
                  </div>
                  <button onClick={() => setChatOpen(false)} className="text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 rounded-full w-8 h-8 flex items-center justify-center transition">✕</button>
                </div>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gray-900/90">
                  {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${msg.role === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-gray-800 text-gray-200 rounded-tl-none border border-gray-700'
                        }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-800 border border-gray-700 p-4 rounded-2xl rounded-tl-none flex gap-2 items-center">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce delay-100"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
                        <span className="text-xs text-gray-400 ml-2">Running Python queries...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-gray-800 border-t border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                      placeholder="Ask for complex math or trends..."
                      className="flex-1 bg-gray-900 border border-gray-600 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                    />
                    <button
                      onClick={handleSend}
                      disabled={chatLoading}
                      className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-3 rounded-xl font-bold transition disabled:opacity-50 shadow-md"
                    >
                      ➤
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

      </div>
      <style>{`
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}