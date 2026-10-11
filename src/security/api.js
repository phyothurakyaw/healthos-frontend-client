
const API_URL = (
  import.meta.env.VITE_API_URL ||
  "http://localhost:5030/api"
).replace(/\/+$/, "");

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

export async function api(path, options = {}) {
  const token = getToken();

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
    response = await fetch(
      `${API_URL}/${path.replace(/^\/+/, "")}`,
      {
        ...options,
        headers,
        credentials: "include",
      }
    );
  } catch {
    throw new Error(
      "Cannot connect to HealthOS backend."
    );
  }

  const data = await response.json().catch(() => ({}));

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
// Authentication
// ========================================

export async function register(name, email, password) {
  return api("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });
}

export async function login(email, password) {
  const result = await api("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });

  if (
    result.user &&
    result.user.emailVerified !== false &&
    result.user.isVerified !== false
  ) {
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
      email,
      code,
    }),
  });

  if (
    result.token &&
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
    body: JSON.stringify({ email }),
  });
}

// ========================================
// Password Recovery
// ========================================

export async function forgotPassword(email) {
  return api("/auth/forgot", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(payload) {
  return api("/auth/reset", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
