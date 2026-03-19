import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import API from "../api";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // New 2FA states
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [preAuthToken, setPreAuthToken] = useState("");
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  const handleLoginStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");
    try {
      const params = new URLSearchParams();
      params.append('username', username);
      params.append('password', password);

      const res = await API.post("/token", params);

      if (res.data.require_2fa) {
        setPreAuthToken(res.data.pre_auth_token);
        setMessage(res.data.message || "Enter the code sent to your email.");
        setStep(2);
      } else {
        // Fallback for non-2FA or legacy mode if required
        const token = res.data.access_token;
        localStorage.setItem("token", token);
        const decoded = jwtDecode<{ role: string }>(token);
        localStorage.setItem("role", decoded.role);

        if (decoded.role.toLowerCase() === "admin") {
          navigate("/users");
        } else {
          navigate("/chat");
        }
      }
    } catch (err) {
      setError("Username or Password incorrect");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    try {
      const res = await API.post("/verify-otp", {
        pre_auth_token: preAuthToken,
        otp: otp
      });

      const token = res.data.access_token;
      localStorage.setItem("token", token);
      const decoded = jwtDecode<{ role: string }>(token);
      localStorage.setItem("role", decoded.role);

      if (decoded.role.toLowerCase() === "admin") {
        navigate("/users");
      } else {
        navigate("/chat");
      }
    } catch (err) {
      setError("Invalid OTP code. Please try again.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      {step === 1 ? (
        <form onSubmit={handleLoginStep1} className="bg-white p-8 rounded shadow-md w-80 space-y-4">
          <h1 className="text-2xl font-bold text-center mb-4">Login</h1>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded w-full"
            required
          />
          <button type="submit" disabled={loading} className="bg-blue-600 text-white px-4 py-2 rounded w-full hover:bg-blue-700 font-bold disabled:opacity-50">
            {loading ? "Protecting Account... (Sending OTP)" : "Sign In"}
          </button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP} className="bg-white p-8 rounded shadow-md w-80 space-y-4">
          <h1 className="text-2xl font-bold text-center mb-2">Two-Factor Auth</h1>
          <p className="text-green-600 text-sm text-center font-medium mb-4">{message}</p>
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <input
            type="text"
            placeholder="6-Digit OTP"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="border p-2 rounded w-full text-center tracking-widest text-xl font-bold"
            required
          />
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded w-full hover:bg-green-700 font-bold">
            Verify Code
          </button>
          <button type="button" onClick={() => setStep(1)} className="text-sm text-gray-500 w-full text-center hover:underline mt-2">
            Back to Login
          </button>
        </form>
      )}
    </div>
  );
}