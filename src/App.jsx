
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
  resendConfirmation,
} from "./security/api";

import {
  getTasks,
  createTask,
  updateTask,
  deleteTask as removeTask,
  getLatestCheckIn,
  createSmartCheckIn,
  getRecommendations,
} from "./security/healthosApi";

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
// import TranslatePage from "./pages/TranslatePage";
import FitnessPage from "./pages/FitnessPage";
import WellnessPage from "./pages/WellnessPage";

import { t, languages } from "./translate";

// ----------------------------------------
// Helpers
// ----------------------------------------

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const generateId = () =>
  globalThis.crypto?.randomUUID?.() ||
  String(Date.now() + Math.random());

const emptyForm = () => ({
  name: "",
  email: "",
  password: "",
});

const initialTaskForm = () => ({
  title: "",
  duration: 25,
  priority: "medium",
  deadline: "",
  energy: 50,
  attention: 50,
});

const initialTasks = [
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

const isUnverified = (account) =>
  account?.emailVerified === false ||
  account?.isVerified === false;

const normalizeEmail = (email) =>
  String(email || "").trim().toLowerCase();

// Local scoring is used only for demo mode.
function localScore(task, check) {
  const energy = 100 - Math.abs(
    check.energy - task.energy
  );

  const attention = 100 - Math.abs(
    check.attention - task.attention
  );

  const time = task.duration <= check.available
    ? 100
    : Math.max(
        0,
        100 - (task.duration - check.available) * 3
      );

  const priority = {
    high: 100,
    medium: 65,
    low: 30,
  }[task.priority] ?? 30;

  const days = task.deadline
    ? Math.ceil(
        (new Date(task.deadline) - new Date()) / 86400000
      )
    : 30;

  const urgency = days <= 0
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

// ----------------------------------------
// App
// ----------------------------------------

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [lang, setLang] = useState(
    () => localStorage.getItem("healthos_lang") || "en"
  );

  const [font, setFont] = useState(
    () => Number(
      localStorage.getItem("healthos_font") || 100
    )
  );

  const [page, setPageState] = useState("dashboard");

  const setPage = (next) => {
    setPageState(next);
    navigate(`/${next}`);
  };

  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);

  const [authMode, setAuthMode] = useState("login");
  const [form, setForm] = useState(emptyForm);

  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [busy, setBusy] = useState(false);

  const [synced, setSynced] = useState(false);
  const [hasServerCheckin, setHasServerCheckin] =
    useState(false);

  const [
    backendRecommendations,
    setBackendRecommendations,
  ] = useState(null);

  const [check, setCheck] = useState(() =>
    read("healthos_check", {
      energy: 68,
      attention: 72,
      available: 45,
      sleep: 7,
      activityLevel: "moderate",
      mood: "neutral",
    })
  );

  const [tasks, setTasks] = useState(() =>
    read("healthos_tasks", initialTasks)
  );

  const [checkins, setCheckins] = useState(() =>
    read("healthos_checkins", [])
  );

  const [task, setTask] = useState(initialTaskForm);

  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("es");
  const [original, setOriginal] = useState("");
  const [translated, setTranslated] = useState("");

  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [
    focusSessionStarted,
    setFocusSessionStarted,
  ] = useState(false);

  const T = (key) => t(lang, key);

  const readiness = Math.round(
    (Number(check.energy) + Number(check.attention)) / 2
  );

  const completed = tasks.filter(
    (item) => item.done
  ).length;

  const total = tasks.length;

  // ----------------------------------------
  // Backend Recommendation Scores
  // ----------------------------------------

  const recommendationScore = (item) => {
    if (!item) return null;

    if (user && !demo) {
      if (!backendRecommendations) return null;

      const match =
        backendRecommendations.recommendations?.find(
          (entry) => entry.task.id === item.id
        );

      if (match) {
        return Math.round(Number(match.score));
      }

      const selected =
        backendRecommendations.recommendedTask;

      if (selected?.id === item.id) {
        return Math.round(Number(selected.score));
      }

      return null;
    }

    return localScore(item, check);
  };

  const recommended = useMemo(() => {
    if (user && !demo) {
      const selected =
        backendRecommendations?.recommendedTask;

      if (!selected) return null;

      const entry =
        backendRecommendations.recommendations?.find(
          (item) => item.task.id === selected.id
        );

      return {
        ...selected,
        score: selected.score ?? entry?.score ?? null,
        explanation:
          selected.explanation ??
          entry?.explanation ??
          "",
      };
    }

    return tasks
      .filter((item) => !item.done)
      .map((item) => ({
        ...item,
        score: localScore(item, check),
      }))
      .sort((a, b) => b.score - a.score)[0] || null;
  }, [user, demo, backendRecommendations, tasks, check]);

  const ordered = useMemo(() => {
    const ranks = new Map();

    backendRecommendations?.recommendations?.forEach(
      (entry, index) => {
        ranks.set(entry.task.id, index);
      }
    );

    if (backendRecommendations?.recommendedTask) {
      ranks.set(
        backendRecommendations.recommendedTask.id,
        -1
      );
    }

    const priorityOrder = {
      high: 0,
      medium: 1,
      low: 2,
    };

    return [...tasks].sort((a, b) => {
      if (a.done !== b.done) {
        return Number(a.done) - Number(b.done);
      }

      if (user && !demo) {
        const rankA = ranks.get(a.id) ?? Infinity;
        const rankB = ranks.get(b.id) ?? Infinity;

        if (rankA !== rankB) return rankA - rankB;
      } else {
        const scoreDifference =
          localScore(b, check) - localScore(a, check);

        if (scoreDifference !== 0) return scoreDifference;
      }

      return (
        (priorityOrder[a.priority] ?? 3) -
        (priorityOrder[b.priority] ?? 3)
      );
    });
  }, [
    tasks,
    check,
    user,
    demo,
    backendRecommendations,
  ]);

  // ----------------------------------------
  // Navigation
  // ----------------------------------------

  useEffect(() => {
    const route = location.pathname.slice(1);

    if (
      [
        "dashboard",
        "fitness",
        "wellness",
        "tasks",
        "insights",
        // "translate",
      ].includes(route)
    ) {
      setPageState(route);
    }
  }, [location.pathname]);

  const changeAuthMode = (mode) => {
    setAuthMode(mode);
    setMessage("");
    setDevLink("");

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

  useEffect(() => {
    const routeModes = {
      "/login": "login",
      "/register": "register",
      "/forgot-password": "forgot",
      "/reset-password": "reset",
    };

    if (routeModes[location.pathname]) {
      setAuthMode(routeModes[location.pathname]);
    }

    if (location.pathname === "/login") {
      setForm(emptyForm());
    }
  }, [location.pathname]);

  // ----------------------------------------
  // Persist Settings
  // ----------------------------------------

  useEffect(() => {
    localStorage.setItem("healthos_lang", lang);
    localStorage.setItem("healthos_font", String(font));
  }, [lang, font]);

  useEffect(() => {
    localStorage.setItem(
      "healthos_check",
      JSON.stringify(check)
    );
  }, [check]);

  // ----------------------------------------
  // Restore Authentication
  // ----------------------------------------

  useEffect(() => {
    let active = true;

    async function initializeAuth() {
      try {
        const result = await getCurrentUser();

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
        if (active) setUser(null);
      } finally {
        if (active) setLoading(false);
      }
    }

    initializeAuth();

    return () => {
      active = false;
    };
  }, []);

  // ----------------------------------------
  // Load Tasks and Latest Check-in
  // ----------------------------------------

  useEffect(() => {
    if (!user || demo) {
      setSynced(false);
      setHasServerCheckin(false);
      setBackendRecommendations(null);
      return;
    }

    let active = true;

    setSynced(false);
    setHasServerCheckin(false);
    setBackendRecommendations(null);
    setTasks([]);
    setCheckins([]);

    async function loadAccountData() {
      const [tasksResult, checkinResult] =
        await Promise.allSettled([
          getTasks(),
          getLatestCheckIn(),
        ]);

      if (!active) return;

      if (tasksResult.status === "fulfilled") {
        setTasks(tasksResult.value);
        setSynced(true);
      } else {
        setMessage(tasksResult.reason.message);
      }

      if (checkinResult.status === "fulfilled") {
        const latest = checkinResult.value;

        setHasServerCheckin(true);

        setCheck((previous) => ({
          ...previous,
          energy: latest.energy,
          attention: latest.attention,
          sleep: latest.sleepHours ?? previous.sleep,
        }));

        setCheckins([latest]);
      } else if (checkinResult.reason?.status !== 404) {
        setMessage(checkinResult.reason.message);
      }
    }

    loadAccountData();

    return () => {
      active = false;
    };
  }, [user, demo]);

  // ----------------------------------------
  // Demo Storage
  // ----------------------------------------

  useEffect(() => {
    if (user && !demo) return;

    localStorage.setItem(
      "healthos_tasks",
      JSON.stringify(tasks)
    );

    localStorage.setItem(
      "healthos_checkins",
      JSON.stringify(checkins)
    );
  }, [tasks, checkins, user, demo]);

  // ----------------------------------------
  // Fetch Backend Recommendations
  // ----------------------------------------

  useEffect(() => {
    if (
      !user ||
      demo ||
      !synced ||
      !hasServerCheckin
    ) {
      return;
    }

    let active = true;

    async function loadRecommendations() {
      try {
        const result = await getRecommendations(
          check.available
        );

        if (active) {
          setBackendRecommendations(result);
        }
      } catch (error) {
        if (active) {
          setBackendRecommendations(null);

          if (error.status !== 404) {
            setMessage(error.message);
          }
        }
      }
    }

    loadRecommendations();

    return () => {
      active = false;
    };
  }, [
    user,
    demo,
    synced,
    hasServerCheckin,
    tasks,
    check.available,
    checkins,
  ]);

  // ----------------------------------------
  // Focus Timer
  // ----------------------------------------

  useEffect(() => {
    if (!focusSessionStarted) {
      setSeconds(
        Math.max(
          1,
          Number(recommended?.duration) || 25
        ) * 60
      );
    }
  }, [
    recommended?.id,
    recommended?.duration,
    focusSessionStarted,
  ]);

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

  // ----------------------------------------
  // Authentication
  // ----------------------------------------

  async function submitAuth(event) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setMessage("");
    setDevLink("");

    try {
      const path = location.pathname;
      const email = normalizeEmail(form.email);

      if (path === "/register") {
        if (!form.name.trim()) {
          throw new Error("Please enter your name.");
        }

        if (!email || !form.password) {
          throw new Error(
            "Please enter your email and password."
          );
        }

        const result = await register(
          form.name.trim(),
          email,
          form.password
        );

        clearSession();
        setUser(null);
        setDemo(false);
        setSynced(false);

        sessionStorage.setItem(
          "healthos_pending_email",
          email
        );

        setForm(emptyForm());

        navigate("/verify-email", {
          replace: true,
          state: {
            email,
            message:
              result.message ||
              "Registration successful! Check your email.",
            devCode: result.devCode,
            devVerificationUrl:
              result.devVerificationUrl,
          },
        });

        return;
      }

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
            result.message || "Login failed."
          );
        }

        if (isUnverified(result.user)) {
          clearSession();
          setUser(null);
          setDemo(false);
          setSynced(false);

          sessionStorage.setItem(
            "healthos_pending_email",
            email
          );

          setForm(emptyForm());

          navigate("/verify-email", {
            replace: true,
            state: {
              email,
              message:
                "Please verify your email before logging in.",
            },
          });

          return;
        }

        setUser(result.user);
        setDemo(false);
        setSynced(false);
        setForm(emptyForm());

        sessionStorage.removeItem(
          "healthos_pending_email"
        );

        navigate("/dashboard", {
          replace: true,
        });

        return;
      }

      if (path === "/forgot-password") {
        const result = await api("/auth/forgot", {
          method: "POST",
          body: JSON.stringify({ email }),
        });

        navigate("/reset-password", {
          state: {
            email,
            message: result.message,
            devCode: result.devCode,
          },
        });

        return;
      }

      if (path === "/reset-password") {
        const result = await api("/auth/reset", {
          method: "POST",
          body: JSON.stringify({
            ...form,
            email,
          }),
        });

        changeAuthMode("login");

        setMessage(
          result.message ||
          "Password reset successfully. Please log in."
        );

        return;
      }

      throw new Error("Unknown authentication page.");
    } catch (error) {
      setMessage(
        error.message || "Authentication failed."
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerified() {
    setBusy(true);
    setMessage("");

    try {
      const session = await getCurrentUser();
      const verifiedUser = session.user;

      if (!verifiedUser || isUnverified(verifiedUser)) {
        throw new Error(
          "Email verified. Please log in to continue."
        );
      }

      setUser(verifiedUser);
      setDemo(false);
      setSynced(false);
      setForm(emptyForm());

      sessionStorage.removeItem(
        "healthos_pending_email"
      );

      navigate("/dashboard", {
        replace: true,
      });
    } catch (error) {
      clearSession();
      setUser(null);
      setForm(emptyForm());

      navigate("/login", {
        replace: true,
      });

      setMessage(
        error.message || "Please log in to continue."
      );
    } finally {
      setBusy(false);
    }
  }

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
        throw new Error("Email address is required.");
      }

      const result = await resendConfirmation(email);

      setMessage(
        result.message ||
        "A new verification email has been sent."
      );

      if (result.devVerificationUrl) {
        setDevLink(result.devVerificationUrl);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await logout();
    } catch (error) {
      console.error("Logout request failed:", error);
    } finally {
      clearSession();
      setUser(null);
      setDemo(false);
      setSynced(false);
      setHasServerCheckin(false);
      setBackendRecommendations(null);
      setTasks([]);
      setCheckins([]);
      setMessage("");
      setDevLink("");
      setForm(emptyForm());

      navigate("/login", {
        replace: true,
      });
    }
  }

  // ----------------------------------------
  // Task Actions
  // ----------------------------------------

  async function addTask(event) {
    event.preventDefault();

    if (!task.title.trim()) return;

    setBusy(true);

    try {
      const created =
        user && !demo
          ? await createTask(task)
          : {
              ...task,
              id: generateId(),
              title: task.title.trim(),
              duration: Number(task.duration),
              energy: Number(task.energy),
              attention: Number(task.attention),
              done: false,
            };

      setTasks((previous) => [...previous, created]);
      setTask(initialTaskForm());
    } catch (error) {
      setMessage(error.message);
      throw error;
    } finally {
      setBusy(false);
    }
  }

  async function toggleTask(id, forceDone) {
    const current = tasks.find(
      (item) => item.id === id
    );

    if (!current) return false;

    const nextDone =
      forceDone === undefined
        ? !current.done
        : forceDone;

    try {
      const updated =
        user && !demo
          ? await updateTask(id, {
              done: nextDone,
            })
          : {
              ...current,
              done: nextDone,
            };

      setTasks((previous) =>
        previous.map((item) =>
          item.id === id ? updated : item
        )
      );

      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  }

  async function deleteTask(id) {
    try {
      if (user && !demo) {
        await removeTask(id);
      }

      setTasks((previous) =>
        previous.filter((item) => item.id !== id)
      );

      return true;
    } catch (error) {
      setMessage(error.message);
      return false;
    }
  }

  // ----------------------------------------
  // Check-in
  // ----------------------------------------

  async function saveCheck() {
    if (busy) return;

    setBusy(true);

    try {
      let saved;

      if (user && !demo) {
        saved = await createSmartCheckIn({
          sleepHours: check.sleep,
          activityLevel:
            check.activityLevel || "moderate",
          mood: check.mood || "neutral",
        });

        setHasServerCheckin(true);

        setCheck((previous) => ({
          ...previous,
          energy: saved.energy,
          attention: saved.attention,
        }));
      } else {
        saved = {
          ...check,
          id: generateId(),
          date: new Date().toISOString(),
        };
      }

      setCheckins((previous) =>
        [...previous, saved].slice(-100)
      );

      setMessage("Check-in saved successfully.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // ----------------------------------------
  // Translation
  // ----------------------------------------

  async function doTranslate() {
    if (!original.trim()) {
      setMessage("Please enter text to translate.");
      return;
    }

    setBusy(true);
    setMessage("");
    setTranslated("");

    try {
      const result = await api("/translate", {
        method: "POST",
        body: JSON.stringify({
          text: original,
          source: from,
          target: to,
        }),
      });

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

  // ----------------------------------------
  // Navigation Tabs
  // ----------------------------------------

  const tabs = [
    ["dashboard", LayoutDashboard],
    ["fitness", Dumbbell],
    ["wellness", HeartPulse],
    ["tasks", ListTodo],
    ["insights", BarChart3],
    // ["translate", Languages],
  ];

  if (loading) {
    return (
      <div className="app grid place-content-center min-h-screen">
        Loading HealthOS…
      </div>
    );
  }

  // ----------------------------------------
  // Authentication Routes
  // ----------------------------------------

  if (!user && !demo) {
    const authProps = {
      T,
      authMode,
      setAuthMode: changeAuthMode,
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
          path="/login"
          element={<LoginPage {...authProps} />}
        />

        <Route
          path="/register"
          element={<RegisterPage {...authProps} />}
        />

        <Route
          path="/verify-email"
          element={
            <EmailVerificationPage
              onVerified={handleVerified}
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
          path="/forgot-password"
          element={<ForgotPasswordPage {...authProps} />}
        />

        <Route
          path="/reset-password"
          element={<ResetPasswordPage {...authProps} />}
        />

        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    );
  }

  // ----------------------------------------
  // Shared Props
  // ----------------------------------------

  const pageProps = {
    Human,
    T,
    score: recommendationScore,

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
    toggleTask,
    deleteTask,

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
    demo,
    backendRecommendations,
  };

  // ----------------------------------------
  // Main Application
  // ----------------------------------------

  return (
    <div
      className="app"
      style={{ fontSize: `${font}%` }}
    >
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
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <p className="accent text-sm font-semibold uppercase tracking-widest">
              PERSONAL ENERGY & ATTENTION ASSISTANT
            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              {T("welcome")}
              {user ? `, ${user.name}` : ""} 👋
            </h1>

            <p className="muted mt-2">
              {T("subtitle")}
            </p>
          </div>

          <span className="pill flex items-center gap-2">
            <ShieldCheck size={15} />
            {demo
              ? "Demo mode"
              : synced
                ? "Account synced"
                : "Syncing account"}
          </span>
        </div>

        {message && (
          <div
            role="status"
            className="panel p-4 mb-5 accent"
          >
            {message}

            <button
              type="button"
              className="float-right"
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        <Routes>
          <Route
            path="/dashboard"
            element={<DashboardPage {...pageProps} />}
          />

          <Route
            path="/fitness"
            element={
              <FitnessPage
                readiness={readiness}
                check={check}
                Human={Human}
              />
            }
          />

          <Route
            path="/wellness"
            element={
              <WellnessPage
                readiness={readiness}
                check={check}
                Human={Human}
              />
            }
          />

          <Route
            path="/tasks"
            element={<TasksPage {...pageProps} />}
          />

          <Route
            path="/insights"
            element={<InsightsPage {...pageProps} />}
          />

          {/* <Route
            path="/translate"
            element={<TranslatePage {...pageProps} />}
          /> */}

          <Route
            path="*"
            element={
              <Navigate to="/dashboard" replace />
            }
          />
        </Routes>
      </main>

      <Footer T={T} />
    </div>
  );
}
