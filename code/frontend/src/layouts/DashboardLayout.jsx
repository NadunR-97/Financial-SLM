import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  // Handle localStorage safely, replace underscores with spaces, and lowercase
  const rawRole = localStorage.getItem("role") || "Viewer";
  const role = rawRole.replace(/_/g, " ").toLowerCase();

  // Route definitions based on RBAC logic
  const juniorAnalystNavItems = [
    { path: "/chat", label: "AI Chat Assistant", icon: "💬" },
    { path: "/analytics", label: "Product Analytics", icon: "📈" },
    { path: "/sentiment", label: "Sentiment Analysis", icon: "🧠" },
    { path: "/profile", label: "My Profile", icon: "👤" },
  ];

  const seniorAnalystNavItems = [
    { path: "/chat", label: "AI Chat Assistant", icon: "💬" },
    { path: "/appraisal", label: "Credit Appraisal", icon: "⚖️" },
    { path: "/analytics", label: "Product Analytics", icon: "📈" },
    { path: "/sentiment", label: "Sentiment Analysis", icon: "🧠" },
    { path: "/profile", label: "My Profile", icon: "👤" },
  ];

  const adminNavItems = [
    { path: "/users", label: "User Management", icon: "👥" },
    { path: "/profile", label: "Admin Profile", icon: "🔒" },
  ];

  let navItems = juniorAnalystNavItems; // default fallback
  if (role === "admin") {
    navItems = adminNavItems;
  } else if (role === "credit analyst" || role === "credit manager" || role === "analyst") {
    navItems = seniorAnalystNavItems;
  } else if (role === "junior analyst") {
    navItems = juniorAnalystNavItems;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white font-sans">

      {/* SIDEBAR */}
      <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col shadow-2xl z-20">

        {/* BRAND */}
        <div className="p-6 border-b border-gray-700 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg">
            AI
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-wide">Financial<span className="text-blue-400">SLM</span></h1>
            <p className="text-xs text-gray-500">Enterprise Edition</p>
          </div>
        </div>

        {/* NAVIGATION */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-blue-600 text-white shadow-md translate-x-1"
                  : "text-gray-400 hover:bg-gray-700 hover:text-white hover:translate-x-1"}
              `}
            >
              <span className="text-xl group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* USER PROFILE & LOGOUT */}
        <div className="p-4 border-t border-gray-700 bg-gray-800/50">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-md ${role === "admin" ? "bg-red-600" : role === "credit_manager" ? "bg-emerald-600" : "bg-blue-600"}`}>
              {role === "admin" ? "AD" : role === "credit_manager" ? "CM" : "CA"}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold text-white truncate">{role === "admin" ? "System Admin" : role === "credit_manager" ? "Credit Manager" : "Credit Analyst"}</p>
              <p className="text-xs text-blue-300 font-semibold tracking-wider uppercase truncate">{role.replace("_", " ")}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full py-2 bg-red-500/10 hover:bg-red-600 text-red-400 hover:text-white rounded-lg text-sm font-semibold transition-all border border-red-500/20 hover:border-red-500"
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-col overflow-hidden relative">

        {/* HEADER (Optional, can be per page or global) */}
        <header className="h-16 bg-gray-800/50 backdrop-blur-md border-b border-gray-700 flex items-center justify-between px-8 absolute w-full top-0 z-10 hidden">
          {/* Placeholder for future header items like Search or Notifications */}
        </header>

        {/* PAGE CONTENT */}
        <div className="flex-1 overflow-auto bg-gray-900 scrollbar-thin scrollbar-thumb-gray-700 relative">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
