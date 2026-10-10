
import React, { useState } from "react";

import {
  Dumbbell,
  Droplets,
  Moon,
  HeartPulse,
  Plus,
  CheckCircle2,
  Footprints,
  Flame,
} from "lucide-react";

// ========================================
// LocalStorage Helper
// ========================================

const read = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key)) ?? fallback;
  } catch {
    return fallback;
  }
};

// ========================================
// Main Wellness & Fitness Component
// ========================================

export default function WellnessFitness({
  page,
  readiness,
  check,
  Human,
}) {
  // Wellness State
  const [wellness, setWellness] = useState(() =>
    read("healthos_wellness", {
      water: 4,
      mood: 3,
      sleep: 7,
      steps: 3500,
    })
  );

  const waterGoal = 8; // Example glasses/day, not a personalized hydration prescription.
  const sleepGoal = 8; // General reference only.
  const waterRemaining = Math.max(0, waterGoal - wellness.water);
  const sleepRemaining = Math.max(0, sleepGoal - wellness.sleep);
  const calories = Math.round(Math.max(0, Number(wellness.steps) || 0) * 0.04);
  const activities = wellness.mood <= 2
    ? ["Try a gentle walk", "Take a breathing break", "Reach out to someone you trust"]
    : wellness.mood === 3
      ? ["Stretch for 10 minutes", "Take a short walk", "Choose one manageable task"]
      : ["Enjoy an outdoor activity", "Try a workout you like", "Tackle a priority task"];

  // Workout State
  const [workouts, setWorkouts] = useState(() =>
    read("healthos_workouts", [])
  );

  const [name, setName] = useState("Full-body strength");
  const [minutes, setMinutes] = useState(30);

  // ========================================
  // Save Wellness Data
  // ========================================

  const saveWellness = (next) => {
    setWellness(next);

    localStorage.setItem(
      "healthos_wellness",
      JSON.stringify(next)
    );
  };

  // ========================================
  // Save Workout Data
  // ========================================

  const saveWorkouts = (next) => {
    setWorkouts(next);

    localStorage.setItem(
      "healthos_workouts",
      JSON.stringify(next)
    );
  };

  // ========================================
  // Body Explorer Page
  // ========================================

  if (page === "body") {
    return (
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Interactive 3D Body */}
        <section className="panel p-6 lg:col-span-3">
          <h2 className="text-2xl font-bold mb-1">
            Interactive body explorer
          </h2>

          <p className="muted mb-4">
            Explore muscle regions and rotate the body in 3D.
          </p>

          <Human readiness={readiness} expanded />
        </section>

        {/* Body Readiness Information */}
        <section className="panel p-6 lg:col-span-2">
          <h3 className="text-xl font-bold mb-4">
            Body readiness
          </h3>

          <div className="text-5xl font-bold accent mb-2">
            {readiness}%
          </div>

          <p className="muted mb-6">
            Self-reported energy and attention;
            not a medical measurement.
          </p>

          <h3 className="font-semibold mb-3">
            Muscle explorer
          </h3>

          {[
            "Chest — push-ups, chest press",
            "Shoulders — overhead press, mobility",
            "Arms — curls, extensions",
            "Core — planks, stability",
            "Legs — squats, lunges",
          ].map((item) => (
            <div className="taskrow" key={item}>
              {item}
            </div>
          ))}

          <p className="muted text-sm mt-5">
            For detailed Adobe-style anatomy,
            add a properly licensed GLB asset under{" "}
            <code>client/public/models</code> and set{" "}
            <code>VITE_ANATOMY_MODEL_URL</code>.
          </p>
        </section>
      </div>
    );
  }

  // ========================================
  // Fitness Tracker Page
  // ========================================

  if (page === "fitness") {
    return (
      <div className="grid lg:grid-cols-5 gap-5">
        {/* Workout Form */}
        <section className="panel p-6 lg:col-span-2">
          <div className="flex items-center gap-3 mb-5">
            <Dumbbell className="accent" />

            <h2 className="text-2xl font-bold">
              Fitness tracker
            </h2>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();

              saveWorkouts([
                {
                  id: crypto.randomUUID(),
                  name,
                  minutes: Number(minutes),
                  date: new Date().toISOString(),
                },
                ...workouts,
              ]);
            }}
            className="space-y-4"
          >
            {/* Workout Name */}
            <label className="block">
              Workout name

              <input
                className="field mt-2"
                required
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
              />
            </label>

            {/* Workout Duration */}
            <label className="block">
              Duration (minutes)

              <input
                className="field mt-2"
                type="number"
                min="1"
                max="600"
                required
                value={minutes}
                onChange={(event) =>
                  setMinutes(event.target.value)
                }
              />
            </label>

            {/* Submit Button */}
            <button type="submit" className="btn w-full">
              <Plus size={16} className="inline" />
              {" "}Log workout
            </button>
          </form>

          {/* Total Training Time */}
          <div className="mt-6 panel p-4">
            <p className="muted">
              Total training time
            </p>

            <strong className="text-3xl accent">
              {workouts.reduce(
                (sum, workout) =>
                  sum + workout.minutes,
                0
              )}{" "}
              min
            </strong>
          </div>
        </section>

        {/* Workout History */}
        <section className="panel p-6 lg:col-span-3">
          <h2 className="text-xl font-bold mb-4">
            Workout history
          </h2>

          {workouts.length === 0 ? (
            <p className="muted">
              No workouts logged yet.
              Add your first session.
            </p>
          ) : (
            workouts.map((workout) => (
              <div
                className="taskrow"
                key={workout.id}
              >
                <CheckCircle2 className="accent" />

                <div className="flex-1">
                  <strong>{workout.name}</strong>

                  <p className="muted text-sm">
                    {new Date(
                      workout.date
                    ).toLocaleString()}
                    {" · "}
                    {workout.minutes} min
                  </p>
                </div>

                <button
                  type="button"
                  className="ghost text-sm"
                  onClick={() =>
                    saveWorkouts(
                      workouts.filter(
                        (item) =>
                          item.id !== workout.id
                      )
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))
          )}
        </section>
      </div>
    );
  }

  // ========================================
  // Wellness Dashboard Page
  // ========================================

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* ====================================
          Water Tracking
      ==================================== */}

      <div className="panel p-6">
        <Droplets className="accent mb-3" />

        <p className="muted">
          Water · glasses
        </p>

        <p className="text-4xl font-bold my-4">
          {wellness.water}
        </p>

        <button
          type="button"
          className="btn"
          onClick={() =>
            saveWellness({
              ...wellness,
              water: wellness.water + 1,
            })
          }
        >
          + Add glass
        </button>

        <button
          type="button"
          className="ghost ml-2"
          onClick={() =>
            saveWellness({
              ...wellness,
              water: 0,
            })
          }
        >
          Reset
        </button>
      </div>

      {/* ====================================
          Sleep Tracking
      ==================================== */}

      <div className="panel p-6">
        <Moon className="accent mb-3" />

        <p className="muted">
          Sleep · hours
        </p>

        <p className="text-4xl font-bold my-4">
          {wellness.sleep}
        </p>

        <input
          className="range"
          type="range"
          min="0"
          max="12"
          step="0.5"
          value={wellness.sleep}
          onChange={(event) =>
            saveWellness({
              ...wellness,
              sleep: Number(event.target.value),
            })
          }
        />
      </div>

      {/* ====================================
          Mood Tracking
      ==================================== */}

      <div className="panel p-6">
        <HeartPulse className="accent mb-3" />

        <p className="muted">
          Mood · 1–5
        </p>

        <p className="text-4xl font-bold my-4">
          {wellness.mood}/5
        </p>

        <input
          className="range"
          type="range"
          min="1"
          max="5"
          step="1"
          value={wellness.mood}
          onChange={(event) =>
            saveWellness({
              ...wellness,
              mood: Number(event.target.value),
            })
          }
        />
      </div>

      {/* ====================================
          Steps Tracking
      ==================================== */}

      <div className="panel p-6">
        <Dumbbell className="accent mb-3" />

        <p className="muted">
          Steps · self-reported
        </p>

        <input
          className="field mt-4"
          type="number"
          min="0"
          max="100000"
          value={wellness.steps}
          onChange={(event) =>
            saveWellness({
              ...wellness,
              steps:
                Number(event.target.value) || 0,
            })
          }
        />
      </div>

      {/* ====================================
          Wellness Overview
      ==================================== */}

      <section className="panel p-6 md:col-span-2 lg:col-span-4">
        <h2 className="text-xl font-bold">
          Wellness overview
        </h2>

        <p className="muted mt-2">
          Your entries are self-reported and
          stored locally in this browser.
          No diagnosis or medical advice is provided.
        </p>

        <div className="grid md:grid-cols-2 gap-4 mt-5" aria-live="polite">
          <div className="rounded-xl p-5 bg-slate-800/50"><h3 className="font-semibold flex items-center gap-2"><Droplets size={21} className="accent" aria-hidden="true" />Water goal</h3><p className="text-2xl font-bold accent mt-2">{waterRemaining ? `${waterRemaining} more glass${waterRemaining === 1 ? "" : "es"}` : "Goal reached!"}</p><p className="muted text-sm mt-2">{wellness.water}/{waterGoal} glasses. Example target only; hydration needs vary.</p></div>
          <div className="rounded-xl p-5 bg-slate-800/50"><h3 className="font-semibold flex items-center gap-2"><Moon size={21} className="accent" aria-hidden="true" />Sleep goal</h3><p className="text-2xl font-bold accent mt-2">{sleepRemaining ? `${sleepRemaining} more hour${sleepRemaining === 1 ? "" : "s"}` : "Goal reached!"}</p><p className="muted text-sm mt-2">{wellness.sleep}/{sleepGoal} hours. Comparison with an 8-hour reference, not a recommendation to make up sleep today.</p></div>
          <div className="rounded-xl p-5 bg-slate-800/50"><h3 className="font-semibold flex items-center gap-2"><HeartPulse size={21} className="accent" aria-hidden="true" />Mood-based activity ideas ({wellness.mood}/5)</h3><ul className="list-disc pl-5 text-sm mt-2 space-y-1">{activities.map(a => <li key={a}>{a}</li>)}</ul><p className="muted text-xs mt-2">General wellbeing suggestions, not treatment.</p></div>
          <div className="rounded-xl p-5 bg-slate-800/50"><h3 className="font-semibold flex items-center gap-2"><Flame size={21} className="accent" aria-hidden="true" />Estimated calories burned walking</h3><p className="text-3xl font-bold accent mt-2">~{calories} kcal</p><p className="muted text-sm mt-2">{Number(wellness.steps).toLocaleString()} steps × 0.04 kcal/step. Rough estimate; body weight, pace and terrain affect actual calories.</p></div>
        </div>
      </section>
    </div>
  );
}
