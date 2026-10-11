
import { api } from "./api";

// Convert the frontend's numeric percentage into
// the low / medium / high values required by MongoDB.
export function toLevel(value) {
  const text = String(value).toLowerCase();

  if (["low", "medium", "high"].includes(text)) {
    return text;
  }

  const number = Number(value) || 0;

  if (number >= 75) return "high";
  if (number >= 45) return "medium";
  return "low";
}

// The backend stores task requirements as categories,
// not exact percentages. These numbers are UI display
// equivalents, not the original user-entered percentages.
export function fromLevel(value) {
  if (typeof value === "number") return value;

  return {
    low: 25,
    medium: 60,
    high: 90,
  }[String(value).toLowerCase()] ?? 50;
}

export function normalizeTask(task) {
  return {
    ...task,
    id: String(task._id ?? task.id),
    duration: Number(
      task.estimatedMinutes ?? task.duration ?? 25
    ),
    energy: fromLevel(
      task.requiredEnergy ?? task.energy
    ),
    attention: fromLevel(
      task.requiredAttention ?? task.attention
    ),
    deadline: task.deadline
      ? String(task.deadline).slice(0, 10)
      : "",
    done: task.status
      ? task.status === "completed"
      : Boolean(task.done),
  };
}

export function normalizeCheckIn(checkin) {
  if (!checkin) return null;

  return {
    ...checkin,
    id: String(checkin._id ?? checkin.id),
    date:
      checkin.createdAt ??
      checkin.date ??
      new Date().toISOString(),
    energy: Number(
      checkin.energyScore ?? checkin.energy ?? 0
    ),
    attention: Number(
      checkin.attentionScore ?? checkin.attention ?? 0
    ),
  };
}

// GET /api/tasks
export async function getTasks() {
  const tasks = await api("/tasks");

  return tasks.map(normalizeTask);
}

// POST /api/tasks
export async function createTask(task) {
  const payload = {
    title: task.title.trim(),
    estimatedMinutes: Number(task.duration),
    requiredEnergy: toLevel(task.energy),
    requiredAttention: toLevel(task.attention),
    priority: task.priority,
    status: "pending",
  };

  if (task.deadline) {
    payload.deadline = task.deadline;
  }

  const result = await api("/tasks", {
    method: "POST",
    body: JSON.stringify(payload),
  });

  return normalizeTask(result);
}

// PATCH /api/tasks/:id
export async function updateTask(id, changes) {
  const payload = {};

  if (changes.title !== undefined) {
    payload.title = changes.title;
  }

  if (changes.duration !== undefined) {
    payload.estimatedMinutes = Number(changes.duration);
  }

  if (changes.energy !== undefined) {
    payload.requiredEnergy = toLevel(changes.energy);
  }

  if (changes.attention !== undefined) {
    payload.requiredAttention = toLevel(changes.attention);
  }

  if (changes.priority !== undefined) {
    payload.priority = changes.priority;
  }

  if (changes.deadline !== undefined) {
    payload.deadline = changes.deadline || null;
  }

  if (changes.done !== undefined) {
    payload.status = changes.done
      ? "completed"
      : "pending";
  }

  const result = await api(
    `/tasks/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    }
  );

  return normalizeTask(result);
}

// DELETE /api/tasks/:id
export async function deleteTask(id) {
  return api(`/tasks/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

// POST /api/checkins
export async function createCheckIn(values) {
  const result = await api("/check-ins", {
    method: "POST",
    body: JSON.stringify({
      sleepHours: Number(values.sleepHours),
      sleepQuality: Number(values.sleepQuality),
      activityMinutes: Number(values.activityMinutes),
      perceivedEnergy: Number(values.perceivedEnergy),
      perceivedFocus: Number(values.perceivedFocus),
    }),
  });

  return normalizeCheckIn(result);
}

// POST /api/checkins/smart
export async function createSmartCheckIn(values) {
  const result = await api("/check-ins/smart", {
    method: "POST",
    body: JSON.stringify({
      sleepHours: Number(values.sleepHours),
      activityLevel: values.activityLevel,
      mood: values.mood,
    }),
  });

  return normalizeCheckIn(result.checkIn);
}

// GET /api/checkins/latest
export async function getLatestCheckIn() {
  const result = await api("/check-ins/latest");

  return normalizeCheckIn(result);
}

// GET /api/recommendations?availableMinutes=60
export async function getRecommendations(availableMinutes) {
  const minutes = Math.max(
    1,
    Math.round(Number(availableMinutes) || 25)
  );

  const result = await api(
    `/recommendations?availableMinutes=${minutes}`
  );

  return {
    ...result,

    recommendedTask: result.recommendedTask
      ? normalizeTask(result.recommendedTask)
      : null,

    recommendations: (
      result.recommendations || []
    ).map((item) => ({
      ...item,
      task: normalizeTask(item.task),
    })),
  };
}
