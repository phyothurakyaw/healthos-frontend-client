
import React from "react";
import AuthForm from "./AuthForm.jsx";

export default function LoginPage(props) {
  return (
    <AuthForm
      {...props}
      authMode={
        props.authMode === "forgot" ||
        props.authMode === "reset"
          ? props.authMode
          : "login"
      }
    />
  );
}
