import React from "react";
import { motion } from "motion/react";
import { Activity, Brain, Clock, Globe2, Plus, Trash2, Play, Pause, RotateCcw } from "lucide-react";

export default function DashboardPage({ Human, score, T, check, setCheck, tasks, setTasks, checkins, setCheckins, task, setTask, readiness, recommended, ordered, completed, total, seconds, setSeconds, running, setRunning, focusSessionStarted, setFocusSessionStarted, setPage, saveCheck, addTask, from, setFrom, to, setTo, original, setOriginal, translated, setTranslated, busy, doTranslate, languages }) {
  return (
<>
            {/* Energy, Attention, Available Time */}
            <div className="grid md:grid-cols-3 gap-5 mb-5">
              {[
                [T("energy"), check.energy, Activity],
                [T("attention"), check.attention, Brain],
                [T("available"), check.available, Clock],
              ].map(([label, value, Icon]) => (
                <div
                  className="panel p-6"
                  key={label}
                >
                  <div className="flex items-center justify-between muted">
                    <span>{label}</span>
                    <Icon size={20} />
                  </div>

                  <p className="text-4xl font-bold mt-3">
                    {value}
                    {label === T("available") ? (
                      <span className="text-base muted">
                        {" "}min
                      </span>
                    ) : (
                      "%"
                    )}
                  </p>

                  <div className="h-2 bg-slate-700 rounded-full mt-4">
                    <div
                      className="h-2 rounded-full bg-emerald-300"
                      style={{
                        width:
                          (label === T("available")
                            ? Math.min(100, value / 1.8)
                            : value) + "%",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Human Battery and Check-in */}
            <div className="grid lg:grid-cols-5 gap-5">
              <section className="panel p-6 lg:col-span-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">
                    Human battery
                  </h2>

                  <span className="pill">
                    Live readiness
                  </span>
                </div>

                <Human readiness={readiness} />

                <div className="text-center">
                  <p className="text-5xl font-extrabold accent">
                    {readiness}%
                  </p>

                  <p className="muted">
                    {T("readiness")} · Drag to rotate
                  </p>
                </div>
              </section>

              <section className="panel p-6 lg:col-span-2">
                <h2 className="text-xl font-bold mb-5">
                  {T("checkin")}
                </h2>

                {[
                  ["energy", 0, 100, 1],
                  ["attention", 0, 100, 1],
                  ["available", 5, 180, 5],
                  ["sleep", 0, 12, 0.5],
                ].map(([key, min, max, step]) => (
                  <label
                    className="block mb-5"
                    key={key}
                  >
                    <span className="flex justify-between mb-2">
                      <span>{T(key)}</span>

                      <strong>
                        {check[key]}
                        {key === "energy" ||
                        key === "attention"
                          ? "%"
                          : ""}
                      </strong>
                    </span>

                    <input
                      className="range"
                      type="range"
                      min={min}
                      max={max}
                      step={step}
                      value={check[key]}
                      onChange={(event) =>
                        setCheck((previous) => ({
                          ...previous,
                          [key]: Number(event.target.value),
                        }))
                      }
                    />
                  </label>
                ))}

                <button
                  type="button"
                  className="btn w-full"
                  onClick={saveCheck}
                >
                  {T("save")}
                </button>

                <div className="flex gap-2 mt-3">
                  <button
                    type="button"
                    className="ghost flex-1"
                    onClick={() =>
                      setCheck({
                        energy: 38,
                        attention: 45,
                        available: 25,
                        sleep: 5,
                      })
                    }
                  >
                    Low energy demo
                  </button>

                  <button
                    type="button"
                    className="ghost flex-1"
                    onClick={() =>
                      setCheck({
                        energy: 88,
                        attention: 91,
                        available: 120,
                        sleep: 8,
                      })
                    }
                  >
                    Rested demo
                  </button>
                </div>
              </section>
            </div>

            {/* Task Recommendation and Timer */}
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
                      {recommended.score}% match
                    </p>

                    <p className="mt-4 text-sm muted">
                      Matched using your energy,
                      attention, available time,
                      priority and deadline.
                    </p>

                    <button
                      type="button"
                      className="btn mt-5"
                      onClick={() => {
                        setSeconds(
                          recommended.duration * 60
                        );
                        setRunning(true);
                        setFocusSessionStarted(true);
                      }}
                    >
                      <Play
                        size={16}
                        className="inline mr-2"
                      />
                      {T("start")}
                    </button>
                    <button type="button" className="ghost mt-5 ml-3" onClick={() => setPage("tasks")}>To-do list</button>
                  </>
                ) : (
                  <div className="space-y-4">
                    <p className="muted">{T("noTasks")}</p>
                    <button type="button" className="btn inline-flex items-center gap-2" onClick={() => setPage("tasks")}>
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
                  {String(
                    Math.floor(seconds / 60)
                  ).padStart(2, "0")}
                  :
                  {String(seconds % 60).padStart(
                    2,
                    "0"
                  )}
                </p>

                <div className="flex gap-3 justify-center">
                  <button
                    type="button"
                    className="btn"
                    onClick={() => {
                      if (!running && seconds === 0) {
                        setSeconds(Math.max(1, Number(recommended?.duration) || 25) * 60);
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
                    onClick={() => {
                      setRunning(false);
                      setFocusSessionStarted(false);
                      setSeconds(Math.max(1, Number(recommended?.duration) || 25) * 60);
                    }}
                  >
                    <RotateCcw size={18} />
                  </button>
                </div>
              </section>
            </div>
          </>
  );
}
