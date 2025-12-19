import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { LogIn, Mail, Lock, ArrowRight, X } from "lucide-react";

interface LoginProps {
  onSwitchToRegister: () => void;
  isOverlay?: boolean;
  onClose?: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSwitchToRegister, isOverlay = false, onClose }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("citizen");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (!email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }

    try {
      await login(email, password);
    } catch (err: any) {
      setError(err?.message || "Invalid credentials. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isOverlay && onClose && e.target === e.currentTarget) {
      onClose();
    }
  };

  const content = (
    <div className="w-full max-w-md relative animate-fade-in z-20">
      {/* Glassmorphism Card */}
      <div className="relative backdrop-blur-2xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
        {/* Close button for overlay mode */}
        {isOverlay && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
            <LogIn className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Welcome Back</h1>
          <p className="text-white/80 drop-shadow">Access your complaint management portal</p>
        </div>

        {/* Login Section */}
        <div className="space-y-6">
          {/* Role Selector */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-3 drop-shadow">
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
                      ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105"
                      : "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm border border-white/20"
                  }`}
                >
                  {r === "citizen" ? "Citizen" : r === "officer" ? "Officer" : "Admin"}
                </button>
              ))}
            </div>
          </div>

          {/* Email Field */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Email</label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Error Handling */}
          {error && (
            <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            <span className="text-lg">{loading ? "Signing in..." : "Sign In"}</span>
            {!loading && (
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            )}
          </button>
        </div>

        {/* Footer Section */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-center">
          {role === "citizen" && (
            <>
              <p className="text-white/80 text-sm mb-3">New to ResolveIt?</p>
              <button
                onClick={onSwitchToRegister}
                className="text-amber-400 hover:text-amber-300 font-semibold text-sm hover:underline transition-colors"
              >
                Create an account now
              </button>
            </>
          )}

          {role === "officer" && (
            <>
              <p className="text-white/80 text-sm mb-3">
                New Officer? Register for admin approval.
              </p>
              <button
                onClick={onSwitchToRegister}
                className="text-amber-400 hover:text-amber-300 font-semibold text-sm hover:underline transition-colors"
              >
                Officer Registration
              </button>
            </>
          )}

          {role === "admin" && (
            <div className="bg-amber-500/10 backdrop-blur-sm rounded-xl p-3 mt-2 text-sm text-white border border-amber-500/20">
              <p className="font-semibold text-amber-400 mb-2">Admin Login Details (Demo)</p>
              <p>Email: <span className="text-amber-300 font-medium">admin@123.io</span></p>
              <p>Password: <span className="text-amber-300 font-medium">admin@123</span></p>
            </div>
          )}
        </div>
      </div>

      <p className="text-center text-white/60 text-xs mt-6 drop-shadow">
        Secure • Encrypted • Fast Authentication
      </p>
    </div>
  );

  // If overlay mode, wrap in modal backdrop
  if (isOverlay) {
    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleBackdropClick}
      >
        {content}
      </div>
    );
  }

  // Full page mode with background image
  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        backgroundImage: 'url(/Complaint-mgt.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-slate-900/50 z-10" />
      
      {content}
    </div>
  );
};