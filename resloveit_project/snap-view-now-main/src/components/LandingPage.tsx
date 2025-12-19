import React, { useState } from 'react';
import { CheckCircle2, MapPin, AlertTriangle, BarChart3, ArrowRight, Shield, Clock, Users } from 'lucide-react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToRegister: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigateToLogin, onNavigateToRegister }) => {
  const [showLoginModal, setShowLoginModal] = React.useState(false);
  const [showRegisterModal, setShowRegisterModal] = React.useState(false);

  const handleLoginClick = () => {
    setShowLoginModal(true);
  };

  const handleRegisterClick = () => {
    setShowRegisterModal(true);
  };

  return (
    <>
      {showLoginModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/Complaint-mgt.jpg)',
            }}
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          
          {/* Login Component */}
          <div className="relative z-10 w-full max-w-md animate-fade-in">
            <div className="relative backdrop-blur-2xl bg-slate-800/40 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
              <button
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Welcome Back</h1>
                <p className="text-white/80 drop-shadow">Access your complaint management portal</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    onNavigateToLogin();
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Continue to Login
                </button>
                <button
                  onClick={() => {
                    setShowLoginModal(false);
                    setShowRegisterModal(true);
                  }}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-semibold py-4 px-6 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Create New Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showRegisterModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Background Image Layer */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage: 'url(/image.png)',
            }}
          />
          
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />
          
          {/* Register Component */}
          <div className="relative z-10 w-full max-w-md animate-fade-in">
            <div className="relative backdrop-blur-2xl bg-slate-800/40 rounded-3xl border border-white/20 shadow-2xl p-8 md:p-10">
              <button
                onClick={() => setShowRegisterModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors z-10"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-2xl">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                  </svg>
                </div>
                <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-lg">Get Started</h1>
                <p className="text-white/80 drop-shadow">Create your account to file complaints</p>
              </div>

              <div className="space-y-4">
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    onNavigateToRegister();
                  }}
                  className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                >
                  Continue to Register
                </button>
                <button
                  onClick={() => {
                    setShowRegisterModal(false);
                    setShowLoginModal(true);
                  }}
                  className="w-full bg-white/10 backdrop-blur-sm border-2 border-white/20 text-white font-semibold py-4 px-6 rounded-xl hover:bg-white/20 transition-all duration-300"
                >
                  Already have an account?
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <span className="text-white font-bold text-xl hidden sm:inline">ResolveIt</span>
          </div>
          <button
            onClick={handleLoginClick}
            className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lg"
          >
            Sign In
          </button>
        </div>
    </nav>

    {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight">
                Smart Complaint
                <br />
                <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  Management
                </span>
                <br />
                Platform
              </h1>
              <p className="text-lg text-slate-300 max-w-md leading-relaxed">
                AI-powered complaint resolution with real-time SLA tracking, automated escalation, and comprehensive analytics dashboard.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button
                onClick={handleLoginClick}
                className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lg flex items-center justify-center space-x-2"
              >
                <span>Get Started</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={handleRegisterClick}
                className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition border border-slate-600"
              >
                Create Account
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-2">
                <p className="text-3xl font-bold text-cyan-400">98%</p>
                <p className="text-sm text-slate-400">SLA Compliance</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-cyan-400">2.4h</p>
                <p className="text-sm text-slate-400">Avg Response</p>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-cyan-400">Real-time</p>
                <p className="text-sm text-slate-400">Tracking</p>
              </div>
            </div>
          </div>

          {/* Right Image - Using inline SVG placeholder */}
          <div className="relative h-96 lg:h-full flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-3xl blur-3xl"></div>
            <div className="relative w-full h-full flex items-center justify-center">
              <svg viewBox="0 0 800 600" className="w-full h-auto max-w-lg drop-shadow-2xl">
                {/* Main Dashboard */}
                <rect x="100" y="80" width="600" height="400" rx="20" fill="#1e293b" opacity="0.8"/>
                <rect x="100" y="80" width="600" height="60" rx="20" fill="#334155"/>
                
                {/* Header Icons */}
                <circle cx="130" cy="110" r="8" fill="#ef4444"/>
                <circle cx="155" cy="110" r="8" fill="#f59e0b"/>
                <circle cx="180" cy="110" r="8" fill="#10b981"/>
                
                {/* Stats Cards */}
                <rect x="120" y="160" width="160" height="100" rx="10" fill="#0891b2" opacity="0.2"/>
                <rect x="320" y="160" width="160" height="100" rx="10" fill="#3b82f6" opacity="0.2"/>
                <rect x="520" y="160" width="160" height="100" rx="10" fill="#8b5cf6" opacity="0.2"/>
                
                {/* Chart Area */}
                <rect x="120" y="280" width="560" height="180" rx="10" fill="#0f172a" opacity="0.6"/>
                
                {/* Chart Lines */}
                <polyline points="150,380 230,340 310,360 390,320 470,350 550,310 630,330" 
                          fill="none" stroke="#06b6d4" strokeWidth="3"/>
                <polyline points="150,400 230,390 310,410 390,380 470,395 550,370 630,385" 
                          fill="none" stroke="#3b82f6" strokeWidth="3"/>
                
                {/* Floating Elements */}
                <circle cx="650" cy="200" r="30" fill="#06b6d4" opacity="0.6">
                  <animateTransform attributeName="transform" type="translate" 
                                    values="0,0; 0,-10; 0,0" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="80" cy="350" r="25" fill="#3b82f6" opacity="0.6">
                  <animateTransform attributeName="transform" type="translate" 
                                    values="0,0; 0,10; 0,0" dur="4s" repeatCount="indefinite"/>
                </circle>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50 border-t border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Advanced Features</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Enterprise-grade complaint management powered by modern technology stack
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">SLA Management</h3>
              <p className="text-sm text-slate-400">Automated SLA tracking with intelligent escalation and breach prevention</p>
            </div>

            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">Smart Escalation</h3>
              <p className="text-sm text-slate-400">Multi-level escalation system with priority-based routing</p>
            </div>

            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <MapPin className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">Location Services</h3>
              <p className="text-sm text-slate-400">GPS-based complaint mapping with geocoding support</p>
            </div>

            <div className="bg-slate-700/50 backdrop-blur-sm rounded-xl p-6 border border-slate-600 hover:border-cyan-500/50 transition group">
              <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-white mb-2">Analytics Dashboard</h3>
              <p className="text-sm text-slate-400">Real-time insights with interactive charts and metrics</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technology Stack Section - NEW */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Built With Modern Tech</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Leveraging industry-standard technologies for scalability and performance
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { name: 'React 18', desc: 'Modern UI' },
              { name: 'Spring Boot', desc: 'Backend API' },
              { name: 'PostgreSQL', desc: 'Database' },
              { name: 'JWT', desc: 'Security' },
              { name: 'REST API', desc: 'Architecture' },
              { name: 'Recharts', desc: 'Analytics' },
              { name: 'Tailwind', desc: 'Styling' },
              { name: 'TypeScript', desc: 'Type Safety' }
            ].map((tech, idx) => (
              <div key={idx} className="bg-slate-800/50 backdrop-blur-sm rounded-lg p-4 border border-slate-700 text-center hover:border-cyan-500/50 transition">
                <div className="font-bold text-white mb-1">{tech.name}</div>
                <div className="text-xs text-slate-400">{tech.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* User Roles Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-slate-800/50 border-t border-slate-700">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">Role-Based Access</h2>
            <p className="text-slate-300 max-w-2xl mx-auto">
              Tailored experiences for citizens, officers, and administrators
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-900/30 to-blue-800/30 backdrop-blur-sm rounded-2xl p-8 border border-blue-700/30 hover:border-blue-500/50 transition">
              <div className="text-4xl mb-4">👤</div>
              <h3 className="text-xl font-bold text-white mb-3">For Citizens</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Submit complaints with location & attachments</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Real-time status tracking</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>PDF export & feedback system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Anonymous complaint option</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 backdrop-blur-sm rounded-2xl p-8 border border-green-700/30 hover:border-green-500/50 transition">
              <div className="text-4xl mb-4">👷</div>
              <h3 className="text-xl font-bold text-white mb-3">For Officers</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Assigned complaint queue</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Status updates & replies</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Internal notes system</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Performance metrics</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 backdrop-blur-sm rounded-2xl p-8 border border-purple-700/30 hover:border-purple-500/50 transition">
              <div className="text-4xl mb-4">👨‍💼</div>
              <h3 className="text-xl font-bold text-white mb-3">For Admins</h3>
              <ul className="space-y-2 text-slate-300 text-sm">
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Complete system oversight</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Officer management & assignment</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Advanced analytics dashboard</span>
                </li>
                <li className="flex items-start space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <span>Priority & escalation control</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border-t border-slate-700">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <h2 className="text-4xl font-bold text-white">Ready to Transform Complaint Management?</h2>
          <p className="text-lg text-slate-300">Join modern organizations using data-driven complaint resolution</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={handleLoginClick}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lg"
            >
              Sign In
            </button>
            <button
              onClick={handleRegisterClick}
              className="px-8 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition border border-slate-600"
            >
              Create Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <span className="text-white font-bold">ResolveIt</span>
              </div>
              <p className="text-sm text-slate-400">Modern complaint management for efficient governance</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Product</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Features</a></li>
                <li><a href="#" className="hover:text-white transition">Technology</a></li>
                <li><a href="#" className="hover:text-white transition">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Support</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition">Contact</a></li>
                <li><a href="#" className="hover:text-white transition">Status</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-3">Legal</h4>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><a href="#" className="hover:text-white transition">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition">Terms</a></li>
                <li><a href="#" className="hover:text-white transition">Compliance</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8">
            <p className="text-center text-sm text-slate-400">
              © 2024 ResolveIt Complaint Management System. Built for efficient governance.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
};