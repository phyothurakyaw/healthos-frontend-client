
import React from "react";
import {
  Activity,
  Brain,
  Clock,
  Play,
  Pause,
  RotateCcw,
} from "lucide-react";
export default function DashboardPage({
  Human,
  T = (key) => key,
  check,
  setCheck,
  todayScores = { energy: 0, attention: 0 },
  hasTodayCheckin = false,
  readiness,
  recommended,
  seconds,
  setSeconds,
  running,
  setRunning,
  focusSessionStarted,
  setFocusSessionStarted,
  setPage,
  saveCheck,
  busy,
  demo,
}) {
  const setValue = (key, value) =>
    setCheck((previous) => ({
      ...previous,
      [key]: value,
    }));
  const startRecommended = () => {
    if (!recommended) return;
    setSeconds(
      Math.max(1, Number(recommended.duration) || 25) * 60
    );
    setRunning(true);
    setFocusSessionStarted(true);
  };
  const resetTimer = () => {
    setRunning(false);
    setFocusSessionStarted(false);
    setSeconds(
      Math.max(1, Number(recommended?.duration) || 25) * 60
    );
  };
  const translateLabel = (key, fallback) => {
    const translated = T(key);
    return translated === key ? fallback : translated;
  };
  const questions = [
    {
      key: "sleep",
      label: "How many hours did you sleep last night?",
      translationKey: "sleepQuestion",
      min: 0,
      max: 24,
      step: 0.5,
      defaultValue: 7,
      suffix: " hrs",
    },
    {
      key: "sleepQuality",
      label: "How well did you sleep?",
      translationKey: "sleepQualityQuestion",
      min: 1,
      max: 5,
      step: 1,
      defaultValue: 3,
      suffix: "/5",
      left: "1 = Very poorly",
      right: "5 = Very well",
    },
    {
      key: "perceivedEnergy",
      label: "How energetic do you feel right now?",
      translationKey: "perceivedEnergyQuestion",
      min: 1,
      max: 5,
      step: 1,
      defaultValue: 3,
      suffix: "/5",
      left: "1 = Exhausted",
      right: "5 = Very energetic",
    },
    {
      key: "perceivedFocus",
      label: "How focused do you feel right now?",
      translationKey: "perceivedFocusQuestion",
      min: 1,
      max: 5,
      step: 1,
      defaultValue: 3,
      suffix: "/5",
      left: "1 = Cannot concentrate",
      right: "5 = Very focused",
    },
  ];
  return (
    <>
      {/* Energy and Attention — 2 columns */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {[
          {
            key: "energy",
            label: T("energy"),
            value: hasTodayCheckin ? todayScores.energy : 0,
            Icon: Activity,
          },
          {
            key: "attention",
            label: T("attention"),
            value: hasTodayCheckin ? todayScores.attention : 0,
            Icon: Brain,
          },
        ].map(({ key, label, value, Icon }) => (
          <div className="panel p-6" key={key}>
            <div className="flex items-center justify-between muted">
              <span>{label}</span>
              <Icon size={20} />
            </div>

            <p className="text-4xl font-bold mt-3">
              {value}%
            </p>

            <div className="h-2 bg-slate-700 rounded-full mt-4">
              <div
                className="h-2 rounded-full bg-emerald-300"
                style={{
                  width: `${Math.max(0, Math.min(100, Number(value) || 0))}%`,
                }}
              />
            </div>
          </div>
        ))}
      </div>
      {!hasTodayCheckin && (
      <p className="muted text-sm mb-5" role="status">
        No check-in saved today. Energy and Attention start at 0% each day.
        Save a check-in to update your scores.
      </p>
    )}

    {/* Human Battery and Daily Check-in */}
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Human Battery — unchanged */}
        <section className="panel p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">
              {translateLabel("humanBattery", "Human battery")}
            </h2>
            <span className="pill">
              {translateLabel("liveReadiness", "Live readiness")}
            </span>
          </div>
          <Human readiness={readiness} />
          <div className="text-center">
            <p className="text-5xl font-extrabold accent">
              {readiness}%
            </p>
            <p className="muted">
              {T("readiness")} ·{" "}
              {translateLabel("dragRotate", "Drag to rotate")}
            </p>
          </div>
        </section>
        {/* Daily Check-in — updated input questions */}
        <section className="panel p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-5">
            {T("checkin")}
          </h2>
          {!demo && (
            <p className="muted text-sm mb-4">
              {translateLabel(
                "calculatedScores",
                "Energy and attention are calculated by HealthOS after you save your check-in."
              )}
            </p>
          )}
          {/* Question 1: Sleep hours */}
          {/* Question 2: Sleep quality */}
          {/* Question 4: Perceived energy */}
          {/* Question 5: Perceived focus */}
          {questions.map((question) => {
            const value =
              check[question.key] ?? question.defaultValue;
            return (
              <label
                className="block mb-5"
                key={question.key}
              >
                <span className="flex justify-between mb-2 gap-3">
                  <span>
                    {translateLabel(
                      question.translationKey,
                      question.label
                    )}
                  </span>
                  <strong className="whitespace-nowrap">
                    {value}
                    {question.suffix}
                  </strong>
                </span>
                <input
                  className="range"
                  type="range"
                  min={question.min}
                  max={question.max}
                  step={question.step}
                  value={value}
                  onChange={(event) =>
                    setValue(
                      question.key,
                      Number(event.target.value)
                    )
                  }
                />
                {question.left && question.right && (
                  <div className="flex justify-between gap-3 text-xs muted mt-1">
                    <span>{question.left}</span>
                    <span className="text-right">
                      {question.right}
                    </span>
                  </div>
                )}
              </label>
            );
          })}
          {/* Question 3: Physical activity */}
          <label className="block mb-5">
            <span className="flex justify-between mb-2 gap-3">
              <span>
                {translateLabel(
                  "activityQuestion",
                  "How physically active have you been today?"
                )}
              </span>
              <strong>
                {T(check.activityLevel || "moderate")}
              </strong>
            </span>
            <select
              className="w-full rounded-xl bg-slate-800 border border-white/10 p-3"
              value={check.activityLevel || "moderate"}
              onChange={(event) =>
                setValue("activityLevel", event.target.value)
              }
            >
              <option value="low">{T("low")}</option>
              <option value="moderate">{T("moderate")}</option>
              <option value="high">{T("high")}</option>
            </select>
          </label>
          {/* Available Time — unchanged */}
          <label className="block mb-5">
            <span className="flex justify-between mb-2">
              <span>{T("available")}</span>
              <strong>{check.available ?? 45} min</strong>
            </span>
            <input
              className="range"
              type="range"
              min="5"
              max="180"
              step="5"
              value={check.available ?? 45}
              onChange={(event) =>
                setValue(
                  "available",
                  Number(event.target.value)
                )
              }
            />
          </label>
          {/* Save Check-in — unchanged */}
          <button
            type="button"
            className="btn w-full"
            disabled={busy}
            onClick={saveCheck}
          >
            {busy ? T("saving") : T("save")}
          </button>
          {/* Demo buttons — same design, updated input data */}
          <div className="flex gap-2 mt-3">
            <button
              type="button"
              className="ghost flex-1"
              onClick={() =>
                setCheck((previous) => ({
                  ...previous,
                  energy: demo ? 38 : previous.energy,
                  attention: demo ? 45 : previous.attention,
                  available: 25,
                  sleep: 5,
                  sleepQuality: 2,
                  activityLevel: "low",
                  perceivedEnergy: 2,
                  perceivedFocus: 2,
                }))
              }
            >
              {translateLabel(
                "lowEnergyDemo",
                "Low energy demo"
              )}
            </button>
            <button
              type="button"
              className="ghost flex-1"
              onClick={() =>
                setCheck((previous) => ({
                  ...previous,
                  energy: demo ? 88 : previous.energy,
                  attention: demo ? 91 : previous.attention,
                  available: 120,
                  sleep: 8,
                  sleepQuality: 5,
                  activityLevel: "high",
                  perceivedEnergy: 5,
                  perceivedFocus: 5,
                }))
              }
            >
              {translateLabel("restedDemo", "Rested demo")}
            </button>
          </div>
        </section>
      </div>
      {/* Recommendation and Timer — unchanged */}
      <div className="grid lg:grid-cols-5 gap-5 mt-5">
        <section className="panel p-6 lg:col-span-3">
          <h2 className="text-xl font-bold mb-4">
            ✨ {T("recommend")}
          </h2>
          {recommended ? (
            <>
              <h3 className="text-2xl font-semibold">
                {recommended.title}
              </h3>
              <p className="muted mt-2">
                {recommended.duration} min ·{" "}
                {T(recommended.priority)} priority ·{" "}
                {recommended.score == null
                  ? T("notRanked")
                  : `${Math.round(recommended.score)}% ${T("match")}`}
              </p>
              <p className="mt-4 text-sm muted">
                {recommended.explanation ||
                  "Matched using your energy, attention, available time, priority and deadline."}
              </p>
              <button
                type="button"
                className="btn mt-5"
                onClick={startRecommended}
              >
                <Play size={16} className="inline mr-2" />
                {T("start")}
              </button>
              <button
                type="button"
                className="ghost mt-5 ml-3"
                onClick={() => setPage("tasks")}
              >
                To-do list
              </button>
            </>
          ) : (
            <div className="space-y-4">
              <p className="muted">
                {T("noTasks")}
              </p>
              <button
                type="button"
                className="btn"
                onClick={() => setPage("tasks")}
              >
                To-do list
              </button>
            </div>
          )}
        </section>
        <section className="panel p-6 lg:col-span-2">
          <h2 className="text-xl font-bold mb-4">
            {T("timer")}
          </h2>
          <p className="text-5xl font-bold tabular-nums text-center my-8">
            {String(Math.floor(seconds / 60)).padStart(2, "0")}
            :
            {String(seconds % 60).padStart(2, "0")}
          </p>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              className="btn"
              onClick={() => {
                if (!running && seconds === 0) {
                  setSeconds(
                    Math.max(
                      1,
                      Number(recommended?.duration) || 25
                    ) * 60
                  );
                }
                setFocusSessionStarted(true);
                setRunning(!running);
              }}
            >
              {running ? (
                <Pause size={18} />
              ) : (
                <Play size={18} />
              )}
            </button>
            <button
              type="button"
              className="ghost"
              onClick={resetTimer}
            >
              <RotateCcw size={18} />
            </button>
          </div>
        </section>
      </div>
    </>
  );
}
