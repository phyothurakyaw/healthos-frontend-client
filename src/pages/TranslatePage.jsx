import React from "react";
import { motion } from "motion/react";
import { Activity, Brain, Clock, Globe2, Plus, Trash2, Play, Pause, RotateCcw } from "lucide-react";

export default function TranslatePage({ Human, score, T, check, setCheck, tasks, setTasks, checkins, setCheckins, task, setTask, readiness, recommended, ordered, completed, total, seconds, setSeconds, running, setRunning, setPage, saveCheck, addTask, from, setFrom, to, setTo, original, setOriginal, translated, setTranslated, busy, doTranslate, languages }) {
  return (
<section className="panel p-7 max-w-4xl">
            <div className="flex items-center gap-3 mb-6">
              <Globe2 className="accent" />

              <h2 className="text-2xl font-bold">
                {T("translateText")}
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {/* Source Language */}
              <div>
                <label>
                  {T("source")}

                  <select
                    className="field mt-2 mb-4"
                    value={from}
                    onChange={(event) =>
                      setFrom(event.target.value)
                    }
                  >
                    {Object.entries(languages).map(
                      ([key, value]) => (
                        <option
                          key={key}
                          value={key}
                        >
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <textarea
                  className="field h-48"
                  placeholder={T("text")}
                  maxLength={4000}
                  value={original}
                  onChange={(event) =>
                    setOriginal(event.target.value)
                  }
                />
              </div>

              {/* Target Language */}
              <div>
                <label>
                  {T("target")}

                  <select
                    className="field mt-2 mb-4"
                    value={to}
                    onChange={(event) =>
                      setTo(event.target.value)
                    }
                  >
                    {Object.entries(languages).map(
                      ([key, value]) => (
                        <option
                          key={key}
                          value={key}
                        >
                          {value}
                        </option>
                      )
                    )}
                  </select>
                </label>

                <div className="field h-48 overflow-auto whitespace-pre-wrap">
                  {translated || T("result")}
                </div>
              </div>
            </div>

            <button
              type="button"
              disabled={busy || !original.trim()}
              className="btn mt-5"
              onClick={doTranslate}
            >
              {busy ? "Translating…" : T("go")}
            </button>

            <p className="muted text-sm mt-4">
              Powered by Google Cloud Translation API
              (configured securely on the backend).
              Supports English, Burmese, Chinese,
              and Spanish.
            </p>
          </section>
  );
}
