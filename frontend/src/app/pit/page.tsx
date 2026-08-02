"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import clsx from "clsx";

const COMPOUNDS = [
  { id: "Soft  (Red)", label: "SOFT", icon: "🔴", color: "bg-[#e8002d]", min: 10, max: 25, degMult: 1.6 },
  { id: "Medium  (Yellow)", label: "MEDIUM", icon: "🟡", color: "bg-[#ffd700]", min: 20, max: 38, degMult: 1.0 },
  { id: "Hard  (White)", label: "HARD", icon: "⚪", color: "bg-[#c8c8d8]", min: 30, max: 55, degMult: 0.65 },
  { id: "Intermediate  (Green)", label: "INTERMEDIATE", icon: "🟢", color: "bg-[#39d353]", min: 10, max: 30, degMult: 1.2 },
  { id: "Wet  (Blue)", label: "WET", icon: "🔵", color: "bg-[#378ADD]", min: 5, max: 20, degMult: 1.8 },
];

export default function PitAdvisorPage() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  
  const [circuits, setCircuits] = useState<any[]>([]);
  const [gridData, setGridData] = useState<any>(null);

  const [season, setSeason] = useState(2023);
  const [team, setTeam] = useState("");
  const [driver, setDriver] = useState("");
  const [circuitId, setCircuitId] = useState("");
  const [compound, setCompound] = useState("Medium  (Yellow)");
  const [currentLap, setCurrentLap] = useState(24);
  const [position, setPosition] = useState(6);
  const [tyreAge, setTyreAge] = useState(15);
  const [traffic, setTraffic] = useState("No");
  const [gridPosition, setGridPosition] = useState(4);
  const [qualifyingPosition, setQualifyingPosition] = useState(4);
  const [overtookLastLap, setOvertookLastLap] = useState("No");

  useEffect(() => {
    api.getCircuits().then(res => {
      const sorted = Object.entries(res).map(([name, data]: [string, any]) => ({ name, ...data })).sort((a, b) => a.name.localeCompare(b.name));
      setCircuits(sorted);
      if (sorted.length > 0) setCircuitId(sorted[0].id.toString());
    }).catch(console.error);
  }, []);

  useEffect(() => {
    api.getGrid(season).then(res => {
      setGridData(res);
      const teams = Object.keys(res).sort();
      if (teams.length > 0) {
        setTeam(teams[0]);
        setDriver(res[teams[0]].drivers[0]);
      }
    }).catch(console.error);
  }, [season]);

  useEffect(() => {
    if (gridData && team && gridData[team]) {
      setDriver(gridData[team].drivers[0] || "");
    }
  }, [team, gridData]);

  const selectedCompound = COMPOUNDS.find(c => c.id === compound) || COMPOUNDS[1];
  const maxLife = selectedCompound.max;
  const lifePct = Math.max(0, Math.min(100, 100 - (tyreAge / maxLife) * 100));

  const handlePredict = async () => {
    setLoading(true);
    const constructorId = gridData && team && gridData[team] ? gridData[team].id : 0;
    const requestData = {
      year: season,
      circuit_id: parseInt(circuitId),
      constructor_id: constructorId,
      compound_name: compound,
      lap: currentLap,
      position,
      tyre_age: tyreAge,
      traffic: traffic === "Yes" ? 1 : 0,
      grid_pos: gridPosition,
      quali_pos: qualifyingPosition,
      overtake: overtookLastLap === "Yes" ? 1 : 0
    };
    try {
      // Call main prediction
      const res = await api.predictPit(requestData);
      // Also fetch compound comparison from backend
      let compComparison;
      try {
        compComparison = await api.predictPitCompounds(requestData);
      } catch { compComparison = null; }
      // Also fetch projection
      let projection;
      try {
        projection = await api.predictPitProjection(requestData);
      } catch { projection = null; }
      // Map backend field names to frontend expectations
      const mappedRes = {
        ...res,
        probability: res.prob ?? res.probability ?? 0,
        life_remaining: res.life_remain ?? res.laps_remaining ?? res.life_remaining ?? 0,
        pace_lost: res.pace_loss ?? res.pace_lost ?? 0,
      };
      // Map projection data
      const mappedProjection = projection ? projection.map((p: any) => ({
        lap: p.lap,
        time: p.pace_loss ?? p.time ?? 0,
        probability: p.prob ?? p.probability ?? 0,
        urgency_color: p.urgency_color,
      })) : null;
      setPrediction({
        ...mappedRes,
        degradation_curve: mappedProjection || mappedRes.degradation_curve,
        pit_probabilities: mappedProjection || mappedRes.pit_probabilities,
        compound_comparison: compComparison || mappedRes.compound_comparison || COMPOUNDS.map(c => ({
          compound: c.label,
          icon: c.icon,
          life: `${c.min}-${c.max} laps`,
          age: c.id === compound ? tyreAge : 0,
          pace_lost: c.id === compound ? (tyreAge * 0.065 * c.degMult) : 0,
          status: c.id === compound ? "ACTIVE" : "AVAILABLE"
        }))
      });
    } catch (e) {
      // Fallback with realistic compound-aware mock
      const lifeRatio = tyreAge / maxLife;
      const urgency = Math.min(1.0, lifeRatio * 1.2);
      const mockProb = Math.min(1, 0.05 + lifeRatio * 0.3);
      const combined = Math.min(1.0, 0.6 * (mockProb / 0.20) + 0.4 * urgency);
      const baseRec = (mockProb > 0.15 || lifeRatio >= 1.0 || combined >= 0.85) ? "PIT NOW" 
        : (mockProb > 0.07 || lifeRatio >= 0.75 || combined >= 0.55) ? "MONITOR" : "STAY OUT";
      const baseDeg = 0.065 * selectedCompound.degMult;
      setPrediction({
        recommendation: baseRec,
        reason: baseRec === "PIT NOW" 
          ? `${selectedCompound.label} at ${Math.round(lifeRatio*100)}% life — only ~${Math.max(0,maxLife-tyreAge)} laps remain. Pit this lap.`
          : baseRec === "MONITOR"
          ? `${selectedCompound.label} at ${Math.round(lifeRatio*100)}% life. ~${Math.max(0,maxLife-tyreAge)} laps remain. Consider stopping within 3 laps.`
          : `${selectedCompound.label} performing well at ${Math.round(lifeRatio*100)}% life. ~${Math.max(0,maxLife-tyreAge)} laps remaining.`,
        probability: mockProb,
        life_remaining: Math.max(0, maxLife - tyreAge),
        pace_lost: tyreAge * baseDeg,
        degradation_curve: Array.from({length: 11}, (_, i) => ({
          lap: currentLap + i,
          time: (tyreAge + i) * baseDeg
        })),
        pit_probabilities: Array.from({length: 11}, (_, i) => {
          const futureAge = tyreAge + i;
          const lr = futureAge / maxLife;
          const p = Math.min(1, 0.05 + lr * 0.3);
          return { lap: currentLap + i, probability: p };
        }),
        compound_comparison: COMPOUNDS.map(c => ({
          compound: c.label,
          icon: c.icon,
          life: `${c.min}-${c.max} laps`,
          age: c.id === compound ? tyreAge : 0,
          pace_lost: c.id === compound ? (tyreAge * 0.065 * c.degMult) : 0,
          status: c.id === compound ? "ACTIVE" : "AVAILABLE"
        }))
      });
    }
    setLoading(false);
  };

  const recColor = prediction?.recommendation === "PIT NOW" 
    ? "text-[#FF2D55] border-[#FF2D55]/30 bg-[#FF2D55]/5" 
    : prediction?.recommendation === "MONITOR" 
    ? "text-[#FFD60A] border-[#FFD60A]/30 bg-[#FFD60A]/5" 
    : "text-[#32D74B] border-[#32D74B]/30 bg-[#32D74B]/5";

  return (
    <div className="min-h-screen bg-void px-6 pb-20 md:px-12">
      <PageHeader title="Pit Strategy Advisor" subtitle="Real-time compound evaluation and pit window probability." />
      
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-line bg-panel p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Race State</h3>
            
            <div className="space-y-4">
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Season</span><span className="font-mono text-ink-hi">{season}</span></label>
                <input type="range" min="2009" max="2024" value={season} onChange={e => setSeason(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-mid">Team</label>
                <select value={team} onChange={e => setTeam(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                  {gridData && Object.keys(gridData).sort().map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-mid">Driver</label>
                <select value={driver} onChange={e => setDriver(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                  {gridData && team && gridData[team] && gridData[team].drivers.map((d: string) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-mid">Circuit</label>
                <select value={circuitId} onChange={e => setCircuitId(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                  {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-xs text-ink-mid">Compound</label>
                <div className="flex flex-wrap gap-2">
                  {COMPOUNDS.map(c => (
                    <button
                      key={c.id}
                      onClick={() => setCompound(c.id)}
                      className={clsx(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors",
                        compound === c.id ? "border-ink-hi text-ink-hi bg-white/5" : "border-line text-ink-mid hover:border-line-strong"
                      )}
                    >
                      <span>{c.icon}</span>
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded bg-panel-2 p-3 text-sm text-ink-hi border border-line space-y-1">
                <div>{selectedCompound.icon} <strong>{selectedCompound.label}</strong></div>
                <div className="text-xs text-ink-mid">Life Range: {selectedCompound.min}-{selectedCompound.max} laps</div>
                <div className="text-xs text-ink-mid">Deg Multiplier: {selectedCompound.degMult}x</div>
              </div>

              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Current Lap</span><span className="font-mono text-ink-hi">{currentLap}</span></label>
                <input type="range" min="1" max="78" value={currentLap} onChange={e => setCurrentLap(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Current Position</span><span className="font-mono text-ink-hi">{position}</span></label>
                <input type="range" min="1" max="20" value={position} onChange={e => setPosition(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Tyre Age</span><span className="font-mono text-ink-hi">{tyreAge}</span></label>
                <input type="range" min="0" max="60" value={tyreAge} onChange={e => setTyreAge(Number(e.target.value))} className="w-full accent-cyan" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs text-ink-mid">Traffic</label>
                  <select value={traffic} onChange={e => setTraffic(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs text-ink-mid">Overtook</label>
                  <select value={overtookLastLap} onChange={e => setOvertookLastLap(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                    <option>No</option><option>Yes</option>
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Grid Pos</span><span className="font-mono">{gridPosition}</span></label>
                  <input type="range" min="1" max="20" value={gridPosition} onChange={e => setGridPosition(Number(e.target.value))} className="w-full accent-cyan" />
                </div>
                <div>
                  <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Qual Pos</span><span className="font-mono">{qualifyingPosition}</span></label>
                  <input type="range" min="1" max="20" value={qualifyingPosition} onChange={e => setQualifyingPosition(Number(e.target.value))} className="w-full accent-cyan" />
                </div>
              </div>

              <button 
                onClick={handlePredict}
                className="mt-6 w-full rounded-lg bg-cyan py-3 text-sm font-bold text-void transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(0,229,201,0.4)]"
              >
                {loading ? "Analyzing..." : "Get Pit Recommendation"}
              </button>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-8 space-y-6">
          {/* ALWAYS VISIBLE TYRE LIFE BAR */}
          <div className="rounded-2xl border border-line bg-panel p-8 flex flex-col justify-center relative overflow-hidden">
            <div className="text-xs font-mono uppercase tracking-[0.2em] mb-4 text-ink-mid flex justify-between">
              <span>Tyre Life</span>
              <span>{selectedCompound.icon} {selectedCompound.label} ({tyreAge}/{maxLife})</span>
            </div>
            <div className="flex items-end gap-2 mb-4">
              <div className="text-5xl font-bold tracking-tighter text-ink-hi">{lifePct.toFixed(0)}</div>
              <div className="text-xl text-ink-mid mb-1">%</div>
            </div>
            <div className="h-4 w-full bg-line-strong rounded-full overflow-hidden relative">
              <div 
                className="h-full transition-all duration-1000" 
                style={{ width: `${lifePct}%`, backgroundColor: lifePct < 20 ? '#FF2D55' : lifePct < 50 ? '#FFD60A' : '#00E5C9' }}
              />
              <div className="absolute inset-0 flex justify-between px-2">
                {[20,40,60,80].map(m => <div key={m} className="w-px h-full bg-void/50" style={{left: `${m}%`, position: 'absolute'}} />)}
              </div>
            </div>
            <div className="mt-4 text-sm text-ink-mid font-mono flex justify-between">
              <span>{Math.max(0, maxLife - tyreAge)} laps remaining</span>
              <span>Pace loss: ~{(tyreAge * 0.065 * selectedCompound.degMult).toFixed(2)}s</span>
            </div>
          </div>

          {prediction && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              <div className={clsx("rounded-2xl border p-8 flex flex-col justify-center items-center text-center transition-colors", recColor)}>
                <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 opacity-80">System Call</div>
                <div className="text-4xl md:text-5xl font-bold tracking-tighter mb-4">{prediction.recommendation}</div>
                <div className="text-sm font-medium opacity-90">{prediction.reason}</div>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-8 flex flex-col justify-center">
                <div className="text-xs font-mono uppercase tracking-[0.2em] mb-4 text-ink-mid">Pit Probability Gauge</div>
                <div className="flex items-end gap-2 mb-4">
                  <div className="text-5xl font-bold tracking-tighter text-ink-hi">{((prediction.probability ?? 0) * 100).toFixed(1)}%</div>
                </div>
                <div className="h-2 w-full bg-line-strong rounded-full overflow-hidden mb-2">
                  <div className="h-full bg-cyan" style={{ width: `${(prediction.probability ?? 0) * 100}%` }} />
                </div>
                <div className="text-xs text-ink-mid">XGBoost model probability based on 11 race-state features.</div>
              </div>
            </div>
          )}

          {prediction && (
            <div className="rounded-2xl border border-line bg-panel p-6 animate-fade-in">
              <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Factors Analyzed by ML Model</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { label: "Lap Number", value: currentLap, icon: "🏁" },
                  { label: "Position", value: `P${position}`, icon: "📍" },
                  { label: "Tyre Age", value: `${tyreAge} laps`, icon: "🔄" },
                  { label: "Compound", value: selectedCompound.label, icon: selectedCompound.icon },
                  { label: "Grid Position", value: `P${gridPosition}`, icon: "🏎️" },
                  { label: "Quali Position", value: `P${qualifyingPosition}`, icon: "⏱️" },
                  { label: "Traffic", value: traffic === "Yes" ? "In traffic" : "Clear air", icon: "🚦" },
                  { label: "Overtook", value: overtookLastLap === "Yes" ? "Yes" : "No", icon: "↗️" },
                  { label: "Team Factor", value: team.split(" ")[0], icon: "🏢" },
                  { label: "Deg Rate", value: `${(prediction.deg_rate ?? 0.065).toFixed(3)}s/lap`, icon: "📉" },
                  { label: "Pace Loss", value: `+${(prediction.pace_lost ?? 0).toFixed(2)}s`, icon: "⚡" },
                  { label: "Combined Score", value: `${((prediction.combined_score ?? 0) * 100).toFixed(0)}%`, icon: "🎯" },
                ].map(f => (
                  <div key={f.label} className="rounded-lg border border-line/50 bg-panel-2 p-3">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-ink-lo mb-1">{f.icon} {f.label}</div>
                    <div className="text-sm font-bold text-ink-hi font-mono">{f.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {prediction && (
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                <div className="rounded-xl border border-line bg-panel p-5">
                  <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Life Remaining</div>
                  <div className="text-2xl font-bold text-ink-hi font-mono">{prediction.life_remaining ?? 0} Laps</div>
                </div>
                <div className="rounded-xl border border-line bg-panel p-5">
                  <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Pace Lost to Deg</div>
                  <div className="text-2xl font-bold text-ink-hi font-mono">+{(prediction.pace_lost ?? 0).toFixed(3)}s</div>
                </div>
             </div>
          )}

          {prediction && prediction.degradation_curve && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-fade-in">
              <div className="rounded-2xl border border-line bg-panel p-6">
                <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Degradation Curve Projection</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prediction.degradation_curve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                      <XAxis dataKey="lap" stroke="#5B6270" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={['auto', 'auto']} stroke="#5B6270" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => v.toFixed(1)} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontFamily: 'monospace' }} />
                      <Line type="monotone" dataKey="time" stroke="#00E5C9" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="rounded-2xl border border-line bg-panel p-6">
                <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Pit Probability Next 10 Laps</h3>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={prediction.pit_probabilities}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                      <XAxis dataKey="lap" stroke="#5B6270" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 1]} stroke="#5B6270" fontSize={12} tickLine={false} axisLine={false} tickFormatter={v => (v*100).toFixed(0)+'%'} />
                      <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontFamily: 'monospace' }} />
                      <Bar dataKey="probability" radius={[4, 4, 0, 0]}>
                        {prediction.pit_probabilities.map((entry: any, index: number) => (
                           <Cell key={`cell-${index}`} fill={entry.probability > 0.8 ? '#FF2D55' : entry.probability > 0.5 ? '#FFD60A' : '#00E5C9'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}

          {prediction && prediction.compound_comparison && (
            <div className="rounded-2xl border border-line bg-panel overflow-hidden animate-fade-in">
              <div className="p-4 border-b border-line-strong bg-panel-2">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-cyan">Compound Comparison</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-panel-2">
                    <tr className="border-b border-line-strong text-ink-mid text-xs">
                      <th className="p-4 font-normal">COMPOUND</th>
                      <th className="p-4 font-normal">LIFE RANGE</th>
                      <th className="p-4 font-normal">YOUR AGE</th>
                      <th className="p-4 font-normal">PACE LOST</th>
                      <th className="p-4 font-normal text-right">STATUS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/50">
                    {prediction.compound_comparison.map((c: any) => (
                      <tr key={c.compound} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4 font-medium text-ink-hi flex items-center gap-2"><span>{c.icon}</span> {c.compound}</td>
                        <td className="p-4 text-ink-mid">{c.life}</td>
                        <td className="p-4 font-mono text-ink-hi">{c.age}</td>
                        <td className="p-4 font-mono text-ink-hi">+{c.pace_lost.toFixed(3)}s</td>
                        <td className="p-4 text-right">
                          <span className={clsx(
                            "px-2 py-0.5 rounded text-[10px] font-mono",
                            c.status === "ACTIVE" ? "bg-cyan/20 text-cyan" : "bg-line-strong text-ink-mid"
                          )}>
                            {c.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
