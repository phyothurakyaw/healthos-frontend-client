
import React, { useState } from "react";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Mail,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
} from "lucide-react";

import {
  confirmEmail,
  resendConfirmation,
  getCurrentUser,
} from "../security/api";

export default function EmailVerificationPage({
  onVerified,
}) {
  const location = useLocation();
  const navigate = useNavigate();

  const email = location.state?.email || "";

  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState(
    location.state?.message || ""
  );

  async function handleVerify(event) {
    event.preventDefault();

    if (!email) {
      setError(
        "Email address is missing. Please register again."
      );
      return;
    }

    if (!/^\d{6}$/.test(code)) {
      setError(
        "Please enter a valid 6-digit verification code."
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await confirmEmail(
        email,
        code
      );

      // The backend must establish an authenticated
      // session, either via JWT or HttpOnly cookie.
      let verifiedUser = result.user || null;

      if (!verifiedUser) {
        const session = await getCurrentUser();
        verifiedUser = session.user || null;
      }

      if (!verifiedUser) {
        throw new Error(
          "Email verified, but no authenticated session was created. Please log in."
        );
      }

      // Update App.jsx authentication state.
      if (onVerified) {
        onVerified(verifiedUser);
      } else {
        navigate("/dashboard", {
          replace: true,
        });
      }
    } catch (err) {
      setError(
        err.message || "Verification failed."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (!email) {
      setError(
        "Email address is missing. Please register again."
      );
      return;
    }

    setResending(true);
    setError("");
    setMessage("");

    try {
      const result = await resendConfirmation(
        email
      );

      setMessage(
        result.message ||
          "A new verification code has been sent."
      );
    } catch (err) {
      setError(
        err.message ||
          "Could not resend verification code."
      );
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="rounded-2xl bg-emerald-500/10 p-4">
            <Mail
              size={36}
              className="text-emerald-400"
            />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-white text-center">
          Verify Your Email
        </h1>

        <p className="text-slate-400 text-center mt-3">
          We sent a verification code to
        </p>

        <p className="text-emerald-400 font-semibold text-center mt-2">
          {email || "your email address"}
        </p>

        <form
          onSubmit={handleVerify}
          className="mt-8 space-y-5"
        >
          <div>
            <label className="block text-sm text-slate-300 mb-2">
              Verification Code
            </label>

            <input
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(event) =>
                setCode(
                  event.target.value.replace(
                    /\D/g,
                    ""
                  )
                )
              }
              placeholder="Enter 6-digit code"
              className="w-full rounded-xl border border-white/10 bg-slate-800 px-4 py-4 text-center text-xl tracking-[0.3em] text-white outline-none focus:border-emerald-400"
              required
            />
          </div>

          {error && (
            <p
              role="alert"
              className="text-red-400 text-sm text-center"
            >
              {error}
            </p>
          )}

          {message && (
            <p
              role="status"
              className="text-emerald-400 text-sm text-center"
            >
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-500 py-4 font-semibold text-slate-950 hover:bg-emerald-400 disabled:opacity-50"
          >
            <ShieldCheck size={20} />

            {loading
              ? "Verifying..."
              : "Verify Email"}

            {!loading && (
              <ArrowRight size={18} />
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-400 text-sm">
            Didn't receive the code?
          </p>

          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className="mt-2 inline-flex items-center gap-2 text-emerald-400 hover:text-emerald-300 disabled:opacity-50"
          >
            <RefreshCw size={16} />

            {resending
              ? "Sending..."
              : "Resend Verification Code"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => navigate("/login")}
          className="mt-8 w-full text-center text-sm text-slate-400 hover:text-white"
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}
