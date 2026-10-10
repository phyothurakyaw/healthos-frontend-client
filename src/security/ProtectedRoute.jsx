
import React from "react";
import { useAuth } from "./AuthContext.jsx";

export default function ProtectedRoute({
  children,
  fallback = null,
}) {
  const auth = useAuth();

  if (!auth) {
    return children;
  }

  if (auth.loading) {
    return <p>Loading session…</p>;
  }

  return auth.user ? children : fallback;
}
