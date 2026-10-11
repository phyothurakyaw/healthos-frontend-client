
const API_URL = (
  import.meta.env.VITE_API_URL || "/api"
).replace(/\/+$/, "");

const TOKEN_KEY = "healthos_token";
const USER_KEY = "healthos_user";

// ========================================
// Session Management
// ========================================

export function getToken() {
  return sessionStorage.getItem(TOKEN_KEY);
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

export function saveSession({ token, user }) {
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

export function clearSession() {
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
}

// ========================================
// API Request Helper
// ========================================

export async function api(path, options = {}) {
  const token = getToken();

  const url = `${API_URL}/${path.replace(/^\/+/, "")}`;

  const headers = {
    ...(options.body != null &&
    !(options.body instanceof FormData)
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
      credentials: "include",
      headers,
    });
  } catch {
    throw new Error(
      "Cannot connect to HealthOS backend. Check your API URL and server."
    );
  }

  const contentType =
    response.headers.get("content-type") || "";

  let data = {};

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => ({}));
  } else {
    const text = await response.text();
    data = text ? { message: text } : {};
  }

  if (!response.ok) {
    throw new Error(
      data.message ||
      data.error ||
      `Request failed (${response.status})`
    );
  }

  return data;
}

// ========================================
// Authentication APIs
// ========================================

// Register
export async function register(name, email, password) {
  const result = await api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  // Save only when the backend returns
  // an authenticated session.
  if (result.token) {
    saveSession(result);
  }

  return result;
}

// Login
export async function login(email, password) {
  const result = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      password,
    }),
  });

  saveSession(result);

  return result;
}

// Logout
export async function logout() {
  try {
    return await api("/auth/logout", {
      method: "POST",
    });
  } finally {
    clearSession();
  }
}

// Get current user
export async function getCurrentUser() {
  const result = await api("/auth/me");

  if (result.user) {
    saveSession({
      user: result.user,
    });
  }

  return result;
}

// ========================================
// Email Confirmation APIs
// ========================================

// Confirm email with verification code
export async function confirmEmail(email, code) {
  const result = await api("/auth/confirm-email", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
      code: String(code).trim(),
    }),
  });

  if (result.token) {
    saveSession(result);
  }

  return result;
}

// Resend email confirmation
export async function resendConfirmation(email) {
  return api("/auth/resend-confirmation", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });
}

// ========================================
// Password Recovery APIs
// ========================================

export async function forgotPassword(email) {
  return api("/auth/forgot", {
    method: "POST",
    body: JSON.stringify({
      email: email.trim().toLowerCase(),
    }),
  });
}

export async function resetPassword(payload) {
  return api("/auth/reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
