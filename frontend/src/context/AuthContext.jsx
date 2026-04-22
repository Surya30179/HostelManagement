import { createContext, useContext, useState } from "react";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Initialize state directly from localStorage to prevent eager redirects
  const [token, setToken] = useState(() => {
    const saved = localStorage.getItem("token");
    if (saved) {
      try {
        const decoded = jwtDecode(saved);
        if (decoded.exp * 1000 > Date.now()) return saved;
      } catch (e) {}
    }
    return null;
  });

  const [user, setUser] = useState(() => {
    if (token) {
      const savedUser = localStorage.getItem("user");
      return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
  });

  function login(tokenStr, userData) {
    localStorage.setItem("token", tokenStr);
    localStorage.setItem("user", JSON.stringify(userData));
    setToken(tokenStr);
    setUser(userData);
  }

  function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
