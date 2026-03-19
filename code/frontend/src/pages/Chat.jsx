import { useState, useRef, useEffect } from "react";
import axios from "axios";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
// Navbar removed (handled by DashboardLayout)

export default function Chat() {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);

  // --- 1. DEFINING QUICK ACTIONS ---
  const QUICK_ACTIONS = [
    { label: "📊 Financial Summary", query: "Provide an executive summary of the financial performance based on the documents." },
    { label: "⚠️ Risk Analysis", query: "Identify the key financial and operational risks mentioned in the documents." },
    { label: "📈 Debt Service Ratio", query: "Calculate the Debt Service Coverage Ratio (DSCR) and explain the trend." },
    { label: "💰 Liquidity Check", query: "Analyze the liquidity position (Current Ratio) and working capital." },
  ];

  // --- 2. HANDLE QUICK CLICK ---
  const handleQuickAction = (queryText) => {
    setQuestion(queryText);
    handleSend(null, queryText); // Trigger send immediately
  };

  // --- SEND MESSAGE FUNCTION ---
  const handleSend = async (e, overrideQuestion = null) => {
    if (e) e.preventDefault();

    const queryToSend = overrideQuestion || question;
    if (!queryToSend.trim()) return;

    const newMessages = [...messages, { role: "user", content: queryToSend }];
    setMessages(newMessages);
    setLoading(true);
    setQuestion(""); // Clear input immediately

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "http://127.0.0.1:8000/ask",
        { query: queryToSend },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessages([...newMessages, { role: "bot", content: res.data.answer }]);
    } catch (err) {
      console.error(err);
      setMessages([...newMessages, { role: "bot", content: "Error: Could not connect to AI." }]);
    } finally {
      setLoading(false);
    }
  };

  // --- FILE UPLOAD FUNCTIONS ---
  const handleFileSelect = async (e) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    try {
      const token = localStorage.getItem("token");
      setMessages(prev => [...prev, { role: "system", content: `📤 Uploading ${files.length} document(s)...` }]);

      const res = await axios.post("http://127.0.0.1:8000/upload", formData, {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMessages(prev => [...prev, { role: "bot", content: `✅ ${res.data.message}` }]);
    } catch (error) {
      console.error("Upload Error:", error);
      setMessages(prev => [...prev, { role: "bot", content: "❌ Upload failed. Please try again." }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Navbar removed */}

      {/* CHAT AREA */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.length === 0 && (
          <div className="text-gray-500 text-center mt-20 opacity-75">
            <h2 className="text-3xl font-bold mb-4">Financial AI Assistant</h2>
            <p className="text-lg mb-8">Upload documents or select a quick action below.</p>

            {/* Show Quick Actions Centered when Chat is Empty */}
            <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto">
              {QUICK_ACTIONS.map((action, idx) => (
                <button
                  key={idx}
                  onClick={() => handleQuickAction(action.query)}
                  className="p-4 bg-gray-800 border border-gray-700 rounded-xl hover:bg-gray-700 hover:border-blue-500 transition text-left flex items-center gap-3 shadow-lg"
                >
                  <span className="text-2xl">{action.label.split(" ")[0]}</span>
                  <span className="font-semibold text-blue-200">{action.label.substring(2)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-3xl p-4 rounded-xl shadow-lg ${msg.role === "user"
              ? "bg-blue-600 text-white rounded-br-none"
              : msg.role === "system"
                ? "bg-gray-800 text-yellow-400 text-sm border border-yellow-400/30"
                : "bg-gray-700 text-gray-200 rounded-bl-none"
              }`}>
              {/* Render MarkDown */}
              <div className="prose prose-sm max-w-none text-gray-100 prose-headings:text-blue-300 prose-strong:text-yellow-400 prose-table:border-collapse prose-table:border prose-table:border-gray-600 prose-th:bg-gray-800 prose-th:text-gray-300 prose-td:border prose-td:border-gray-600 prose-a:text-blue-400 hover:prose-a:text-blue-300">
                {msg.role === 'bot' ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-700 text-gray-400 p-4 rounded-xl animate-pulse">Thinking...</div>
          </div>
        )}
      </div>

      {/* INPUT AREA */}
      <div className="p-4 bg-gray-800 border-t border-gray-700">

        {/* Quick Chips (Visible above input if messages exist) */}
        {messages.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-3 mb-2 scrollbar-thin scrollbar-thumb-gray-600">
            {QUICK_ACTIONS.map((action, idx) => (
              <button
                key={idx}
                onClick={() => handleQuickAction(action.query)}
                className="whitespace-nowrap px-3 py-1 bg-gray-700 text-xs font-bold text-gray-300 rounded-full hover:bg-blue-600 hover:text-white transition border border-gray-600"
              >
                {action.label}
              </button>
            ))}
          </div>
        )}

        <form onSubmit={handleSend} className="flex gap-3 max-w-5xl mx-auto items-center">

          {/* FILE ATTACHMENT */}
          <input type="file" multiple ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
          <button
            type="button"
            onClick={() => fileInputRef.current.click()}
            disabled={uploading}
            className="p-3 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600 transition border border-gray-600 hover:border-blue-400"
            title="Upload Documents"
          >
            {uploading ? <span className="animate-spin">⏳</span> : "📎"}
          </button>

          {/* TEXT INPUT */}
          <input
            type="text"
            className="flex-1 p-3 rounded-lg bg-gray-700 border border-gray-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition"
            placeholder="Ask a question..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading || uploading}
            className="bg-blue-600 px-8 py-3 rounded-lg font-bold hover:bg-blue-500 transition shadow-lg disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}