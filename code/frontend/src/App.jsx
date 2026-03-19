import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Chat from "./pages/Chat";
import CreditAppraisal from "./pages/CreditAppraisal";
import UserManagement from "./pages/UserManagement";
import ProductAnalytics from "./pages/ProductAnalytics";
import Profile from "./pages/Profile";
import SentimentAnalysis from "./pages/SentimentAnalysis";
import DashboardLayout from "./layouts/DashboardLayout";

function PrivateRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route */}
        <Route path="/" element={<Login />} />

        {/* Protected Dashboard Routes */}
        <Route element={<PrivateRoute><DashboardLayout /></PrivateRoute>}>
          <Route path="/chat" element={<Chat />} />
          <Route path="/appraisal" element={<CreditAppraisal />} />
          <Route path="/analytics" element={<ProductAnalytics />} />
          <Route path="/sentiment" element={<SentimentAnalysis />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/profile" element={<Profile />} />
        </Route>

        {/* Catch all redirect */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;