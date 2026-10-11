// src/pages/InsightsPage.jsx

import React, { useMemo, useState } from "react";
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
  T = (x) => x,
  checkins = [],
  completed = 0,
  total = 0,
  readiness = 0,
}) {
  const [period, setPeriod] = useState("Day");
  const [activeBar, setActiveBar] = useState(null);

  const pending = Math.max(0, total - completed);

  const completionRate =
    total > 0 ? Math.round((completed / total) * 100) : 0;

  // ========================================
  // Calculate Check-in Data
  // ========================================

  const data = useMemo(() => {
    const groups = new Map();

    for (const item of checkins) {
      const date = new Date(item.date);

      if (Number.isNaN(date.getTime())) continue;

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

      group.energy += Math.max(
        0,
        Math.min(100, Number(item.energy) || 0)
      );

      group.attention += Math.max(
        0,
        Math.min(100, Number(item.attention) || 0)
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
        attention: Math.round(group.attention / group.count),
      }));
  }, [checkins, period]);

  // ========================================
  // Format Chart Labels
  // ========================================

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

    return new Date(`${key}T12:00:00`).toLocaleDateString(
      undefined,
      {
        month: "short",
        day: "numeric",
      }
    );
  };

  // ========================================
  // Average Energy and Attention
  // ========================================

  const totalCheckins = data.reduce(
    (sum, item) => sum + item.count,
    0
  );

  const averageEnergy =
    totalCheckins > 0
      ? Math.round(
          data.reduce(
            (sum, item) => sum + item.energy * item.count,
            0
          ) / totalCheckins
        )
      : 0;

  const averageAttention =
    totalCheckins > 0
      ? Math.round(
          data.reduce(
            (sum, item) => sum + item.attention * item.count,
            0
          ) / totalCheckins
        )
      : 0;

  // ========================================
  // Statistics Cards
  // ========================================

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

  const periods = [
    { value: "Day", icon: CalendarDays },
    { value: "Month", icon: CalendarRange },
    { value: "Year", icon: Calendar },
  ];

  return (
    <div className="space-y-5">
      {/* ========================================
          PAGE HEADER
      ======================================== */}

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

      {/* ========================================
          STATISTICS CARDS
      ======================================== */}

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
                  <Icon
                    size={23}
                    className={stat.color}
                  />
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

      {/* ========================================
          RECENT CHECK-INS
      ======================================== */}

      <section className="panel p-5">
        {/* Chart Header */}

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

          {/* Period Filters */}

          <div
            className="flex flex-wrap gap-2"
            role="group"
            aria-label="Chart period"
          >
            {periods.map(({ value, icon: Icon }) => (
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

        {data.length === 0 ? (
          /* ========================================
              EMPTY STATE
          ======================================== */

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
            {/* ========================================
                ENERGY & ATTENTION LEGEND
                Minimal bottom spacing
            ======================================== */}

            <div className="mb-5 pb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
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

            {/* ========================================
                SELECTED BAR DETAILS
                No empty space when inactive
            ======================================== */}

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

            {/* ========================================
                BAR CHART
            ======================================== */}

            <div
              className="mt-5 flex gap-2"
              role="group"
              aria-label="Check-in bar chart"
            >
              {/* Y-Axis */}

              <div className="muted flex h-60 flex-col justify-between pb-8 text-xs">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>

              {/* Chart Bars */}

              <div className="min-w-0 flex-1 overflow-x-auto">
                <div className="flex h-60 min-w-max gap-2 border-b border-slate-600">
                  {data.map((item) => (
                    <div
                      key={item.key}
                      className="flex w-16 shrink-0 flex-col items-center"
                    >
                      <button
                        type="button"
                        onMouseEnter={() =>
                          setActiveBar(item)
                        }
                        onMouseLeave={() =>
                          setActiveBar(null)
                        }
                        onFocus={() =>
                          setActiveBar(item)
                        }
                        onBlur={() =>
                          setActiveBar(null)
                        }
                        onClick={() =>
                          setActiveBar(item)
                        }
                        className="flex h-52 w-full cursor-pointer items-end justify-center gap-1 rounded transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
                        aria-label={`${formatLabel(
                          item.key
                        )}: Energy ${item.energy}%, Attention ${
                          item.attention
                        }%, ${item.count} check-ins`}
                      >
                        {/* Energy Bar */}

                        <span
                          className="w-5 rounded-t bg-emerald-400 transition-opacity hover:opacity-80"
                          style={{
                            height: `${item.energy}%`,
                          }}
                        />

                        {/* Attention Bar */}

                        <span
                          className="w-5 rounded-t bg-sky-400 transition-opacity hover:opacity-80"
                          style={{
                            height: `${item.attention}%`,
                          }}
                        />
                      </button>

                      {/* X-Axis Label */}

                      <span className="muted mt-2 whitespace-nowrap text-xs">
                        {formatLabel(item.key)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ========================================
                CHART FOOTER
            ======================================== */}

            <p className="muted mt-3 flex items-center gap-2 text-xs">
              <Info size={14} />
              Last 12 periods with saved check-ins.
              Periods without data are omitted.
            </p>
          </>
        )}
      </section>

      {/* ========================================
          AVERAGE ENERGY & ATTENTION
      ======================================== */}

      {data.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2">
          {/* Average Energy */}

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-500/10 p-3">
                <Zap
                  size={24}
                  className="text-emerald-400"
                />
              </div>

              <div>
                <h3 className="font-semibold">
                  Average Energy
                </h3>

                <p className="muted text-sm">
                  Across displayed{" "}
                  {period.toLowerCase()} periods
                </p>
              </div>
            </div>

            <p className="mt-5 text-3xl font-bold text-emerald-400">
              {averageEnergy}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                style={{
                  width: `${averageEnergy}%`,
                }}
              />
            </div>
          </div>

          {/* Average Attention */}

          <div className="panel p-6">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-sky-500/10 p-3">
                <Brain
                  size={24}
                  className="text-sky-400"
                />
              </div>

              <div>
                <h3 className="font-semibold">
                  Average Attention
                </h3>

                <p className="muted text-sm">
                  Across displayed{" "}
                  {period.toLowerCase()} periods
                </p>
              </div>
            </div>

            <p className="mt-5 text-3xl font-bold text-sky-400">
              {averageAttention}%
            </p>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-700">
              <div
                className="h-full rounded-full bg-sky-400 transition-all duration-500"
                style={{
                  width: `${averageAttention}%`,
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}