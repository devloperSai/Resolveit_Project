import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { UserRole } from "../types";
import { UserPlus, Mail, Lock, User, ArrowRight, Upload, X } from "lucide-react";

interface RegisterProps {
  onSwitchToLogin: () => void;
  isOverlay?: boolean;
  onClose?: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin, isOverlay = false, onClose }) => {
  const { register } = useAuth();

  // Common fields
  const [role, setRole] = useState<UserRole>("citizen");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Officer-specific fields
  const [officerAge, setOfficerAge] = useState("");
  const [officerGender, setOfficerGender] = useState("");
  const [officerDepartment, setOfficerDepartment] = useState("");
  const [officerCertificate, setOfficerCertificate] = useState<File | null>(null);

  const handleCertificateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setOfficerCertificate(file);
  };

  const resetAll = () => {
    setName("");
    setEmail("");
    setPassword("");
    setOfficerAge("");
    setOfficerGender("");
    setOfficerDepartment("");
    setOfficerCertificate(null);
    setError("");
  };

  const handleCitizenSubmit = async () => {
    setError("");
    setLoading(true);

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      await register(email, password, name, "citizen");
      alert("✅ Account created successfully! You can now sign in.");
      resetAll();
      onSwitchToLogin();
    } catch (err: any) {
      console.error(err);
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOfficerSubmit = async () => {
    setError("");
    setLoading(true);

    if (!name || !email || !password || !officerAge || !officerGender || !officerDepartment) {
      setError("Please fill in all officer fields");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("department", officerDepartment);
      formData.append("age", officerAge);
      formData.append("gender", officerGender);
      if (officerCertificate) formData.append("certificate", officerCertificate);

      const res = await fetch("http://localhost:8080/api/officers/register", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const msg = await res.text().catch(() => "Officer registration failed");
        throw new Error(msg);
      }

      alert("✅ Officer application submitted successfully! Awaiting admin approval.");
      resetAll();
      onSwitchToLogin();
    } catch (err: any) {
      console.error(err);
      setError(
        err?.message?.includes("approval")
          ? "Your registration is pending admin approval."
          : err?.message || "Officer registration failed. Please try again."
      );
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
    <div className="w-full max-w-md relative animate-fade-in">
      <div className="relative backdrop-blur-2xl bg-white/10 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
        {isOverlay && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
          >
            <X className="w-6 h-6" />
          </button>
        )}

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Get Started</h1>
          <p className="text-white/80 drop-shadow">Create your account to file and track complaints</p>
          <p className="text-xs text-white/60 mt-2">(Admin accounts cannot be created manually)</p>
        </div>

        {/* Role Selector */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-white/90 mb-3 drop-shadow">Select Your Role</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setRole("citizen")}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                role === "citizen"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105"
                  : "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm border border-white/20"
              }`}
            >
              Citizen
            </button>

            <button
              type="button"
              onClick={() => setRole("officer")}
              className={`py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-300 ${
                role === "officer"
                  ? "bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg scale-105"
                  : "bg-white/10 text-white/80 hover:bg-white/20 backdrop-blur-sm border border-white/20"
              }`}
            >
              Officer
            </button>
          </div>
        </div>

        {/* Citizen Form */}
        {role === "citizen" && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Email Address</label>
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

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up">
                {error}
              </div>
            )}

            <button
              onClick={handleCitizenSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="text-lg">{loading ? "Creating account..." : "Create Account"}</span>
              {!loading && <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />}
            </button>
          </div>
        )}

        {/* Officer Form */}
        {role === "officer" && (
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Full Name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  placeholder="John Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Age</label>
                <input
                  type="number"
                  value={officerAge}
                  onChange={(e) => setOfficerAge(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  placeholder="Age"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Gender</label>
                <select
                  value={officerGender}
                  onChange={(e) => setOfficerGender(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                >
                  <option value="" className="bg-slate-800">Select Gender</option>
                  <option className="bg-slate-800">Male</option>
                  <option className="bg-slate-800">Female</option>
                  <option className="bg-slate-800">Other</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Department</label>
              <select
                value={officerDepartment}
                onChange={(e) => setOfficerDepartment(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
              >
                <option value="" className="bg-slate-800">Select Department</option>
                <option className="bg-slate-800">Infrastructure</option>
                <option className="bg-slate-800">Utilities</option>
                <option className="bg-slate-800">Public Safety</option>
                <option className="bg-slate-800">Sanitation</option>
                <option className="bg-slate-800">Transport</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Certificate Upload</label>
              <div className="relative">
                <Upload className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <input
                  type="file"
                  accept=".pdf,.jpg,.png"
                  onChange={handleCertificateUpload}
                  className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500 file:text-white hover:file:bg-amber-600 transition-all duration-200"
                />
              </div>
              {officerCertificate && (
                <p className="text-xs text-white/70 mt-1">{officerCertificate.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  placeholder="official@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-white/90 mb-2 drop-shadow">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/60 pointer-events-none" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pl-12 bg-white/10 backdrop-blur-sm border-2 border-white/20 rounded-xl text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-amber-500/50 transition-all duration-200"
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            {error && (
              <div className="bg-red-500/20 backdrop-blur-sm border border-red-400/30 text-white px-4 py-3 rounded-xl text-sm font-medium animate-slide-in-up">
                {error}
              </div>
            )}

            <button
              onClick={handleOfficerSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 flex items-center justify-center space-x-2 group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <span className="text-lg">{loading ? "Submitting..." : "Submit for Approval"}</span>
              {!loading && (
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              )}
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 text-center">
          <p className="text-white/80 text-sm mb-3">Already registered?</p>
          <button
            onClick={onSwitchToLogin}
            className="text-amber-400 hover:text-amber-300 font-semibold text-sm hover:underline transition-colors"
          >
            Sign in to your account
          </button>
        </div>
      </div>

      <p className="text-center text-white/60 text-xs mt-6 drop-shadow">
        Quick • Secure • Free to use
      </p>
    </div>
  );

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

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: 'url(/image.png)',
          filter: 'brightness(0.4)'
        }}
      />
      
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-slate-900/60" />
      
      {content}
    </div>
  );
};