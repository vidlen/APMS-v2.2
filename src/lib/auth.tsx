import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

const SESSION_KEY = "apms-admin-session";

// Admin credentials. Change either by editing these constants directly.
//
// This is a client-side gate only — good enough to keep casual visitors
// from editing survey data, not a substitute for real server-side auth.
// (Since the whole app bundle ships to the browser, anyone who opens dev
// tools can read these values regardless of whether the password is
// hashed, so it's kept as plain text here for simplicity.)
const ADMIN_USERNAME = "SHIAPMS";
const ADMIN_PASSWORD = "apms-admin";

interface AuthContextValue {
  isAdmin: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof sessionStorage === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) === "true";
  });

  const login = useCallback(async (username: string, password: string) => {
    const ok = username.trim() === ADMIN_USERNAME && password === ADMIN_PASSWORD;
    if (ok) {
      setIsAdmin(true);
      sessionStorage.setItem(SESSION_KEY, "true");
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    setIsAdmin(false);
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const value = useMemo(() => ({ isAdmin, login, logout }), [isAdmin, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
