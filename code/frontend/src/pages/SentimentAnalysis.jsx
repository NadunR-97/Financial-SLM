import { useState } from "react";
import axios from "axios";

export default function SentimentAnalysis() {
    const [textData, setTextData] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const handleAnalyze = async () => {
        if (!textData.trim() || textData.length < 10) {
            alert("Please enter a longer sample of text (minimum 10 characters) for accurate analysis.");
            return;
        }

        setLoading(true);
        try {
            const token = localStorage.getItem("token");
            const res = await axios.post("http://127.0.0.1:8000/analyze-sentiment", {
                text_data: textData
            }, {
                headers: { "Authorization": `Bearer ${token}` }
            });
            setResult(res.data);
        } catch (err) {
            console.error(err);
            alert("❌ Failed to run Sentiment Analysis.");
        } finally {
            setLoading(false);
        }
    };

    const clearData = () => {
        setTextData("");
        setResult(null);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white font-sans selection:bg-indigo-500 selection:text-white">
            <div className="flex-1 overflow-y-auto p-8 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] relative">

                {/* HEADER */}
                <div className="flex justify-between items-center mb-8 max-w-5xl mx-auto">
                    <div>
                        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-400">
                            Qualitative Sentiment Analysis
                        </h1>
                        <p className="text-gray-400 mt-1">AI-Powered Risk Extraction Tool for Soft Data</p>
                    </div>
                    {result && (
                        <button
                            onClick={clearData}
                            className="px-5 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm font-bold border border-gray-600 transition shadow-lg"
                        >
                            Reset Tool
                        </button>
                    )}
                </div>

                <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">

                    {/* INPUT PANEL */}
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 shadow-2xl flex flex-col h-[600px]">
                        <h3 className="text-lg font-bold text-gray-200 mb-4 flex items-center gap-2">
                            <span className="text-2xl">📝</span> Input Text Data
                        </h3>
                        <p className="text-sm text-gray-400 mb-4">
                            Paste unstructured data here (e.g., branch manager interview notes, raw customer emails, social media feedback).
                        </p>

                        <textarea
                            className="flex-1 w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-sm text-gray-200 focus:outline-none focus:border-indigo-500 transition resize-none custom-scrollbar"
                            placeholder="e.g., 'The applicant seemed highly anxious when reviewing their tax strategy and was actively evasive about their secondary income streams...'"
                            value={textData}
                            onChange={(e) => setTextData(e.target.value)}
                        ></textarea>

                        <button
                            onClick={handleAnalyze}
                            disabled={loading || textData.length < 10}
                            className={`mt-4 w-full py-4 rounded-xl font-bold text-lg shadow-lg flex justify-center items-center gap-2 transition transform active:scale-95 ${loading || textData.length < 10
                                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white hover:scale-105'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></span>
                                    Analyzing Logic...
                                </>
                            ) : (
                                <>
                                    <span className="text-xl">✨</span> Extract Risk Sentiment
                                </>
                            )}
                        </button>
                    </div>

                    {/* RESULTS PANEL */}
                    <div className="h-[600px]">
                        {!result ? (
                            <div className="h-full bg-gray-800/50 border-2 border-dashed border-gray-600 rounded-2xl flex flex-col items-center justify-center p-8 text-center transition-all">
                                <span className="text-6xl mb-4 opacity-50">🤖</span>
                                <p className="text-gray-400 font-bold mb-2">LangChain Engine Idle</p>
                                <p className="text-sm text-gray-500 max-w-sm">
                                    Waiting for raw text input to perform extraction, scoring, and classification.
                                </p>
                            </div>
                        ) : (
                            <div className="h-full bg-gray-800 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-[slideInRight_0.4s_ease-out]">

                                {/* Score Header Billboard */}
                                <div className={`p-8 text-center border-b ${result.sentiment === 'Positive' ? 'bg-green-900/30 border-green-800/50' :
                                        result.sentiment === 'Negative' ? 'bg-red-900/30 border-red-800/50' :
                                            'bg-yellow-900/30 border-yellow-800/50'
                                    }`}>
                                    <h3 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-2">Overall Score</h3>
                                    <div className={`text-6xl font-extrabold mb-2 ${result.sentiment === 'Positive' ? 'text-green-400' :
                                            result.sentiment === 'Negative' ? 'text-red-400' :
                                                'text-yellow-400'
                                        }`}>
                                        {result.score > 0 ? '+' : ''}{result.score}
                                    </div>
                                    <div className={`inline-block px-4 py-1 rounded-full font-bold text-sm ${result.sentiment === 'Positive' ? 'bg-green-600/20 text-green-300' :
                                            result.sentiment === 'Negative' ? 'bg-red-600/20 text-red-300' :
                                                'bg-yellow-600/20 text-yellow-300'
                                        }`}>
                                        {result.sentiment.toUpperCase()} SENTIMENT
                                    </div>
                                </div>

                                {/* Extracted Context */}
                                <div className="p-8 flex-1 bg-gray-800">
                                    <h3 className="text-white font-bold text-lg mb-6 flex items-center gap-2">
                                        <span className="text-indigo-400">✦</span> Key Extracted Factors
                                    </h3>
                                    <div className="space-y-4">
                                        {result.key_factors.map((factor, idx) => (
                                            <div key={idx} className="flex gap-4 items-start bg-gray-900/50 p-4 rounded-xl border border-gray-700 shadow-sm leading-relaxed text-sm text-gray-300">
                                                <div className="mt-0.5 text-indigo-500 text-lg">•</div>
                                                <div>{factor}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}
                    </div>
                </div>
            </div>
            <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .custom-scrollbar::-webkit-scrollbar { width: 8px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #4B5563; border-radius: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6366F1; }
      `}</style>
        </div>
    );
}
