
import React, { useEffect } from "react";
import AuthForm from "./AuthForm.jsx";

export default function LoginPage(props) {
  const {
    setForm,
    authMode,
  } = props;

  // Clear login fields when the page opens.
  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      email: "",
      password: "",
    }));
  }, [setForm]);

  return (
    <AuthForm
      {...props}
      authMode={
        authMode === "forgot" ||
        authMode === "reset"
          ? authMode
          : "login"
      }
    />
  );
}
