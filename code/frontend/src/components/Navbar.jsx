import { useNavigate, Link, useLocation } from "react-router-dom";

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const isActive = (path) => location.pathname === path 
    ? "bg-blue-600 text-white shadow-lg scale-105" 
    : "bg-gray-700 text-gray-300 hover:bg-gray-600 hover:text-white";

  return (
    <nav className="bg-gray-800 p-4 border-b border-gray-700 flex justify-between items-center shadow-md sticky top-0 z-50">
      
      {/* BRANDING */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center font-bold text-white">
          AI
        </div>
        <h1 className="text-xl font-bold text-blue-400 tracking-wide">
          Financial<span className="text-white">Analyst</span>
        </h1>
      </div>

      {/* NAVIGATION LINKS */}
      <div className="flex gap-4 items-center">
        
        <Link to="/chat" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive('/chat')}`}>
          💬 Chat
        </Link>

        <Link to="/appraisal" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive('/appraisal')}`}>
          ⚖️ Appraisal
        </Link>

        {/* --- NEW ANALYTICS LINK --- */}
        <Link to="/analytics" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive('/analytics')}`}>
          📈 Analytics
        </Link>
        
        {/* ADMIN LINK */}
        <Link to="/admin" className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${isActive('/admin')}`}>
          🔒 Admin
        </Link>

        <div className="h-6 w-px bg-gray-600 mx-2"></div>

        <button 
          onClick={handleLogout} 
          className="px-5 py-2 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-sm font-bold transition shadow-md"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}