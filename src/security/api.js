
/**
 * HealthOS API Client
 *
 * Backend URL is configured only in .env:
 *
 * VITE_API_URL=https://healthos-backend-production-51cc.up.railway.app/api
 */

// ========================================
// API Configuration
// ========================================

const rawApiUrl = import.meta.env.VITE_API_URL;

if (!rawApiUrl || !rawApiUrl.trim()) {
  throw new Error(
    "VITE_API_URL is missing. Add it to your .env file or Netlify environment variables."
  );
}

const API_URL = rawApiUrl.trim().replace(/\/+$/, "");

if (!/^https?:\/\//i.test(API_URL)) {
  throw new Error(
    "Invalid VITE_API_URL. The backend URL must start with https:// or http://."
  );
}

// ========================================
// Session Storage
// ========================================

const TOKEN_KEY = "healthos_token";
const USER_KEY = "healthos_user";

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveSession({ token, user } = {}) {
  if (token) {
    sessionStorage.setItem(TOKEN_KEY, token);
  }

  if (user) {
    sessionStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  }
}

export function getSavedUser() {
  try {
    return JSON.parse(
      sessionStorage.getItem(USER_KEY) || "null"
    );
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// ========================================
// Main API Request Function
// ========================================

export async function api(path, options = {}) {
  const token = getToken();

  // Only allow relative API paths.
  // Example: "/auth/login"
  const cleanPath = String(path || "")
    .replace(/^\/+/, "");

  if (
    !cleanPath ||
    /^https?:\/\//i.test(cleanPath) ||
    cleanPath.startsWith("//")
  ) {
    throw new Error("Invalid API endpoint path.");
  }

  const url = `${API_URL}/${cleanPath}`;

  const headers = {
    ...(options.body != null
      ? { "Content-Type": "application/json" }
      : {}),

    ...(token
      ? { Authorization: `Bearer ${token}` }
      : {}),

    ...options.headers,
  };

  let response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      credentials: "include",
    });
  } catch (error) {
    console.error(
      "HealthOS backend connection failed:",
      error
    );

    throw new Error(
      "Cannot connect to HealthOS backend. Check the Railway server, API URL, and CORS settings."
    );
  }

  const data = await response
    .json()
    .catch(() => ({}));

  if (!response.ok) {
    const error = new Error(
      data.message ||
      data.error ||
      `Request failed (${response.status})`
    );

    error.status = response.status;

    throw error;
  }

  return data;
}

// ========================================
// Authentication
// ========================================

export async function register(name, email, password) {
  return api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: String(name || "").trim(),
      email: String(email || "").trim().toLowerCase(),
      password,
    }),
  });
}

export async function login(email, password) {
  const result = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      password,
    }),
  });

  // Do not save a session for explicitly
  // unverified users.
  if (
    result.user?.emailVerified === false ||
    result.user?.isVerified === false
  ) {
    clearSession();
    return result;
  }

  if (result.user) {
    saveSession(result);
  }

  return result;
}

export async function logout() {
  try {
    return await api("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearSession();
  }
}

export async function getCurrentUser() {
  return api("/auth/me");
}

// ========================================
// Email Verification
// ========================================

export async function confirmEmail(email, code) {
  const result = await api("/auth/confirm-email", {
    method: "POST",
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
      code: String(code || "").trim(),
    }),
  });

  // If the backend returns an authenticated
  // session after verification, save it.
  if (
    result.user &&
    result.user.emailVerified !== false &&
    result.user.isVerified !== false
  ) {
    saveSession(result);
  }

  return result;
}

export async function resendConfirmation(email) {
  return api("/auth/resend-confirmation", {
    method: "POST",
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
    }),
  });
}

// Alias for components using this name.
export const resendVerification = resendConfirmation;

// ========================================
// Password Recovery
// ========================================

export async function forgotPassword(email) {
  return api("/auth/forgot", {
    method: "POST",
    body: JSON.stringify({
      email: String(email || "").trim().toLowerCase(),
    }),
  });
}

export async function resetPassword(payload) {
  return api("/auth/reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ========================================
// Tasks and Check-ins
// ========================================

export async function getUserData() {
  return api("/data");
}

export async function saveUserData({
  tasks,
  checkins,
}) {
  return api("/data", {
    method: "PUT",
    body: JSON.stringify({
      tasks,
      checkins,
    }),
  });
}

// ========================================
// Translation
// ========================================

export async function translateText({
  text,
  source,
  target,
}) {
  return api("/translate", {
    method: "POST",
    body: JSON.stringify({
      text,
      source,
      target,
    }),
  });
}
