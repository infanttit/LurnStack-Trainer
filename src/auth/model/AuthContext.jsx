import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  authenticateTrainer,
  authenticateWithToken,
  authenticateUser,
  getCurrentUser,
  logoutUser,
  registerTrainer,
  registerUser,
} from "./authStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [bootstrapped, setBootstrapped] = useState(false);

  useEffect(() => {
    setUser(getCurrentUser());
    setBootstrapped(true);
  }, []);

  const value = useMemo(() => {
    return {
      user,
      isAuthenticated: !!user,
      userRole: user?.role || "student",
      isTrainer: user?.role === "trainer",
      signUp: async ({ fullName, email, phoneNumber, password, role = "student" }) => {
        const next =
          role === "trainer"
            ? await registerTrainer({ fullName, email, phoneNumber, password, persist: true })
            : await registerUser({ fullName, email, phoneNumber, password, persist: true });
        setUser(next || null);
        return next || null;
      },
      signIn: async ({ email, password, remember = true, role = "student" }) => {
        logoutUser();
        setUser(null);
        try {
          const next =
            role === "trainer"
              ? await authenticateTrainer({ email, password, persist: !!remember })
              : await authenticateUser({ email, password, persist: !!remember });
          setUser(next || null);
          return next || null;
        } catch (err) {
          logoutUser();
          setUser(null);
          throw err;
        }
      },
      signInWithToken: async ({ token, remember = true }) => {
        const next = await authenticateWithToken({ token, persist: !!remember });
        setUser(next || null);
        return next || null;
      },
      signOut: async () => {
        logoutUser();
        setUser(null);
      },
      bootstrapped,
    };
  }, [user, bootstrapped]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider />");
  return ctx;
}

