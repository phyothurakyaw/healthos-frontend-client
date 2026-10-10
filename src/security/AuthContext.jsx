
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { api } from "./api.js";

const Context = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/auth/me")
      .then((data) => {
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const logout = async () => {
    await api("/auth/logout", {
      method: "POST",
    });

    setUser(null);
  };

  return (
    <Context.Provider
      value={{
        user,
        setUser,
        loading,
        logout,
      }}
    >
      {children}
    </Context.Provider>
  );
}

export const useAuth = () => useContext(Context);
