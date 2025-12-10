import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster as HotToaster } from "react-hot-toast";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ComplaintProvider } from "./context/ComplaintContext";
import { Login } from "./components/Login";
import { Register } from "./components/Register";
import { CitizenDashboard } from "./components/CitizenDashboard";
import { OfficerDashboard } from "./components/OfficerDashboard";
import AdminDashboard from "./components/AdminDashboard";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { normalizeRole, isRole } from "./utils/roleUtils";

const queryClient = new QueryClient();

type View = "login" | "register";

const AppContent = () => {
  const { user, loading } = useAuth();
  const [view, setView] = useState<View>("login");

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  // NOT LOGGED IN
  if (!user) {
    return (
      <>
        {view === "login" ? (
          <Login onSwitchToRegister={() => setView("register")} />
        ) : (
          <Register onSwitchToLogin={() => setView("login")} />
        )}
      </>
    );
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
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600 mb-4">
              Invalid Role
            </h1>
            <p className="text-slate-600">Role: {user.role}</p>
            <button
              onClick={() => {
                localStorage.clear();
                window.location.reload();
              }}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg"
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
            background: "#363636",
            color: "#fff",
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: "#10b981",
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
