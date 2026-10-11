
import React, { useState } from "react";
import {
  ListTodo, Plus, Trash2, Clock3, CalendarDays,
  Target, Zap, Brain, Play, Pause, RotateCcw,
  CheckCircle2, Circle, Sparkles, Timer,
  ArrowRight, AlertCircle,
} from "lucide-react";

const formatTime = (seconds) => {
  const safe = Math.max(0, Math.floor(seconds || 0));
  return `${String(Math.floor(safe / 60)).padStart(2, "0")}:${String(safe % 60).padStart(2, "0")}`;
};

const priorityColors = {
  high: "text-red-400 bg-red-500/10 border-red-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

export default function TasksPage({
  T, check, tasks, task, setTask, recommended, ordered,
  completed, total, score, seconds, setSeconds,
  running, setRunning, focusSessionStarted,
  setFocusSessionStarted, addTask, toggleTask,
  deleteTask, busy,
}) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [filter, setFilter] = useState("all");
  const [selectedTaskId, setSelectedTaskId] = useState(null);

  const selectedTask = tasks.find(
    (item) => item.id === selectedTaskId && !item.done
  );

  const focusTask = selectedTask || recommended;

  const focusDuration = Math.max(
    1,
    Number(focusTask?.duration) || 25
  );

  const totalFocusSeconds = focusDuration * 60;

  const progress = Math.min(
    100,
    Math.max(
      0,
      ((totalFocusSeconds - seconds) /
        totalFocusSeconds) * 100
    )
  );

  const startTimer = () => {
    if (!focusTask) return;

    if (seconds <= 0) {
      setSeconds(totalFocusSeconds);
    }

    setFocusSessionStarted(true);
    setRunning(true);
  };

  const pauseTimer = () => setRunning(false);

  const resetTimer = () => {
    setRunning(false);
    setFocusSessionStarted(false);
    setSeconds(totalFocusSeconds);
  };

  const focusOnTask = (item) => {
    setSelectedTaskId(item.id);
    setRunning(false);
    setFocusSessionStarted(false);
    setSeconds(
      Math.max(1, Number(item.duration) || 25) * 60
    );
  };

  const handleDelete = async (id) => {
    const success = await deleteTask(id);

    if (success && selectedTaskId === id) {
      setSelectedTaskId(null);
      resetTimer();
    }
  };

  const finishFocusTask = async () => {
    if (!focusTask) return;

    const success = await toggleTask(focusTask.id, true);
    if (!success) return;

    setSelectedTaskId(null);
    setRunning(false);
    setFocusSessionStarted(false);
  };

  const filteredTasks = ordered.filter((item) => {
    if (filter === "active") return !item.done;
    if (filter === "completed") return item.done;
    return true;
  });

  const completionPercentage =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  const match = (item) => {
    const result = score(item, check);
    return result == null ? "Not ranked" : `${Math.round(result)}% match`;
  };

  const changeTaskField = (key, value) =>
    setTask((previous) => ({
      ...previous,
      [key]: value,
    }));

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <ListTodo size={19} className="text-cyan-400" />
            <span className="text-sm text-cyan-400 font-semibold">
              TASK MANAGEMENT
            </span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">
            Your Tasks
          </h2>
          <p className="muted mt-2">
            Plan your day, protect your attention, and stay productive.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddTask((value) => !value)}
          className="btn-primary flex items-center gap-2 px-5 py-3 rounded-xl"
        >
          <Plus size={18} />
          Add Task
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Total Tasks</span>
            <ListTodo size={19} className="text-cyan-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{total}</p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Completed</span>
            <CheckCircle2 size={19} className="text-emerald-400" />
          </div>
          <p className="text-3xl font-bold mt-3">{completed}</p>
        </div>

        <div className="panel p-5">
          <div className="flex items-center justify-between">
            <span className="muted text-sm">Progress</span>
            <Target size={19} className="text-purple-400" />
          </div>
          <p className="text-3xl font-bold mt-3">
            {completionPercentage}%
          </p>
          <div className="h-2 bg-white/10 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-cyan-400 rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommendation and Timer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={20} className="text-cyan-400" />
            <h3 className="text-xl font-bold">
              Recommended Next Task
            </h3>
          </div>

          {recommended ? (
            <>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="muted text-sm mb-2">
                    Best task for your current energy and attention
                  </p>
                  <h4 className="text-2xl font-bold">
                    {recommended.title}
                  </h4>
                </div>
                <div className="rounded-xl bg-cyan-500/10 border border-cyan-500/20 px-3 py-2 text-center">
                  <p className="text-2xl font-bold text-cyan-400">
                    {score(recommended, check) == null
                      ? "—"
                      : Math.round(score(recommended, check))}
                  </p>
                  <p className="text-xs muted">Match</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 mt-6">
                <span
                  className={`px-3 py-1 rounded-full border text-xs font-semibold ${
                    priorityColors[recommended.priority] ||
                    priorityColors.medium
                  }`}
                >
                  {recommended.priority?.toUpperCase()} PRIORITY
                </span>
                <span className="flex items-center gap-1 text-sm muted">
                  <Clock3 size={15} />
                  {recommended.duration} min
                </span>
                {recommended.deadline && (
                  <span className="flex items-center gap-1 text-sm muted">
                    <CalendarDays size={15} />
                    {recommended.deadline}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-6">
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm muted">
                    <Zap size={16} className="text-amber-400" />
                    Energy needed
                  </div>
                  <p className="text-xl font-bold mt-2">
                    {recommended.energy}%
                  </p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <div className="flex items-center gap-2 text-sm muted">
                    <Brain size={16} className="text-purple-400" />
                    Attention needed
                  </div>
                  <p className="text-xl font-bold mt-2">
                    {recommended.attention}%
                  </p>
                </div>
              </div>

              {recommended.explanation && (
                <p className="muted text-sm mt-4">
                  {recommended.explanation}
                </p>
              )}

              <button
                type="button"
                onClick={() => focusOnTask(recommended)}
                className="btn-primary mt-6 w-full py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <Target size={17} />
                Focus on This Task
                <ArrowRight size={17} />
              </button>
            </>
          ) : (
            <div className="text-center py-12">
              <CheckCircle2
                size={45}
                className="text-emerald-400 mx-auto mb-4"
              />
              <h4 className="text-lg font-bold">
                No recommended task
              </h4>
              <p className="muted mt-2">
                Complete a check-in and add a task to get a recommendation.
              </p>
            </div>
          )}
        </div>

        {/* Focus Timer */}
        <div className="panel p-6">
          <div className="flex items-center gap-2 mb-5">
            <Timer size={20} className="text-purple-400" />
            <h3 className="text-xl font-bold">Focus Timer</h3>
          </div>

          {focusTask ? (
            <div className="text-center">
              <p className="muted text-sm">Currently focusing on</p>
              <h4 className="font-semibold mt-2 text-lg">
                {focusTask.title}
              </h4>

              <div className="relative w-52 h-52 mx-auto my-6">
                <svg
                  className="w-full h-full -rotate-90"
                  viewBox="0 0 200 200"
                >
                  <circle
                    cx="100" cy="100" r="88"
                    fill="none" stroke="currentColor"
                    strokeWidth="9" className="text-white/10"
                  />
                  <circle
                    cx="100" cy="100" r="88"
                    fill="none" stroke="currentColor"
                    strokeWidth="9" strokeLinecap="round"
                    className="text-cyan-400 transition-all duration-500"
                    strokeDasharray={2 * Math.PI * 88}
                    strokeDashoffset={
                      2 * Math.PI * 88 * (1 - progress / 100)
                    }
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold tracking-wider tabular-nums">
                    {formatTime(seconds)}
                  </span>
                  <span className="muted text-sm mt-2">
                    {running
                      ? "Stay focused"
                      : seconds === 0
                        ? "Session finished"
                        : "Ready to focus"}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={running ? pauseTimer : startTimer}
                  className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
                >
                  {running ? <Pause size={17} /> : <Play size={17} />}
                  {running
                    ? "Pause"
                    : focusSessionStarted
                      ? "Resume"
                      : "Start Focus"}
                </button>

                <button
                  type="button"
                  onClick={resetTimer}
                  className="px-5 py-3 rounded-xl border border-white/20 flex items-center gap-2"
                >
                  <RotateCcw size={17} />
                  Reset
                </button>
              </div>

              <button
                type="button"
                onClick={finishFocusTask}
                className="mt-5 text-sm text-emerald-400 hover:underline flex items-center gap-2 mx-auto"
              >
                <CheckCircle2 size={17} />
                Mark Task as Completed
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Timer
                size={45}
                className="text-purple-400 mx-auto mb-4"
              />
              <h4 className="text-lg font-bold">No active task</h4>
              <p className="muted mt-2">
                Add a task to start a focus session.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Task Form */}
      {showAddTask && (
        <div className="panel p-6">
          <h3 className="text-xl font-bold mb-5">
            Create New Task
          </h3>

          <form
            onSubmit={async (event) => {
              try {
                await addTask(event);
                setShowAddTask(false);
              } catch {
                // Error is displayed by App.jsx.
              }
            }}
            className="space-y-5"
          >
            <div>
              <label className="block text-sm font-medium mb-2">
                Task Name
              </label>
              <input
                type="text"
                required
                value={task.title}
                onChange={(event) =>
                  changeTaskField("title", event.target.value)
                }
                placeholder="e.g. Complete algorithms assignment"
                className="w-full rounded-xl p-3 bg-white/5 border border-white/10 outline-none focus:border-cyan-400"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Priority
                </label>
                <select
                  value={task.priority}
                  onChange={(event) =>
                    changeTaskField("priority", event.target.value)
                  }
                  className="w-full rounded-xl p-3 bg-white/5 border border-white/10"
                >
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Duration (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="480"
                  required
                  value={task.duration}
                  onChange={(event) =>
                    changeTaskField(
                      "duration",
                      Number(event.target.value)
                    )
                  }
                  className="w-full rounded-xl p-3 bg-white/5 border border-white/10"
                />
              </div>

              {[
                ["energy", "Energy Required (%)"],
                ["attention", "Attention Required (%)"],
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="block text-sm font-medium mb-2">
                    {label}
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={task[key]}
                    onChange={(event) =>
                      changeTaskField(
                        key,
                        Number(event.target.value)
                      )
                    }
                    className="w-full rounded-xl p-3 bg-white/5 border border-white/10"
                  />
                </div>
              ))}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Deadline (optional)
              </label>
              <input
                type="date"
                value={task.deadline || ""}
                onChange={(event) =>
                  changeTaskField("deadline", event.target.value)
                }
                className="w-full rounded-xl p-3 bg-white/5 border border-white/10"
              />
            </div>

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={busy}
                className="btn-primary px-6 py-3 rounded-xl flex items-center gap-2"
              >
                <Plus size={17} />
                {busy ? "Saving..." : "Save Task"}
              </button>
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-6 py-3 rounded-xl border border-white/20"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* All Tasks */}
      <div className="panel p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-xl font-bold">All Tasks</h3>
            <p className="muted text-sm mt-1">
              Organized by recommendation and priority
            </p>
          </div>

          <div className="flex gap-2 flex-wrap">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["completed", "Completed"],
            ].map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setFilter(value)}
                className={`px-4 py-2 rounded-lg text-sm border transition ${
                  filter === value
                    ? "bg-cyan-500/15 text-cyan-400 border-cyan-500/30"
                    : "border-white/10 muted"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <AlertCircle
              size={40}
              className="muted mx-auto mb-4"
            />
            <p className="muted">No tasks found.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTasks.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 flex flex-wrap items-center justify-between gap-4 transition ${
                  item.done
                    ? "border-white/5 opacity-60"
                    : "border-white/10 hover:border-cyan-500/30"
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleTask(item.id)}
                    className="mt-1"
                    aria-label={
                      item.done
                        ? "Mark task incomplete"
                        : "Mark task complete"
                    }
                  >
                    {item.done ? (
                      <CheckCircle2
                        size={23}
                        className="text-emerald-400"
                      />
                    ) : (
                      <Circle size={23} className="muted" />
                    )}
                  </button>

                  <div className="min-w-0">
                    <h4
                      className={`font-semibold ${
                        item.done ? "line-through" : ""
                      }`}
                    >
                      {item.title}
                    </h4>

                    <div className="flex flex-wrap gap-3 mt-2 text-xs muted">
                      <span
                        className={`px-2 py-1 rounded-full border ${
                          priorityColors[item.priority] ||
                          priorityColors.medium
                        }`}
                      >
                        {item.priority}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock3 size={13} />
                        {item.duration} min
                      </span>

                      {item.deadline && (
                        <span className="flex items-center gap-1">
                          <CalendarDays size={13} />
                          {item.deadline}
                        </span>
                      )}

                      {!item.done && (
                        <span className="flex items-center gap-1 text-cyan-400">
                          <Sparkles size={13} />
                          {match(item)}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!item.done && (
                    <button
                      type="button"
                      onClick={() => focusOnTask(item)}
                      className="px-3 py-2 rounded-lg bg-cyan-500/10 text-cyan-400 text-sm flex items-center gap-2"
                    >
                      <Play size={14} />
                      Focus
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-2 rounded-lg text-red-400 hover:bg-red-500/10"
                    aria-label={`Delete ${item.title}`}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
