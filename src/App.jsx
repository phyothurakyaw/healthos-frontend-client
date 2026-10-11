
import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
} from "react-router-dom";

import {
  LayoutDashboard,
  ListTodo,
  BarChart3,
  Languages,
  ShieldCheck,
  Dumbbell,
  HeartPulse,
} from "lucide-react";

import Human from "./components/Human3D";

import {
  api,
  register,
  login,
  logout,
  getCurrentUser,
  clearSession,
} from "./security/api";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import EmailVerificationPage from "./pages/EmailVerificationPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import DashboardPage from "./pages/DashboardPage";
import TasksPage from "./pages/TasksPage";
import InsightsPage from "./pages/InsightsPage";
import TranslatePage from "./pages/TranslatePage";
import FitnessPage from "./pages/FitnessPage";
import WellnessPage from "./pages/WellnessPage";

import { t, languages } from "./translate";

// ========================================
// Helpers
// ========================================

const read = (key, fallback) => {
  try {
    return (
      JSON.parse(localStorage.getItem(key)) ??
      fallback
    );
  } catch {
    return fallback;
  }
};

const id = () =>
  globalThis.crypto?.randomUUID?.() ||
  String(Date.now() + Math.random());

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

const isUnverified = (account) =>
  account?.emailVerified === false ||
  account?.isVerified === false;

const emptyForm = () => ({
  name: "",
  email: "",
  password: "",
});

// ========================================
// Initial Tasks
// ========================================

const initial = [
  {
    id: "sample1",
    title: "Review algorithms",
    priority: "high",
    duration: 45,
    deadline: "",
    energy: 75,
    attention: 80,
    done: false,
  },
  {
    id: "sample2",
    title: "Organize study notes",
    priority: "medium",
    duration: 20,
    deadline: "",
    energy: 35,
    attention: 40,
    done: false,
  },
  {
    id: "sample3",
    title: "Reply to messages",
    priority: "low",
    duration: 10,
    deadline: "",
    energy: 20,
    attention: 20,
    done: false,
  },
];

// ========================================
// Task Sorting
// ========================================

const priorityOrder = {
  high: 0,
  medium: 1,
  low: 2,
};

const sortTasks = (a, b) =>
  Number(a.done) - Number(b.done) ||
  (priorityOrder[a.priority] ?? 3) -
    (priorityOrder[b.priority] ?? 3) ||
  (a.deadline || "9999").localeCompare(
    b.deadline || "9999"
  );

// ========================================
// Recommendation Algorithm
// ========================================

function score(task, check) {
  const energy =
    100 - Math.abs(check.energy - task.energy);

  const attention =
    100 - Math.abs(check.attention - task.attention);

  const time =
    task.duration <= check.available
      ? 100
      : Math.max(
          0,
          100 -
            (task.duration - check.available) * 3
        );

  const priority =
    {
      high: 100,
      medium: 65,
      low: 30,
    }[task.priority] ?? 30;

  const days = task.deadline
    ? Math.ceil(
        (new Date(task.deadline) - new Date()) /
          86400000
      )
    : 30;

  const urgency =
    days <= 0
      ? 100
      : days <= 1
        ? 95
        : days <= 3
          ? 80
          : days <= 7
            ? 55
            : 20;

  return Math.round(
    0.3 * energy +
      0.3 * attention +
      0.15 * time +
      0.15 * priority +
      0.1 * urgency
  );
}

// ========================================
// Main App
// ========================================

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  // ======================================
  // Language and Font Size
  // ======================================

  const [lang, setLang] = useState(
    () =>
      localStorage.getItem("healthos_lang") ||
      "en"
  );

  const [font, setFont] = useState(
    () =>
      Number(
        localStorage.getItem("healthos_font") ||
          100
      )
  );

  const [page, setPageState] = useState(
    "dashboard"
  );

  const setPage = (next) => {
    setPageState(next);
    navigate("/" + next);
  };

  useEffect(() => {
    const route = location.pathname.slice(1);

    if (
      [
        "dashboard",
        "fitness",
        "wellness",
        "tasks",
        "insights",
        "translate",
      ].includes(route)
    ) {
      setPageState(route);
    }
  }, [location.pathname]);

  // ======================================
  // Authentication State
  // ======================================

  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const [authMode, setAuthMode] = useState(
    () => {
      const modes = {
        "/login": "login",
        "/register": "register",
        "/forgot-password": "forgot",
        "/reset-password": "reset",
      };

      return (
        modes[location.pathname] || "login"
      );
    }
  );

  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [busy, setBusy] = useState(false);

  // ======================================
  // Authentication Navigation
  // ======================================

  const changeAuthMode = (mode) => {
    setAuthMode(mode);
    setMessage("");
    setDevLink("");

    // Clear the login fields when switching
    // to Login from another auth page.
    if (mode === "login") {
      setForm(emptyForm());
    }

    const routes = {
      login: "/login",
      register: "/register",
      forgot: "/forgot-password",
      reset: "/reset-password",
    };

    navigate(routes[mode] || "/login");
  };

  // ======================================
  // Sync Auth Mode with Browser URL
  // ======================================

  useEffect(() => {
    const routeModes = {
      "/login": "login",
      "/register": "register",
      "/forgot-password": "forgot",
      "/reset-password": "reset",
    };

    const currentMode =
      routeModes[location.pathname];

    if (currentMode) {
      setAuthMode(currentMode);
    }

    // IMPORTANT:
    // Every time Login is opened from
    // another page, reset email/password.
    if (location.pathname === "/login") {
      setForm(emptyForm());
    }
  }, [location.pathname]);

  // ======================================
  // Daily Check-in
  // ======================================

  const [check, setCheck] = useState(() =>
    read("healthos_check", {
      energy: 68,
      attention: 72,
      available: 45,
      sleep: 7,
    })
  );

  // ======================================
  // Tasks and History
  // ======================================

  const [tasks, setTasks] = useState(() =>
    read("healthos_tasks", initial)
  );

  const [checkins, setCheckins] = useState(
    () => read("healthos_checkins", [])
  );

  const [task, setTask] = useState({
    title: "",
    duration: 25,
    priority: "medium",
    deadline: "",
    energy: 50,
    attention: 50,
  });

  // ======================================
  // Translation
  // ======================================

  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("es");

  const [original, setOriginal] = useState(
    ""
  );

  const [translated, setTranslated] =
    useState("");

  // ======================================
  // Focus Timer
  // ======================================

  const [seconds, setSeconds] = useState(
    25 * 60
  );

  const [running, setRunning] = useState(
    false
  );

  const [
    focusSessionStarted,
    setFocusSessionStarted,
  ] = useState(false);

  // ======================================
  // Synchronization
  // ======================================

  const [synced, setSynced] = useState(
    false
  );

  // ======================================
  // Translation Helper
  // ======================================

  const T = (key) => t(lang, key);

  // ======================================
  // Computed Values
  // ======================================

  const readiness = Math.round(
    check.energy * 0.5 +
      check.attention * 0.5
  );

  const ordered = useMemo(
    () => [...tasks].sort(sortTasks),
    [tasks]
  );

  const recommended = useMemo(
    () =>
      tasks
        .filter((item) => !item.done)
        .map((item) => ({
          ...item,
          score: score(item, check),
        }))
        .sort(
          (a, b) => b.score - a.score
        )[0],
    [tasks, check]
  );

  const completed = tasks.filter(
    (item) => item.done
  ).length;

  const total = tasks.length;

  useEffect(() => {
    if (!focusSessionStarted) {
      setSeconds(
        Math.max(
          1,
          Number(recommended?.duration) ||
            25
        ) * 60
      );
    }
  }, [
    recommended?.id,
    recommended?.duration,
    focusSessionStarted,
  ]);

  // ======================================
  // Persist Language and Font Size
  // ======================================

  useEffect(() => {
    localStorage.setItem(
      "healthos_lang",
      lang
    );

    localStorage.setItem(
      "healthos_font",
      String(font)
    );
  }, [lang, font]);

  // ======================================
  // Initialize Authentication
  // ======================================

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const result =
          await getCurrentUser();

        if (!active) return;

        if (
          result.user &&
          !isUnverified(result.user)
        ) {
          setUser(result.user);
        } else {
          setUser(null);
        }
      } catch {
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  // ======================================
  // Load User Data
  // ======================================

  useEffect(() => {
    if (!user || demo) {
      setSynced(false);
      return;
    }

    let active = true;

    setSynced(false);

    api("/data")
      .then((data) => {
        if (!active) return;

        setTasks(
          Array.isArray(data.tasks)
            ? data.tasks
            : []
        );

        setCheckins(
          Array.isArray(data.checkins)
            ? data.checkins
            : []
        );

        setSynced(true);
      })
      .catch((error) => {
        if (active) {
          setMessage(error.message);
        }
      });

    return () => {
      active = false;
    };
  }, [user, demo]);

  // ======================================
  // Save Tasks and Check-ins
  // ======================================

  useEffect(() => {
    if (user && !demo) {
      if (!synced) return;

      const timer = setTimeout(() => {
        api("/data", {
          method: "PUT",
          body: JSON.stringify({
            tasks,
            checkins,
          }),
        }).catch((error) => {
          setMessage(error.message);
        });
      }, 450);

      return () => clearTimeout(timer);
    }

    localStorage.setItem(
      "healthos_tasks",
      JSON.stringify(tasks)
    );

    localStorage.setItem(
      "healthos_checkins",
      JSON.stringify(checkins)
    );
  }, [
    tasks,
    checkins,
    user,
    demo,
    synced,
  ]);

  useEffect(() => {
    localStorage.setItem(
      "healthos_check",
      JSON.stringify(check)
    );
  }, [check]);

  // ======================================
  // Focus Timer
  // ======================================

  useEffect(() => {
    if (!running) return;

    const timer = setInterval(() => {
      setSeconds((previous) => {
        if (previous <= 1) {
          setRunning(false);
          return 0;
        }

        return previous - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [running]);

  // ======================================
  // Authentication Submit
  // ======================================

  async function submitAuth(event) {
    event.preventDefault();

    if (busy) return;

    setBusy(true);
    setMessage("");
    setDevLink("");

    try {
      const path = location.pathname;
      const email = normalizeEmail(
        form.email
      );

      // ==================================
      // REGISTER
      // ==================================

      if (path === "/register") {
        if (!form.name.trim()) {
          throw new Error(
            "Please enter your name."
          );
        }

        if (!email) {
          throw new Error(
            "Please enter your email."
          );
        }

        if (!form.password) {
          throw new Error(
            "Please enter a password."
          );
        }

        const result = await register(
          form.name.trim(),
          email,
          form.password
        );

        // Registration must ALWAYS go
        // to email verification first.
        clearSession();

        setUser(null);
        setDemo(false);
        setSynced(false);

        sessionStorage.setItem(
          "healthos_pending_email",
          email
        );

        navigate("/verify-email", {
          replace: true,
          state: {
            email,
            message:
              result.message ||
              "Registration successful! Please verify your email.",
            devCode: result.devCode,
            devVerificationUrl:
              result.devVerificationUrl,
          },
        });

        return;
      }

      // ==================================
      // LOGIN
      // ==================================

      if (path === "/login") {
        if (!email || !form.password) {
          throw new Error(
            "Please enter your email and password."
          );
        }

        const result = await login(
          email,
          form.password
        );

        if (!result.user) {
          throw new Error(
            result.message ||
              "Login failed."
          );
        }

        // Unverified users cannot enter
        // the dashboard.
        if (isUnverified(result.user)) {
          clearSession();

          setUser(null);
          setDemo(false);

          sessionStorage.setItem(
            "healthos_pending_email",
            email
          );

          navigate("/verify-email", {
            replace: true,
            state: {
              email,
              message:
                "Please verify your email before continuing.",
            },
          });

          return;
        }

        setUser(result.user);
        setDemo(false);
        setSynced(false);

        sessionStorage.removeItem(
          "healthos_pending_email"
        );

        // Clear login credentials after
        // successful login.
        setForm(emptyForm());

        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      // ==================================
      // FORGOT PASSWORD
      // ==================================

      if (
        path === "/forgot-password"
      ) {
        const result = await api(
          "/auth/forgot",
          {
            method: "POST",
            body: JSON.stringify({
              email,
            }),
          }
        );

        navigate("/reset-password", {
          state: {
            email,
            message: result.message,
            devCode: result.devCode,
          },
        });

        return;
      }

      // ==================================
      // RESET PASSWORD
      // ==================================

      if (
        path === "/reset-password"
      ) {
        const result = await api(
          "/auth/reset",
          {
            method: "POST",
            body: JSON.stringify({
              ...form,
              email,
            }),
          }
        );

        // This clears email/password
        // before returning to Login.
        changeAuthMode("login");

        setMessage(
          result.message ||
            "Password reset successfully. Please log in."
        );

        return;
      }

      throw new Error(
        "Unknown authentication page."
      );
    } catch (error) {
      setMessage(
        error.message ||
          "Authentication failed."
      );
    } finally {
      setBusy(false);
    }
  }

  // ======================================
  // Email Verification Success
  // ======================================

  async function handleVerified() {
    setBusy(true);
    setMessage("");

    try {
      // Email verification must create
      // an authenticated session.
      const session =
        await getCurrentUser();

      const verifiedUser =
        session.user;

      if (!verifiedUser) {
        throw new Error(
          "Email verified, but no active session was found. Please log in."
        );
      }

      if (isUnverified(verifiedUser)) {
        throw new Error(
          "Email verification is not complete."
        );
      }

      setUser(verifiedUser);
      setDemo(false);
      setSynced(false);

      sessionStorage.removeItem(
        "healthos_pending_email"
      );

      // Remove email and password after
      // successful verification.
      setForm(emptyForm());

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      // Never bypass authentication.
      // If verification did not create
      // a session, send user to Login.
      clearSession();

      setForm(emptyForm());

      navigate("/login", {
        replace: true,
      });

      setMessage(
        error.message ||
          "Please log in to continue."
      );
    } finally {
      setBusy(false);
    }
  }

  // ======================================
  // Resend Verification
  // ======================================

  async function resendVerification() {
    if (busy) return;

    setBusy(true);
    setMessage("");

    try {
      const email =
        normalizeEmail(form.email) ||
        sessionStorage.getItem(
          "healthos_pending_email"
        );

      if (!email) {
        throw new Error(
          "Email address is required."
        );
      }

      const result = await api(
        "/auth/resend-confirmation",
        {
          method: "POST",
          body: JSON.stringify({
            email,
          }),
        }
      );

      setMessage(
        result.message ||
          "Verification code sent."
      );

      if (
        result.devVerificationUrl
      ) {
        setDevLink(
          result.devVerificationUrl
        );
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // ======================================
  // Logout
  // ======================================

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error(
        "Logout request failed:",
        error
      );
    } finally {
      clearSession();

      setUser(null);
      setDemo(false);
      setSynced(false);

      setMessage("");
      setDevLink("");

      // Clear both login inputs.
      setForm(emptyForm());

      navigate("/login", {
        replace: true,
      });
    }
  }

  // ======================================
  // Add Task
  // ======================================

  function addTask(event) {
    event.preventDefault();

    if (!task.title.trim()) return;

    setTasks((previous) => [
      ...previous,
      {
        ...task,
        title: task.title.trim(),
        id: id(),
        duration: Number(
          task.duration
        ),
        energy: Number(
          task.energy
        ),
        attention: Number(
          task.attention
        ),
        done: false,
      },
    ]);

    setTask({
      title: "",
      duration: 25,
      priority: "medium",
      deadline: "",
      energy: 50,
      attention: 50,
    });
  }

  // ======================================
  // Save Daily Check-in
  // ======================================

  function saveCheck() {
    setCheckins((previous) =>
      [
        ...previous,
        {
          ...check,
          date:
            new Date().toISOString(),
          id: id(),
        },
      ].slice(-100)
    );
  }

  // ======================================
  // Translation
  // ======================================

  async function doTranslate() {
    if (!original.trim()) {
      setMessage(
        "Please enter text to translate."
      );
      return;
    }

    setBusy(true);
    setMessage("");
    setTranslated("");

    try {
      const result = await api(
        "/translate",
        {
          method: "POST",
          body: JSON.stringify({
            text: original,
            source: from,
            target: to,
          }),
        }
      );

      setTranslated(
        result.translatedText ||
          result.translation ||
          ""
      );
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // ======================================
  // Navigation Tabs
  // ======================================

  const tabs = [
    [
      "dashboard",
      LayoutDashboard,
    ],
    [
      "fitness",
      Dumbbell,
    ],
    [
      "wellness",
      HeartPulse,
    ],
    [
      "tasks",
      ListTodo,
    ],
    [
      "insights",
      BarChart3,
    ],
    [
      "translate",
      Languages,
    ],
  ];

  // ======================================
  // Loading Screen
  // ======================================

  if (loading) {
    return (
      <div className="app grid place-content-center min-h-screen">
        Loading HealthOS…
      </div>
    );
  }

  // ======================================
  // Authentication Routes
  // ======================================

  if (!user && !demo) {
    const authProps = {
      T,
      authMode,
      setAuthMode:
        changeAuthMode,

      form,
      setForm,
      submitAuth,

      busy,
      message,
      devLink,

      resendVerification,
      setDemo,
      setMessage,

      lang,
      setLang,
      languages,
    };

    return (
      <Routes>
        <Route
          path="/register"
          element={
            <RegisterPage
              {...authProps}
            />
          }
        />

        <Route
          path="/login"
          element={
            <LoginPage
              {...authProps}
            />
          }
        />

        <Route
          path="/forgot-password"
          element={
            <ForgotPasswordPage
              {...authProps}
            />
          }
        />

        <Route
          path="/reset-password"
          element={
            <ResetPasswordPage
              {...authProps}
            />
          }
        />

        <Route
          path="/verify-email"
          element={
            <EmailVerificationPage
              onVerified={
                handleVerified
              }
            />
          }
        />

        <Route
          path="/check-email"
          element={
            <Navigate
              to="/verify-email"
              replace
            />
          }
        />

        <Route
          path="*"
          element={
            <Navigate
              to="/login"
              replace
            />
          }
        />
      </Routes>
    );
  }

  // ======================================
  // Page Props
  // ======================================

  const pageProps = {
    Human,
    score,
    T,

    check,
    setCheck,

    tasks,
    setTasks,

    checkins,
    setCheckins,

    task,
    setTask,

    readiness,
    recommended,
    ordered,
    completed,
    total,

    seconds,
    setSeconds,

    running,
    setRunning,

    focusSessionStarted,
    setFocusSessionStarted,

    setPage,
    saveCheck,
    addTask,

    from,
    setFrom,

    to,
    setTo,

    original,
    setOriginal,

    translated,
    setTranslated,

    busy,
    doTranslate,
    languages,
  };

  // ======================================
  // Main Application
  // ======================================

  return (
    <div
      className="app"
      style={{
        fontSize: font + "%",
      }}
    >
      {/* Navbar */}

      <Navbar
        tabs={tabs}
        page={page}
        setPage={setPage}
        T={T}
        font={font}
        setFont={setFont}
        lang={lang}
        setLang={setLang}
        languages={languages}
        user={user}
        api={api}
        setUser={setUser}
        setDemo={setDemo}
        setSynced={setSynced}
        onLogout={handleLogout}
      />

      <main className="max-w-7xl mx-auto px-5 py-9">
        {/* Welcome */}

        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <p className="accent text-sm font-semibold uppercase tracking-widest">
              PERSONAL ENERGY & ATTENTION ASSISTANT
            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              {T("welcome")}
              {user
                ? ", " + user.name
                : ""}{" "}
              👋
            </h1>

            <p className="muted mt-2">
              {T("subtitle")}
            </p>
          </div>

          <span className="pill flex items-center gap-2">
            <ShieldCheck
              size={15}
            />

            {demo
              ? "Demo mode"
              : synced
                ? "Account synced"
                : "Syncing account"}
          </span>
        </div>

        {/* Status Message */}

        {message && (
          <div
            role="status"
            className="panel p-4 mb-5 accent"
          >
            {message}

            <button
              type="button"
              className="float-right"
              onClick={() =>
                setMessage("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* Main Routes */}

        <Routes>
          <Route
            path="/dashboard"
            element={
              <DashboardPage
                {...pageProps}
              />
            }
          />

          <Route
            path="/fitness"
            element={
              <FitnessPage
                readiness={
                  readiness
                }
                check={check}
                Human={Human}
              />
            }
          />

          <Route
            path="/wellness"
            element={
              <WellnessPage
                readiness={
                  readiness
                }
                check={check}
                Human={Human}
              />
            }
          />

          <Route
            path="/tasks"
            element={
              <TasksPage
                {...pageProps}
              />
            }
          />

          <Route
            path="/insights"
            element={
              <InsightsPage
                {...pageProps}
              />
            }
          />

          <Route
            path="/translate"
            element={
              <TranslatePage
                {...pageProps}
              />
            }
          />

          <Route
            path="*"
            element={
              <Navigate
                to="/dashboard"
                replace
              />
            }
          />
        </Routes>
      </main>

      {/* Footer */}

      <Footer T={T} />
    </div>
  );
}
