import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { LogIn, Mail, Lock, ArrowRight } from "lucide-react";

interface LoginProps {
  onSwitchToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ✅ Login Handler
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    await login(email, password); // ✅ This should save token internally
    console.log("✅ Token after login:", localStorage.getItem('resolveit_token')); // ADD THIS
  } catch (err) {
    // error handling
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="card-premium p-8 md:p-10">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-600 rounded-2xl mb-6 shadow-2xl glow-blue">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <h1 className="typography-h3 mb-2 text-gradient">Welcome Back</h1>
            <p className="text-slate-600">Access your complaint management portal</p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selector */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["citizen", "officer", "admin"] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                      role === r
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900"
                    }`}
                  >
                    {r === "citizen"
                      ? "Citizen"
                      : r === "officer"
                      ? "Officer"
                      : "Admin"}
                  </button>
                ))}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field pl-12"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-12"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Error Handling */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up">
                {error}
              </div>
            )}

            {/* Login Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center space-x-2 group"
            >
              <span>{loading ? "Signing in..." : "Sign In"}</span>
              {!loading && (
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </form>

          {/* Footer Section */}
          <div className="mt-6 p-4 bg-slate-50 rounded-xl text-center">
            {role === "citizen" && (
              <>
                <p className="text-slate-600 text-sm mb-3">New to ResolveIt?</p>
                <button
                  onClick={onSwitchToRegister}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline transition-colors"
                >
                  Create an account now
                </button>
              </>
            )}

            {role === "officer" && (
              <>
                <p className="text-slate-600 text-sm mb-3">
                  New Officer? Register for admin approval.
                </p>
                <button
                  onClick={onSwitchToRegister}
                  className="text-blue-600 hover:text-blue-700 font-semibold text-sm hover:underline transition-colors"
                >
                  Officer Registration
                </button>
              </>
            )}

            {role === "admin" && (
              <div className="bg-blue-50 rounded-xl p-3 mt-2 text-sm text-slate-700">
                <p className="font-semibold text-blue-700">Admin Login Details (Demo)</p>
                <p>Email: <span className="text-blue-800 font-medium">admin@123.io</span></p>
                <p>Password: <span className="text-blue-800 font-medium">admin@123</span></p>
              </div>
            )}
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          Secure • Encrypted • Fast Authentication
        </p>
      </div>
    </div>
  );
};
