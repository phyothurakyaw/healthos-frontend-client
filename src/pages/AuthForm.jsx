import React from "react";
import { Activity } from "lucide-react";

export default function AuthPage({T,authMode,setAuthMode,form,setForm,submitAuth,busy,message,devLink,resendVerification,setDemo,setMessage,lang,setLang,languages}) {
 return (
<div className="app min-h-screen flex items-center justify-center p-5">
        <div className="panel w-full max-w-md p-8">
          <div className="flex items-center gap-3 mb-3">
            <Activity className="accent" size={35} />

            <h1 className="text-3xl font-bold">
              Health<span className="accent">OS</span>
            </h1>
          </div>

          <p className="muted mb-7">
            {T("subtitle")}
          </p>

          <h2 className="text-2xl font-semibold mb-5">
            {authMode === "register"
              ? T("signUp")
              : authMode === "forgot"
                ? T("forgot")
                : authMode === "reset"
                  ? T("reset")
                  : T("signIn")}
          </h2>

          <form
            onSubmit={submitAuth}
            className="space-y-4"
          >
            {authMode === "register" && (
              <input
                className="field"
                required
                placeholder={T("name")}
                value={form.name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />
            )}

            <input
              className="field"
              type="email"
              required
              placeholder={T("email")}
              value={form.email}
              onChange={(event) =>
                setForm({
                  ...form,
                  email: event.target.value,
                })
              }
            />

            {authMode !== "forgot" && (
              <input
                className="field"
                type="password"
                required
                minLength={authMode === "login" ? 1 : 8}
                placeholder={T("password")}
                value={form.password}
                onChange={(event) =>
                  setForm({
                    ...form,
                    password: event.target.value,
                  })
                }
              />
            )}

            <button
              type="submit"
              className="btn w-full"
              disabled={busy}
            >
              {busy
                ? "Please wait…"
                : authMode === "register"
                  ? T("signUp")
                  : authMode === "forgot"
                    ? "Send 6-digit code"
                    : authMode === "reset"
                      ? T("reset")
                      : T("signIn")}
            </button>
          </form>

          {message && (
            <p
              className="mt-4 text-sm accent"
              role="status"
            >
              {message}
            </p>
          )}

          {devLink && (
            <p className="mt-3 text-sm">
              <a
                href={devLink}
                className="underline"
              >
                Verify account (local development only)
              </a>
            </p>
          )}

          <div className="flex flex-wrap gap-3 mt-6 mb-2 pt-2 text-sm justify-between">
            <button
              type="button" className="no-underline hover:underline"
              onClick={() => {
                setAuthMode(
                  authMode === "register"
                    ? "login"
                    : "register"
                );
                setMessage("");
              }}
            >
              {authMode === "register"
                ? T("signIn")
                : T("signUp")}
            </button>

            <button
              type="button" className="no-underline hover:underline"
              onClick={() => {
                setAuthMode("forgot");
                setMessage("");
              }}
            >
              {T("forgot")}
            </button>

            {/* <button
              type="button" className="no-underline hover:underline"
              disabled={busy || !form.email}
              onClick={resendVerification}
            >
              Resend verification email
            </button> */}

            <button
              type="button" className="no-underline hover:underline"
              onClick={() => {
                setDemo(true);
                setMessage("");
              }}
            >
              {T("demo")}
            </button>
          </div>

          {/* <div className="mt-6">
            <select
              className="field"
              value={lang}
              onChange={(event) =>
                setLang(event.target.value)
              }
            >
              {Object.entries(languages).map(
                ([key, value]) => (
                  <option key={key} value={key}>
                    {value}
                  </option>
                )
              )}
            </select>
          </div> */}
        </div>
      </div>
 );
}
