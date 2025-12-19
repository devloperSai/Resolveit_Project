import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ComplaintProvider } from "./context/ComplaintContext";
import { LandingPage } from "./components/LandingPage";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { CitizenDashboard } from "./components/CitizenDashboard";
import { OfficerDashboard } from "./components/OfficerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { normalizeRole } from "./utils/roleUtils";

const queryClient = new QueryClient();

type View = "landing" | "login" | "register";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>("landing");

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-amber-500 animate-spin mx-auto mb-4" />
          <p className="text-white/80 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN - Show landing page or auth forms
  if (!user) {
    if (view === "landing") {
      return (
        <LandingPage
          onNavigateToLogin={() => setView("login")}
          onNavigateToRegister={() => setView("register")}
        />
      );
    }

    if (view === "login") {
      return (
        <Login 
          onSwitchToRegister={() => setView("register")}
          isOverlay={false}
        />
      );
    }

    if (view === "register") {
      return (
        <Register 
          onSwitchToLogin={() => setView("login")}
          isOverlay={false}
        />
      );
    }
  }

  // LOGGED IN - Route by normalized role
  const role = normalizeRole(user.role);

  switch (role) {
    case "citizen":
      return <CitizenDashboard />;

    case "officer":
      return <OfficerDashboard />;

    case "admin":
      return <AdminDashboard />;

    default:
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="text-center bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Invalid Role
            </h1>
            <p className="text-white/80 mb-4">Role: {user.role}</p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="px-6 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-lg hover:from-red-600 hover:to-red-700 transition"
            >
              Clear & Restart
            </button>
          </div>
        </div>
      );
  }
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HotToaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#fff",
            border: "1px solid rgba(251, 191, 36, 0.2)",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#f59e0b",
              secondary: "#fff",
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: "#ef4444",
              secondary: "#fff",
            },
          },
        }}
      />
      <AuthProvider>
        <ComplaintProvider>
          <AppContent />
        </ComplaintProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;