import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("user");
      const savedToken = localStorage.getItem("token");
      const parsedUser = savedUser ? JSON.parse(savedUser) : null;

      if (
        parsedUser &&
        typeof parsedUser === "object" &&
        savedToken &&
        savedToken !== "undefined" &&
        savedToken !== "null"
      ) {
        setUser(parsedUser);
        setToken(savedToken);
      } else {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } catch (error) {
      console.error("Failed to load user:", error);
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // =========================
  // LOGIN
  // =========================

  const login = (userData, userToken) => {
    if (!userData || !userToken) {
      throw new Error("Login response is missing authentication data");
    }

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", userToken);

    setUser(userData);
    setToken(userToken);
    setIsLoading(false);
  };

  // =========================
  // UPDATE USER
  // =========================

  const updateUser = (updatedData) => {
    setUser((currentUser) => {
      const updatedUser = {
        ...currentUser,
        ...updatedData,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));

      return updatedUser;
    });
  };

  // =========================
  // LOGOUT
  // =========================

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  const isLoggedIn = Boolean(user && token);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoggedIn,
        isLoading,
        login,
        updateUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// =========================
// CUSTOM HOOK
// =========================

export const useAuth = () => {
  return useContext(AuthContext);
};
