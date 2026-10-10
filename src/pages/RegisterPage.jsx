
import React from "react";
import AuthForm from "./AuthForm.jsx";

export default function RegisterPage(props) {
  return (
    <AuthForm
      {...props}
      authMode="register"
    />
  );
}
