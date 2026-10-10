import React from "react";
import { motion } from "motion/react";
import { Activity, Brain, Clock, Globe2, Plus, Trash2, Play, Pause, RotateCcw } from "lucide-react";

export default function TasksPage({ Human, score, T, check, setCheck, tasks, setTasks, checkins, setCheckins, task, setTask, readiness, recommended, ordered, completed, total, seconds, setSeconds, running, setRunning, setPage, saveCheck, addTask, from, setFrom, to, setTo, original, setOriginal, translated, setTranslated, busy, doTranslate, languages }) {
  return (
<div className="grid lg:grid-cols-5 gap-5">
            {/* Add Task Form */}
            <section className="panel p-6 lg:col-span-2">
              <h2 className="text-xl font-bold mb-5">
                {T("add")}
              </h2>

              <form
                onSubmit={addTask}
                className="space-y-4"
              >
                <label className="block">
                  {T("taskName")}

                  <input
                    className="field mt-2"
                    required
                    maxLength={160}
                    value={task.title}
                    onChange={(event) =>
                      setTask({
                        ...task,
                        title: event.target.value,
                      })
                    }
                  />
                </label>

                <div className="grid grid-cols-2 gap-3">
                  <label>
                    {T("duration")}

                    <input
                      className="field mt-2"
                      type="number"
                      min="1"
                      max="480"
                      required
                      value={task.duration}
                      onChange={(event) =>
                        setTask({
                          ...task,
                          duration: event.target.value,
                        })
                      }
                    />
                  </label>

                  <label>
                    {T("priority")}

                    <select
                      className="field mt-2"
                      value={task.priority}
                      onChange={(event) =>
                        setTask({
                          ...task,
                          priority: event.target.value,
                        })
                      }
                    >
                      {["high", "medium", "low"].map(
                        (value) => (
                          <option
                            value={value}
                            key={value}
                          >
                            {T(value)}
                          </option>
                        )
                      )}
                    </select>
                  </label>
                </div>

                <label className="block">
                  {T("deadline")}

                  <input
                    className="field mt-2"
                    type="date"
                    value={task.deadline}
                    onChange={(event) =>
                      setTask({
                        ...task,
                        deadline: event.target.value,
                      })
                    }
                  />
                </label>

                {["energy", "attention"].map(
                  (key) => (
                    <label
                      className="block"
                      key={key}
                    >
                      {T(key)} required: {task[key]}%

                      <input
                        className="range mt-2"
                        type="range"
                        min="0"
                        max="100"
                        value={task[key]}
                        onChange={(event) =>
                          setTask({
                            ...task,
                            [key]: Number(
                              event.target.value
                            ),
                          })
                        }
                      />
                    </label>
                  )
                )}

                <button
                  type="submit"
                  className="btn w-full"
                >
                  <Plus
                    size={17}
                    className="inline mr-1"
                  />
                  {T("add")}
                </button>
              </form>
            </section>

            {/* Task List */}
            <section className="panel p-6 lg:col-span-3">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {T("yourTasks")}
                </h2>

                <span className="pill">
                  {completed}/{total} {T("completed")}
                </span>
              </div>

              {!tasks.length && (
                <p className="muted">
                  {T("noTasks")}
                </p>
              )}

              {ordered.map((item) => (
                <motion.div
                  layout
                  key={item.id}
                  className="taskrow"
                >
                  <input
                    type="checkbox"
                    className="accent-emerald-300 h-5 w-5"
                    checked={item.done}
                    onChange={() =>
                      setTasks((previous) =>
                        previous.map((value) =>
                          value.id === item.id
                            ? {
                                ...value,
                                done: !value.done,
                              }
                            : value
                        )
                      )
                    }
                    aria-label={
                      "Complete " + item.title
                    }
                  />

                  <div className="flex-1 min-w-0">
                    <p
                      className={
                        "font-semibold break-words " +
                        (item.done
                          ? "line-through muted"
                          : "")
                      }
                    >
                      {item.title}
                    </p>

                    <p className="text-sm muted">
                      {T(item.priority)} ·{" "}
                      {item.duration} min{" "}
                      {item.deadline
                        ? "· " + item.deadline
                        : ""}{" "}
                      · {score(item, check)}% match
                    </p>
                  </div>

                  <button
                    type="button"
                    aria-label={
                      "Delete " + item.title
                    }
                    onClick={() =>
                      setTasks((previous) =>
                        previous.filter(
                          (value) =>
                            value.id !== item.id
                        )
                      )
                    }
                    className="muted hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </motion.div>
              ))}
            </section>
          </div>
  );
}
