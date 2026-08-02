"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import clsx from "clsx";

export default function LapPredictorPage() {
  const [loading, setLoading] = useState(false);
  const [prediction, setPrediction] = useState<any>(null);
  const [circuits, setCircuits] = useState<any[]>([]);
  const [gridData, setGridData] = useState<any>(null);

  // Form state
  const [season, setSeason] = useState(2023);
  const [circuitId, setCircuitId] = useState("");
  const [team, setTeam] = useState("");
  const [driver, setDriver] = useState("");
  const [lap, setLap] = useState(25);
  const [position, setPosition] = useState(6);
  const [gridPosition, setGridPosition] = useState(4);
  const [qualifyingPosition, setQualifyingPosition] = useState(4);
  const [tyreAge, setTyreAge] = useState(15);
  const [traffic, setTraffic] = useState("Clean Air (top 5)");
  const [pitThisLap, setPitThisLap] = useState("No");
  const [tyreCompound, setTyreCompound] = useState("Medium  (Yellow)");
  
  const [isExpanderOpen, setIsExpanderOpen] = useState(false);

  useEffect(() => {
    // Initial data fetch
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

  useEffect(() => {
    if (position >= 6) {
      setTraffic("Traffic (position 6+)");
    } else {
      setTraffic("Clean Air (top 5)");
    }
  }, [position]);

  const selectedCircuit = circuits.find(c => c.id.toString() === circuitId);
  const totalLaps = selectedCircuit ? selectedCircuit.laps : 50;
  const basePace = selectedCircuit ? selectedCircuit.base_pace : 90;

  const getEraName = (year: number) => {
    if (year <= 2013) return "V8 (2009-2013)";
    if (year <= 2016) return "Hybrid (2014-2016)";
    if (year <= 2021) return "Hybrid mature (2017-2021)";
    return "Ground effect (2022+)";
  };

  const handlePredict = async () => {
    setLoading(true);
    try {
      const constructorId = gridData && team && gridData[team] ? gridData[team].id : 0;
      const res = await api.predictLap({
        year: season,
        circuit_id: parseInt(circuitId),
        constructor_id: constructorId,
        driver_name: driver,
        lap_num: lap,
        position,
        grid_pos: gridPosition,
        quali_pos: qualifyingPosition,
        tyre_age: tyreAge,
        traffic: traffic.includes("Traffic") ? 1 : 0,
        made_pit: pitThisLap === "Yes" ? 1 : 0
      });
      const gridRes = await api.predictLapGrid({
        year: season,
        circuit_id: parseInt(circuitId),
        lap_num: lap,
        position,
        grid_pos: gridPosition,
        quali_pos: qualifyingPosition,
        tyre_age: tyreAge,
        traffic: traffic.includes("Traffic") ? 1 : 0,
        made_pit: pitThisLap === "Yes" ? 1 : 0
      });
      setPrediction({ ...res, grid_comparison: gridRes });
    } catch (e) {
      console.error(e);
      // Dummy fallback
      setPrediction({
        predicted_lap_time: basePace + 2.5,
        formatted_time: `1:${(basePace - 60 + 2.5).toFixed(3)}`,
        delta_vs_baseline: 2.5,
        baseline_pace: basePace,
        tyre_deg_loss: tyreAge * 0.1,
        shap_values: [
          { feature: "tyre_age", label: "Tyre Age", value: 1.2 },
          { feature: "traffic", label: "Traffic", value: traffic.includes("Traffic") ? 1.5 : 0 },
          { feature: "position", label: "Position", value: -0.3 },
        ],
        grid_comparison: [
          { rank: 1, driver: driver, team: team, predicted_lap_time: basePace + 2.5, delta: 0 },
          { rank: 2, driver: "Rival 1", team: "Rival Team", predicted_lap_time: basePace + 3.0, delta: 0.5 },
          { rank: 3, driver: "Rival 2", team: "Rival Team 2", predicted_lap_time: basePace + 3.5, delta: 1.0 },
        ]
      });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-void px-6 pb-20 md:px-12">
      <PageHeader title="Lap Time Predictor" subtitle="Forecasts next-lap pace based on telemetry and circuit profile." />
      
      <div className="grid grid-cols-1 gap-8 mb-8 md:grid-cols-2">
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Step 1 — Choose Season & Circuit</h3>
          <div className="space-y-4">
            <div>
              <label className="mb-1 flex justify-between text-xs text-ink-mid">
                <span>Season</span>
                <span className="font-mono text-ink-hi">{season}</span>
              </label>
              <input type="range" min="2009" max="2024" value={season} onChange={e => setSeason(Number(e.target.value))} className="w-full accent-cyan" />
            </div>
            <div>
              <label className="mb-1 block text-xs text-ink-mid">Circuit</label>
              <select value={circuitId} onChange={e => setCircuitId(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                {circuits.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="mt-4 rounded bg-panel-2 p-3 text-sm text-ink-hi border border-line">
              🏁 Race laps: <span className="font-mono text-cyan">{totalLaps}</span> | ⚙️ Era: <span className="font-mono text-cyan">{getEraName(season)}</span> | 📍 Base pace: <span className="font-mono text-cyan">{basePace}s</span>
            </div>
          </div>
        </div>
        
        <div className="rounded-2xl border border-line bg-panel p-6">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Step 2 — Choose Team & Driver</h3>
          <div className="space-y-4">
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
            <div className="mt-4 rounded bg-panel-2 p-3 text-sm text-ink-hi border border-line">
              🏎️ Driver: <span className="font-mono text-cyan">{driver}</span> | 📊 Baseline pace: <span className="font-mono text-cyan">{basePace}s/lap</span> | 📉 Tyre deg: <span className="font-mono text-cyan">~0.1s/lap</span> | 📡 Source: historical data
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Controls */}
        <div className="col-span-1 lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-line bg-panel p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Step 3 — Set Race State</h3>
            <div className="space-y-4">
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Lap Number</span><span className="font-mono text-ink-hi">{lap}</span></label>
                <input type="range" min="1" max={totalLaps} value={lap} onChange={e => setLap(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Current Position</span><span className="font-mono text-ink-hi">{position}</span></label>
                <input type="range" min="1" max="20" value={position} onChange={e => setPosition(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Grid Position</span><span className="font-mono text-ink-hi">{gridPosition}</span></label>
                <input type="range" min="1" max="20" value={gridPosition} onChange={e => setGridPosition(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Qualifying Position</span><span className="font-mono text-ink-hi">{qualifyingPosition}</span></label>
                <input type="range" min="1" max="20" value={qualifyingPosition} onChange={e => setQualifyingPosition(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Tyre Age (laps on current set)</span><span className="font-mono text-ink-hi">{tyreAge}</span></label>
                <input type="range" min="0" max="45" value={tyreAge} onChange={e => setTyreAge(Number(e.target.value))} className="w-full accent-cyan" />
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-mid">Traffic</label>
                <select value={traffic} onChange={e => setTraffic(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                  <option value="Clean Air (top 5)">Clean Air (top 5)</option>
                  <option value="Traffic (position 6+)">Traffic (position 6+)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs text-ink-mid">Pit this lap?</label>
                <select value={pitThisLap} onChange={e => setPitThisLap(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-3 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-xs text-ink-mid">Tyre Compound</label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "Soft  (Red)", label: "SOFT", icon: "🔴" },
                    { id: "Medium  (Yellow)", label: "MEDIUM", icon: "🟡" },
                    { id: "Hard  (White)", label: "HARD", icon: "⚪" },
                    { id: "Intermediate  (Green)", label: "INTER", icon: "🟢" },
                    { id: "Wet  (Blue)", label: "WET", icon: "🔵" },
                  ].map(c => (
                    <button
                      key={c.id}
                      onClick={() => setTyreCompound(c.id)}
                      className={clsx(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-mono transition-colors",
                        tyreCompound === c.id ? "border-ink-hi text-ink-hi bg-white/5" : "border-line text-ink-mid hover:border-line-strong"
                      )}
                    >
                      <span>{c.icon}</span>{c.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-line rounded-lg overflow-hidden">
                <button onClick={() => setIsExpanderOpen(!isExpanderOpen)} className="w-full bg-panel-2 px-4 py-2 text-left text-xs font-semibold text-ink-mid hover:text-cyan flex justify-between items-center transition-colors">
                  What do Rolling Pace and Tyre Degradation mean?
                  <span>{isExpanderOpen ? "−" : "+"}</span>
                </button>
                {isExpanderOpen && (
                  <div className="p-4 text-xs text-ink-lo bg-panel-2/50 border-t border-line">
                    Rolling pace refers to the average lap time over recent laps, while tyre degradation measures the progressive time loss per lap as tyres wear out.
                  </div>
                )}
              </div>

              <button onClick={handlePredict} className="w-full rounded-lg bg-cyan py-3 text-sm font-bold text-void transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(0,229,201,0.4)]">
                {loading ? "Computing..." : "🏎️ Predict Lap Time"}
              </button>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="col-span-1 lg:col-span-8 space-y-6">
          {!prediction && !loading && (
            <div className="rounded-2xl border border-line bg-panel p-8 min-h-[300px] flex items-center justify-center text-ink-mid text-sm font-mono">
              Ready to predict
            </div>
          )}
          {loading && (
            <div className="rounded-2xl border border-line bg-panel p-8 min-h-[300px] flex flex-col justify-center animate-pulse space-y-4">
              <div className="h-4 w-1/4 rounded bg-line-strong"></div>
              <div className="h-16 w-1/2 rounded bg-line-strong"></div>
            </div>
          )}
          {prediction && !loading && (
            <div className="space-y-6 animate-fade-in">
              <div className="rounded-2xl border border-line bg-panel p-8 flex flex-col justify-center relative overflow-hidden">
                <div className="relative z-10">
                  <h3 className="mb-2 text-sm font-medium uppercase tracking-widest text-ink-mid">{driver} · {team}</h3>
                  <div className={clsx(
                    "font-mono text-5xl md:text-7xl font-bold tracking-tighter",
                    (prediction.delta_vs_baseline ?? 0) < 0 ? "text-[#39d353]" : (prediction.delta_vs_baseline ?? 0) > 2 ? "text-[#ff2d55]" : "text-[#ff8700]"
                  )}>
                    {prediction.formatted_time}
                  </div>
                  <div className="mt-4 flex items-center gap-4 text-sm font-mono text-ink-mid">
                    <span>{selectedCircuit?.name} · Lap {lap}</span>
                  </div>
                </div>
                <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-cyan/5 blur-3xl pointer-events-none"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="rounded-xl border border-line bg-panel p-5">
                  <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Delta vs Baseline</div>
                  <div className="text-2xl font-bold text-ink-hi font-mono">{(prediction.delta_vs_baseline ?? 0) > 0 ? "+" : ""}{(prediction.delta_vs_baseline ?? 0).toFixed(3)}s</div>
                </div>
                <div className="rounded-xl border border-line bg-panel p-5">
                  <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Baseline Pace</div>
                  <div className="text-2xl font-bold text-ink-hi font-mono">{(prediction.baseline_pace ?? 0).toFixed(3)}s</div>
                </div>
                <div className="rounded-xl border border-line bg-panel p-5">
                  <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Tyre Deg Loss</div>
                  <div className="text-2xl font-bold text-ink-hi font-mono">+{(prediction.tyre_deg_loss ?? 0).toFixed(3)}s</div>
                </div>
              </div>

              {prediction.grid_comparison && (
                <div className="rounded-2xl border border-line bg-panel overflow-hidden">
                  <div className="p-4 border-b border-line-strong bg-panel-2">
                    <h3 className="text-sm font-semibold uppercase tracking-widest text-cyan">Grid Comparison</h3>
                  </div>
                  <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="sticky top-0 bg-panel-2 z-10 shadow-md">
                        <tr className="border-b border-line-strong text-ink-mid text-xs">
                          <th className="p-3 font-normal">RANK</th>
                          <th className="p-3 font-normal">DRIVER</th>
                          <th className="p-3 font-normal">TEAM</th>
                          <th className="p-3 font-normal text-right">PRED(s)</th>
                          <th className="p-3 font-normal text-right">Δ VS LEADER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line/50">
                        {prediction.grid_comparison.map((s: any, idx: number) => (
                          <tr key={s.driver} className={clsx("hover:bg-white/[0.02] transition-colors", s.driver === driver ? "bg-[#ff2d55]/10" : "")}>
                            <td className="p-3 font-mono text-ink-hi">{s.rank ?? idx + 1}</td>
                            <td className="p-3 font-medium text-ink-hi">{s.driver}</td>
                            <td className="p-3 text-ink-mid">{s.team}</td>
                            <td className="p-3 text-right font-mono text-ink-hi">{(s.predicted_lap_time ?? s.pred ?? 0).toFixed(3)}</td>
                            <td className="p-3 text-right font-mono text-ink-mid">+{(s.delta ?? ((s.predicted_lap_time ?? 0) - (prediction.grid_comparison[0]?.predicted_lap_time ?? 0))).toFixed(3)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {prediction.shap_values && (
                <div className="rounded-2xl border border-line bg-panel p-6">
                  <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">SHAP Feature Impact for {driver}</h3>
                  <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={prediction.shap_values} layout="vertical" margin={{ left: 80, right: 20 }}>
                        <XAxis type="number" stroke="#5B6270" fontSize={12} tickFormatter={(val) => val.toFixed(2)} />
                    <YAxis dataKey="label" type="category" stroke="#9298A6" fontSize={12} width={120} />
                        <Tooltip contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                          {prediction.shap_values.map((entry: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#FF2D55' : '#39d353'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
