import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { UserRole, normalizeRole } from "../utils/roleUtils";

export interface User {
  id?: number | null;
  email: string;
  name: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => Promise<void>;
  logout: () => void;
  getAuthHeaders: () => { [key: string]: string };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = "http://localhost:8080/api";

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem("resolveit_user");
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Read token from the canonical key first, fall back to legacy 'token' key for compatibility
  const [token, setToken] = useState<string | null>(() =>
    localStorage.getItem("resolveit_token") || localStorage.getItem("token")
  );
  const [loading, setLoading] = useState(false);

  // ✅ Restore session if token exists
  useEffect(() => {
    const restoreUser = async () => {
      if (!token || user) return;

      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Session expired");

        const data = await res.json();

        const restoredUser: User = {
          id: data.userId ?? data.id ?? null,
          email: data.email,
          name: data.name,
          role: normalizeRole(data.role), // ✅ normalized here
        };

        setUser(restoredUser);
        localStorage.setItem("resolveit_user", JSON.stringify(restoredUser));
      } catch (err) {
        console.warn("Token restore failed, logging out.");
        logout();
      } finally {
        setLoading(false);
      }
    };

    restoreUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ✅ Login (citizen / officer / admin)
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Invalid credentials");
      }

      const data = await res.json();
      handleAuthSuccess(data);
    } catch (err: any) {
      console.error("Login error:", err);
      alert(err.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Register (Citizen / Officer)
  const register = async (
    email: string,
    password: string,
    name: string,
    role: UserRole
  ) => {
    if (role === "admin") {
      alert("Admin accounts cannot be created manually.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "Registration failed");
      }

      const data = await res.json();
      handleAuthSuccess(data);
    } catch (err: any) {
      console.error("Register error:", err);
      alert(
        err.message || "Registration failed. Please check backend connection."
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Common handler for successful login/register
  const handleAuthSuccess = (data: any) => {
    const token = data.token;
    const role = normalizeRole(data.role); // ✅ normalized here

    const userData: User = {
      id: data.userId ?? null,
      email: data.email,
      name: data.name,
      role, // already normalized
    };

    setToken(token);
    setUser(userData);
    // Write token to both keys for backwards compatibility with other code
    localStorage.setItem("resolveit_token", token);
    localStorage.setItem("token", token);
    localStorage.setItem("resolveit_user", JSON.stringify(userData));
  };

  // ✅ Logout & cleanup
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("resolveit_token");
    localStorage.removeItem("token"); // remove legacy key as well
    localStorage.removeItem("resolveit_user");
  };

  // ✅ Header helper for authorized fetches
  const getAuthHeaders = () =>
    token ? { Authorization: `Bearer ${token}` } : {};

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, logout, getAuthHeaders }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ✅ Safe Hook Export (no circular import)
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context)
    throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
