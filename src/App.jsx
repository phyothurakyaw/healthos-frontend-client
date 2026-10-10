import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";

import React, {
  useState,
  useEffect,
  useMemo,
} from "react";

import { motion } from "motion/react";

import {
  Activity,
  Brain,
  Clock,
  Globe2,
  LayoutDashboard,
  ListTodo,
  BarChart3,
  LogOut,
  Plus,
  Trash2,
  Play,
  Pause,
  RotateCcw,
  Languages,
  ShieldCheck,
  Dumbbell,
  HeartPulse,
} from "lucide-react";

import Human from "./components/Human3D";
import { api } from "./security/api";
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
// API Helper
// ========================================

// ========================================
// Local Storage Helper
// ========================================

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

const id = () =>
  globalThis.crypto?.randomUUID?.() ||
  String(Date.now() + Math.random());

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
  priorityOrder[a.priority] - priorityOrder[b.priority] ||
  (a.deadline || "9999").localeCompare(b.deadline || "9999");

// ========================================
// Task Recommendation Score
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
          100 - (task.duration - check.available) * 3
        );

  const priority = {
    high: 100,
    medium: 65,
    low: 30,
  }[task.priority];

  const days = task.deadline
    ? Math.ceil(
        (new Date(task.deadline) - new Date()) / 86400000
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
  // Language and Display
  const [lang, setLang] = useState(
    () => localStorage.getItem("healthos_lang") || "en"
  );

  const [font, setFont] = useState(
    () => Number(localStorage.getItem("healthos_font") || 100)
  );

  const [page, setPageState] = useState("dashboard");
  const setPage = (next) => { setPageState(next); navigate("/" + next); };
  useEffect(() => { const route = location.pathname.slice(1); if (["dashboard","fitness","wellness","tasks","insights","translate"].includes(route)) setPageState(route); }, [location.pathname]);

  // Authentication
  const [user, setUser] = useState(null);
  const [demo, setDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authMode, setAuthMode] = useState("login");
  const [verifyStatus, setVerifyStatus] = useState("idle");
  const changeAuthMode = (mode) => { setAuthMode(mode); navigate(mode === "register" ? "/register" : mode === "forgot" ? "/forgot-password" : mode === "reset" ? "/reset-password" : "/login"); };

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [message, setMessage] = useState("");
  const [devLink, setDevLink] = useState("");
  const [busy, setBusy] = useState(false);

  // Daily Check-in
  const [check, setCheck] = useState(() =>
    read("healthos_check", {
      energy: 68,
      attention: 72,
      available: 45,
      sleep: 7,
    })
  );

  // Tasks and History
  const [tasks, setTasks] = useState(() =>
    read("healthos_tasks", initial)
  );

  const [checkins, setCheckins] = useState(() =>
    read("healthos_checkins", [])
  );

  const [task, setTask] = useState({
    title: "",
    duration: 25,
    priority: "medium",
    deadline: "",
    energy: 50,
    attention: 50,
  });

  // Translation
  const [from, setFrom] = useState("en");
  const [to, setTo] = useState("es");
  const [original, setOriginal] = useState("");
  const [translated, setTranslated] = useState("");

  // Timer
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);

  // Synchronization
  const [synced, setSynced] = useState(false);

  // Translation Helper
  const T = (key) => t(lang, key);

  // ========================================
  // Computed Values
  // ========================================

  const readiness = Math.round(
    check.energy * 0.5 + check.attention * 0.5
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
        .sort((a, b) => b.score - a.score)[0],
    [tasks, check]
  );

  // Keep the idle timer aligned with the current recommended task.
  // Do not interrupt an active or paused focus session.
  const [focusSessionStarted, setFocusSessionStarted] = useState(false);
  useEffect(() => {
    if (!focusSessionStarted) {
      setSeconds(Math.max(1, Number(recommended?.duration) || 25) * 60);
    }
  }, [recommended?.id, recommended?.duration, focusSessionStarted]);

  const completed = tasks.filter((item) => item.done).length;
  const total = tasks.length;

  // ========================================
  // Persist Language and Font Size
  // ========================================

  useEffect(() => {
    localStorage.setItem("healthos_lang", lang);
    localStorage.setItem("healthos_font", font);
  }, [lang, font]);

  // ========================================
  // Authentication Initialization
  // ========================================

  useEffect(() => {
    api("/auth/me")
      .then((data) => setUser(data.user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // ========================================
  // Load User Data
  // ========================================

  useEffect(() => {
    if (!user) return;

    setSynced(false);

    api("/data")
      .then((data) => {
        setTasks(data.tasks);
        setCheckins(data.checkins);
        setSynced(true);
      })
      .catch((error) => setMessage(error.message));
  }, [user]);

  // ========================================
  // Save Tasks and Check-ins
  // ========================================

  useEffect(() => {
    if (user) {
      if (synced) {
        const timer = setTimeout(() => {
          api("/data", {
            method: "PUT",
            body: JSON.stringify({
              tasks,
              checkins,
            }),
          }).catch((error) => setMessage(error.message));
        }, 450);

        return () => clearTimeout(timer);
      }
    } else {
      localStorage.setItem(
        "healthos_tasks",
        JSON.stringify(tasks)
      );

      localStorage.setItem(
        "healthos_checkins",
        JSON.stringify(checkins)
      );
    }
  }, [tasks, checkins, user, synced]);

  useEffect(() => {
    localStorage.setItem(
      "healthos_check",
      JSON.stringify(check)
    );
  }, [check]);

  // ========================================
  // Focus Timer
  // ========================================

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

  // ========================================
  // Authentication Submit
  // ========================================

  async function submitAuth(event) {
    event.preventDefault();
    setBusy(true);
    setMessage("");

    try {
      if (authMode === "forgot") {
        const result = await api("/auth/forgot", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
          }),
        });

        setMessage(result.message);
        navigate("/reset-password", {state:{email:form.email,message:result.message,devCode:result.devCode}});
      } else if (authMode === "reset") {
        const result = await api("/auth/reset", {
          method: "POST",
          body: JSON.stringify(form),
        });

        setMessage(result.message);
        changeAuthMode("login");
      } else {
        const result = await api(
          "/auth/" +
            (authMode === "register" ? "register" : "login"),
          {
            method: "POST",
            body: JSON.stringify(form),
          }
        );

        if (result.user) {
          setUser(result.user);
          setDemo(false);
          navigate("/dashboard");
        } else {
          setMessage(result.message);
          if (authMode === "register") navigate("/verify-email", {state:{email:form.email, message:result.message, devCode:result.devCode}});

          if (result.devVerificationUrl) {
            setDevLink(result.devVerificationUrl);
          }
        }
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // Resend Verification Email
  // ========================================

  async function resendVerification() {
    setBusy(true);
    setMessage("");

    try {
      const result = await api("/auth/resend-verification", {
        method: "POST",
        body: JSON.stringify({
          email: form.email,
        }),
      });

      setMessage(result.message);

      if (result.devVerificationUrl) {
        setDevLink(result.devVerificationUrl);
      }
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // Add Task
  // ========================================

  function addTask(event) {
    event.preventDefault();

    if (!task.title.trim()) return;

    setTasks((previous) => [
      ...previous,
      {
        ...task,
        title: task.title.trim(),
        id: id(),
        duration: Number(task.duration),
        energy: Number(task.energy),
        attention: Number(task.attention),
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

  // ========================================
  // Save Daily Check-in
  // ========================================

  function saveCheck() {
    setCheckins((previous) =>
      [
        ...previous,
        {
          ...check,
          date: new Date().toISOString(),
          id: id(),
        },
      ].slice(-100)
    );
  }

  // ========================================
  // Translate Text
  // ========================================

  async function doTranslate() {
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

      setTranslated(result.translatedText);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  // ========================================
  // Navigation Tabs
  // ========================================

  const tabs = [
    ["dashboard", LayoutDashboard],
    ["fitness", Dumbbell],
    ["wellness", HeartPulse],
    ["tasks", ListTodo],
    ["insights", BarChart3],
    ["translate", Languages],
  ];

  // ========================================
  // Loading Screen
  // ========================================

  if (loading) {
    return (
      <div className="app grid place-content-center min-h-screen">
        Loading HealthOS…
      </div>
    );
  }

  // ========================================
  // Authentication Screen
  // ========================================

  if (!user && !demo) {
    const props={T, authMode, setAuthMode:changeAuthMode, form, setForm, submitAuth, busy, message, devLink, resendVerification, setDemo, setMessage, lang, setLang, languages};
    return <Routes>
      <Route path="/register" element={<RegisterPage {...props} />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage {...props} />} />
      <Route path="/reset-password" element={<ResetPasswordPage {...props} />} />
      <Route path="/verify-email" element={<EmailVerificationPage onVerified={(account) => {setUser(account); navigate("/dashboard");}} />} />
      <Route path="/check-email" element={<Navigate to="/verify-email" replace />} />
      <Route path="/login" element={<LoginPage {...props} />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>;
  }

  const pageProps = { Human, score, T, check, setCheck, tasks, setTasks, checkins, setCheckins, task, setTask, readiness, recommended, ordered, completed, total, seconds, setSeconds, running, setRunning, focusSessionStarted, setFocusSessionStarted, setPage, saveCheck, addTask, from, setFrom, to, setTo, original, setOriginal, translated, setTranslated, busy, doTranslate, languages };

  // ========================================
  // Main Application Layout
  // ========================================

  return (
    <div
      className="app"
      style={{ fontSize: font + "%" }}
    >
      <Navbar {...{tabs, page, setPage, T, font, setFont, lang, setLang, languages, user, api, setUser, setDemo, setSynced}} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-5 py-9">
        {/* Welcome */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-8">
          <div>
            <p className="accent text-sm font-semibold uppercase tracking-widest">
              PERSONAL ENERGY & ATTENTION ASSISTANT
            </p>

            <h1 className="text-3xl md:text-4xl font-bold mt-2">
              {T("welcome")}
              {user ? ", " + user.name : ""} 👋
            </h1>

            <p className="muted mt-2">
              {T("subtitle")}
            </p>
          </div>

          <span className="pill flex items-center gap-2">
            <ShieldCheck size={15} />
            {demo ? "Demo mode" : "Account synced"}
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
              onClick={() => setMessage("")}
            >
              ×
            </button>
          </div>
        )}

        {/* ====================================
            Dashboard Page
        ==================================== */}

        <Routes>
          <Route path="/dashboard" element={<DashboardPage {...pageProps} />} />
          <Route path="/fitness" element={<FitnessPage readiness={readiness} check={check} Human={Human} />} />
          <Route path="/wellness" element={<WellnessPage readiness={readiness} check={check} Human={Human} />} />
          <Route path="/tasks" element={<TasksPage {...pageProps} />} />
          <Route path="/insights" element={<InsightsPage {...pageProps} />} />
          <Route path="/translate" element={<TranslatePage {...pageProps} />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>

      <Footer T={T} />
    </div>
  );
}
