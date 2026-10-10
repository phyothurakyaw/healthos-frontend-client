import React, { useMemo, useState } from "react";
export default function InsightsPage({ T = x => x, checkins = [], completed = 0, total = 0, readiness = 0 }) {
 const [period, setPeriod] = useState("Day");
 const [activeBar, setActiveBar] = useState(null);
 const data = useMemo(() => {
  const groups = new Map();
  for (const item of checkins) {
   const date = new Date(item.date);
   if (Number.isNaN(date.getTime())) continue;
   const key = period === "Year" ? String(date.getFullYear()) : period === "Month" ? `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}` : `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
   const g = groups.get(key) || { key, energy:0, attention:0, count:0 };
   g.energy += Math.max(0, Math.min(100, Number(item.energy)||0));
   g.attention += Math.max(0, Math.min(100, Number(item.attention)||0));
   g.count++;
   groups.set(key,g);
  }
  return [...groups.values()].sort((a,b)=>a.key.localeCompare(b.key)).slice(-12).map(g=>({...g, energy:Math.round(g.energy/g.count), attention:Math.round(g.attention/g.count)}));
 }, [checkins,period]);
 const label = key => period === "Year" ? key : period === "Month" ? new Date(`${key}-01T12:00:00`).toLocaleDateString(undefined,{month:"short",year:"2-digit"}) : new Date(`${key}T12:00:00`).toLocaleDateString(undefined,{month:"short",day:"numeric"});
 return <div className="space-y-5">
  <div className="grid md:grid-cols-3 gap-5">
   <div className="panel p-7"><p className="muted">{T("completed")}</p><p className="text-5xl font-bold accent mt-4">{completed}</p></div>
   <div className="panel p-7"><p className="muted">{T("pending")}</p><p className="text-5xl font-bold mt-4">{Math.max(0,total-completed)}</p></div>
   <div className="panel p-7"><p className="muted">{T("readiness")}</p><p className="text-5xl font-bold mt-4">{readiness}%</p></div>
  </div>
  <section className="panel p-6">
   <div className="flex flex-wrap justify-between items-center gap-4 mb-5"><div><h2 className="text-xl font-bold">Recent check-ins</h2><p className="muted text-sm">Average energy and attention by {period.toLowerCase()}</p></div><div className="flex gap-2" role="group" aria-label="Chart period">{["Day","Month","Year"].map(v=><button key={v} type="button" aria-pressed={period===v} className={period===v?"btn":"ghost"} onClick={()=>{setPeriod(v);setActiveBar(null);}}>{v}</button>)}</div></div>
   {data.length===0 ? <p className="muted py-10 text-center">Save a check-in on the Dashboard to see your chart.</p> : <>
    <div className="flex gap-5 text-sm mb-3"><span><span className="inline-block w-3 h-3 bg-emerald-400 mr-2"/>Energy</span><span><span className="inline-block w-3 h-3 bg-sky-400 mr-2"/>Attention</span></div>
    <div className="min-h-20 mb-3" aria-live="polite">
      {activeBar ? <div className="inline-block rounded-lg bg-slate-950 border border-slate-600 shadow-xl px-4 py-3 text-sm text-white" role="status">
        <p className="font-semibold mb-1">{label(activeBar.key)}</p>
        <p><span className="text-emerald-300">●</span> Energy: <strong>{activeBar.energy}%</strong></p>
        <p><span className="text-sky-300">●</span> Attention: <strong>{activeBar.attention}%</strong></p>
        <p className="text-slate-400 text-xs mt-1">{activeBar.count} check-in{activeBar.count === 1 ? "" : "s"}</p>
      </div> : <p className="muted text-sm py-4"></p>}
    </div>
    <div className="flex gap-2" role="group" aria-label="Check-in bar chart">
     <div className="h-60 pb-8 flex flex-col justify-between muted text-xs"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div>
     <div className="flex-1 min-w-0 overflow-x-auto"><div className="flex gap-2 min-w-max h-60 border-b border-slate-600">{data.map(d=><div key={d.key} className="w-16 shrink-0 flex flex-col items-center">
       <button type="button" onMouseEnter={()=>setActiveBar(d)} onMouseLeave={()=>setActiveBar(null)} onFocus={()=>setActiveBar(d)} onBlur={()=>setActiveBar(null)} onClick={()=>setActiveBar(d)} className="h-52 flex items-end justify-center gap-1 w-full cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-sky-300 rounded hover:bg-white/10 transition-colors" aria-label={`${label(d.key)}: Energy ${d.energy}%, Attention ${d.attention}%, ${d.count} check-ins`}>
        <span className="bg-emerald-400 w-5 rounded-t transition-opacity hover:opacity-80" style={{height:`${d.energy}%`}}/>
        <span className="bg-sky-400 w-5 rounded-t transition-opacity hover:opacity-80" style={{height:`${d.attention}%`}}/>
       </button><span className="muted text-xs mt-2 whitespace-nowrap">{label(d.key)}</span>
     </div>)}</div></div>
    </div><p className="muted text-xs mt-4">Last 12 periods with saved check-ins. Periods without data are omitted.</p>
   </>}
  </section>
 </div>;
}
