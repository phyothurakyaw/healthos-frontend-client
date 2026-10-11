
import React, { useEffect, useMemo, useState } from "react";
import { api, getToken } from "../security/api";
import {
  BarChart3,
  CheckCircle2,
  Clock3,
  Activity,
  Zap,
  Brain,
  CalendarDays,
  CalendarRange,
  Calendar,
  TrendingUp,
  ClipboardList,
  Info,
} from "lucide-react";

export default function InsightsPage({
  T = (value) => value,
  checkins = [],
  completed = 0,
  total = 0,
  readiness = 0,
}) {
  const [period, setPeriod] = useState("Day");
  const [activeBar, setActiveBar] = useState(null);
  const [databaseCheckins, setDatabaseCheckins] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState("");

  // Load real check-in records from the database.
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      setLoadingHistory(true);
      setHistoryError("");

      try {
        if (!getToken()) {
          throw new Error(
            "Sign in to view your saved check-in history."
          );
        }

        // Keep this path if it matches your backend route.
        const response = await api("/check-ins/history");

        // Your backend returns { total, data, filter }.
        const records = Array.isArray(response?.data)
          ? response.data
          : Array.isArray(response?.checkins)
          ? response.checkins
          : Array.isArray(response)
          ? response
          : null;

        if (!records) {
          throw new Error(
            "Unexpected check-in history response."
          );
        }

        if (!cancelled) {
          setDatabaseCheckins(records);
        }
      } catch (error) {
        if (!cancelled) {
          setDatabaseCheckins([]);
          setHistoryError(
            error.message || "Unable to load check-in history."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingHistory(false);
        }
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, [checkins]);

  const pending = Math.max(0, total - completed);

  const completionRate = total
    ? Math.round((completed / total) * 100)
    : 0;

  // Use only createdAt, energyScore, and attentionScore.
  const data = useMemo(() => {
    const groups = new Map();

    for (const item of databaseCheckins) {
      if (!item.createdAt) continue;
      if (
        item.energyScore == null ||
        item.attentionScore == null
      ) {
        continue;
      }

      const date = new Date(item.createdAt);
      const energy = Number(item.energyScore);
      const attention = Number(item.attentionScore);

      if (
        Number.isNaN(date.getTime()) ||
        !Number.isFinite(energy) ||
        !Number.isFinite(attention)
      ) {
        continue;
      }

      let key;

      if (period === "Year") {
        key = String(date.getFullYear());
      } else if (period === "Month") {
        key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}`;
      } else {
        key = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, "0")}-${String(
          date.getDate()
        ).padStart(2, "0")}`;
      }

      const group = groups.get(key) || {
        key,
        energy: 0,
        attention: 0,
        count: 0,
      };

      group.energy += Math.max(0, Math.min(100, energy));
      group.attention += Math.max(
        0,
        Math.min(100, attention)
      );
      group.count += 1;

      groups.set(key, group);
    }

    return [...groups.values()]
      .sort((a, b) => a.key.localeCompare(b.key))
      .slice(-12)
      .map((group) => ({
        ...group,
        energy: Math.round(group.energy / group.count),
        attention: Math.round(
          group.attention / group.count
        ),
      }));
  }, [databaseCheckins, period]);

  const formatLabel = (key) => {
    if (period === "Year") return key;

    if (period === "Month") {
      return new Date(
        `${key}-01T12:00:00`
      ).toLocaleDateString(undefined, {
        month: "short",
        year: "2-digit",
      });
    }

    return new Date(
      `${key}T12:00:00`
    ).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    });
  };

  // Weighted averages across the displayed records.
  const totalCheckins = data.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const averageEnergy = totalCheckins
    ? Math.round(
        data.reduce(
          (sum, item) => sum + item.energy * item.count,
          0
        ) / totalCheckins
      )
    : 0;

  const averageAttention = totalCheckins
    ? Math.round(
        data.reduce(
          (sum, item) => sum + item.attention * item.count,
          0
        ) / totalCheckins
      )
    : 0;

  const stats = [
    {
      title: T("Completed Tasks"),
      value: completed,
      subtitle: `${completionRate}% completion rate`,
      icon: CheckCircle2,
      color: "text-emerald-400",
      background: "bg-emerald-500/10",
    },
    {
      title: T("Pending Tasks"),
      value: pending,
      subtitle: `${total} total tasks`,
      icon: Clock3,
      color: "text-amber-400",
      background: "bg-amber-500/10",
    },
    {
      title: T("Readiness Score"),
      value: `${readiness}%`,
      subtitle: "Current readiness",
      icon: Activity,
      color: "text-sky-400",
      background: "bg-sky-500/10",
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <div className="mb-2 flex items-center gap-2">
          <BarChart3
            size={21}
            className="text-sky-400"
          />
          <span className="text-sm font-semibold uppercase tracking-wider text-sky-400">
            HealthOS Analytics
          </span>
        </div>

        <h1 className="text-2xl font-bold md:text-3xl">
          {T("Insights")}
        </h1>

        <p className="muted mt-2">
          Understand your energy, attention, and productivity.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.title} className="panel p-6">
              <div className="flex items-center justify-between gap-3">
                <p className="muted font-medium">
                  {stat.title}
                </p>

                <div
                  className={`rounded-xl p-3 ${stat.background}`}
                >
                  <Icon size={23} className={stat.color} />
                </div>
              </div>

              <p
                className={`mt-4 text-4xl font-bold ${stat.color}`}
              >
                {stat.value}
              </p>

              <p className="muted mt-2 flex items-center gap-2 text-sm">
                <TrendingUp size={14} />
                {stat.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* Recent Check-ins Chart */}
      <section className="panel p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-bold">
              <BarChart3
                size={22}
                className="text-sky-400"
              />
              Recent Check-ins
            </h2>

            <p className="muted mt-1 text-sm">
              Average energy and attention by{" "}
              {period.toLowerCase()}
            </p>
          </div>

          {/* Day / Month / Year */}
          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Chart period"
          >
            {[
              ["Day", CalendarDays],
              ["Month", CalendarRange],
              ["Year", Calendar],
            ].map(([value, Icon]) => (
              <button
                key={value}
                type="button"
                aria-pressed={period === value}
                className={`flex items-center gap-2 ${
                  period === value ? "btn" : "ghost"
                }`}
                onClick={() => {
                  setPeriod(value);
                  setActiveBar(null);
                }}
              >
                <Icon size={16} />
                {value}
              </button>
            ))}
          </div>
        </div>

        {loadingHistory ? (
          <div className="py-10 text-center muted">
            Loading check-in history...
          </div>
        ) : historyError ? (
          <div
            className="py-10 text-center text-red-400"
            role="alert"
          >
            {historyError}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="mb-4 rounded-full bg-sky-500/10 p-4">
              <ClipboardList
                size={35}
                className="text-sky-400"
              />
            </div>

            <h3 className="font-semibold">
              No check-in data yet
            </h3>

            <p className="muted mt-2 text-sm">
              Save a check-in on the Dashboard to see
              your energy and attention chart.
            </p>
          </div>
        ) : (
          <>
            {/* Legend */}
            <div className="mb-1 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="flex items-center gap-2">
                <Zap
                  size={17}
                  className="text-emerald-400"
                />
                Energy
                <span className="inline-block h-3 w-3 rounded-sm bg-emerald-400" />
              </span>

              <span className="flex items-center gap-2">
                <Brain
                  size={17}
                  className="text-sky-400"
                />
                Attention
                <span className="inline-block h-3 w-3 rounded-sm bg-sky-400" />
              </span>
            </div>

            {/* Selected Bar Details */}
            {activeBar && (
              <div
                className="mb-2 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-slate-600 bg-slate-950 px-4 py-2 text-sm text-white shadow-lg"
                role="status"
                aria-live="polite"
              >
                <span className="flex items-center gap-2 font-semibold">
                  <CalendarDays size={16} />
                  {formatLabel(activeBar.key)}
                </span>

                <span className="flex items-center gap-2">
                  <Zap
                    size={16}
                    className="text-emerald-400"
                  />
                  Energy:
                  <strong>{activeBar.energy}%</strong>
                </span>

                <span className="flex items-center gap-2">
                  <Brain
                    size={16}
                    className="text-sky-400"
                  />
                  Attention:
                  <strong>{activeBar.attention}%</strong>
                </span>

                <span className="flex items-center gap-2 text-slate-400">
                  <ClipboardList size={14} />
                  {activeBar.count} check-in
                  {activeBar.count === 1 ? "" : "s"}
                </span>
              </div>
            )}

            {/* Original Bar Chart UI */}
            <div
              className="flex gap-2"
              role="group"
              aria-label="Check-in bar chart"
            >
              {/* Y Axis */}
              <div className="muted flex h-60 flex-col justify-between pb-8 text-xs">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Bars */}
              <div className="min-w-0 flex-1 overflow-x-auto">
                <div className="flex h-60 min-w-max gap-2 border-b border-slate-600">
                  {data.map((item) => (
                    <div
                      key={item.key}
                      className="flex w-16 shrink-0 flex-col items-center"
                    >
                      <button
                        type="button"
                        onMouseEnter={() => setActiveBar(item)}
                        onMouseLeave={() => setActiveBar(null)}
                        onFocus={() => setActiveBar(item)}
                        onBlur={() => setActiveBar(null)}
                        onClick={() => setActiveBar(item)}
                        className="flex h-52 w-full cursor-pointer items-end justify-center gap-1 rounded transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                        aria-label={`${formatLabel(
                          item.key
                        )}: Energy ${item.energy}%, Attention ${item.attention}%`}
                      >
                        {/* Energy */}
                        <span
                          className="w-5 rounded-t bg-emerald-400"
                          style={{
                            height: `${Math.max(
                              0,
                              Math.min(100, item.energy)
                            )}%`,
                          }}
                        />

                        {/* Attention */}
                        <span
                          className="w-5 rounded-t bg-sky-400"
                          style={{
                            height: `${Math.max(
                              0,
                              Math.min(100, item.attention)
                            )}%`,
                          }}
                        />
                      </button>

                      <span className="muted mt-2 whitespace-nowrap text-xs">
                        {formatLabel(item.key)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="muted mt-3 flex items-center gap-2 text-xs">
              <Info size={14} />
              Last 12 periods with available check-in data.
            </p>
          </>
        )}
      </section>

      {/* Average Energy and Attention */}
      {!loadingHistory &&
        !historyError &&
        data.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: "Average Energy",
                value: averageEnergy,
                Icon: Zap,
                color: "text-emerald-400",
                background: "bg-emerald-500/10",
                bar: "bg-emerald-400",
              },
              {
                title: "Average Attention",
                value: averageAttention,
                Icon: Brain,
                color: "text-sky-400",
                background: "bg-sky-500/10",
                bar: "bg-sky-400",
              },
            ].map((item) => (
              <div key={item.title} className="panel p-6">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl p-3 ${item.background}`}
                  >
                    <item.Icon
                      size={24}
                      className={item.color}
                    />
                  </div>

                  <div>
                    <h3 className="font-semibold">
                      {item.title}
                    </h3>

                    <p className="muted text-sm">
                      Across displayed{" "}
                      {period.toLowerCase()} periods
                    </p>
                  </div>
                </div>

                <p
                  className={`mt-5 text-3xl font-bold ${item.color}`}
                >
                  {item.value}%
                </p>

                <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${item.bar}`}
                    style={{
                      width: `${item.value}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
