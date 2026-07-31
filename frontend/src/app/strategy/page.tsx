"use client";

import { useState, useEffect } from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import clsx from "clsx";

export default function StrategyOptimizerPage() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const [selectedDriver, setSelectedDriver] = useState<string | null>(null);
  
  const seasons = Array.from({length: 16}, (_, i) => 2024 - i);
  const [season, setSeason] = useState(2023);
  const [races, setRaces] = useState<any[]>([]);
  const [raceId, setRaceId] = useState("");
  const [snapshotLap, setSnapshotLap] = useState(15);
  const [isExpanderOpen, setIsExpanderOpen] = useState(false);

  const totalLaps = 57; // Mock
  
  useEffect(() => {
    api.getRaces(season).then(res => {
      setRaces(res);
      if (res.length > 0) setRaceId(res[0].id.toString());
    }).catch(e => {
      const mockRaces = [
        { id: 1, name: "Bahrain Grand Prix", laps: 57 },
        { id: 2, name: "Saudi Arabian Grand Prix", laps: 50 },
      ];
      setRaces(mockRaces);
      setRaceId(mockRaces[0].id.toString());
    });
  }, [season]);

  const handleOptimize = async () => {
    setLoading(true);
    try {
      const res = await api.strategyOptimize({ season, raceId, snapshotLap });
      setData(res);
    } catch (e) {
      // Mock data
      const strategies = ["Pit Now", "Pit in 3", "Pit in 6", "Pit in 10", "Stay Out"];
      
      const grid = Array.from({length: 20}, (_, i) => {
        const r = Math.random();
        const bestIndex = r < 0.2 ? 0 : r < 0.4 ? 1 : r < 0.6 ? 2 : r < 0.8 ? 3 : 4;
        const timeSaved = bestIndex === 4 ? -2.5 : (Math.random() * 8) - 1;
        const posGain = Math.round(timeSaved / 2);
        
        return {
          position: i + 1,
          driver: `DRV${i+1}`,
          team: i % 2 === 0 ? "Red Bull" : "Mercedes",
          best_strategy: strategies[bestIndex],
          pit_lap: bestIndex === 0 ? snapshotLap : bestIndex === 4 ? -1 : snapshotLap + parseInt(strategies[bestIndex].split(" ")[2]),
          time_saved: timeSaved,
          position_gain: posGain,
          scenarios: strategies.map(s => ({
            name: s,
            time: s === strategies[bestIndex] ? timeSaved : timeSaved - (Math.random() * 3 + 1),
            is_best: s === strategies[bestIndex]
          }))
        };
      });
      
      const pitNowCount = grid.filter(d => d.best_strategy === "Pit Now").length;
      const stayOutCount = grid.filter(d => d.best_strategy === "Stay Out").length;
      const avgGain = grid.reduce((acc, curr) => acc + curr.time_saved, 0) / 20;
      const sortedByGain = [...grid].sort((a, b) => b.time_saved - a.time_saved);
      const biggestGainer = sortedByGain[0];
      
      setData({
        metrics: {
          avg_gain: avgGain,
          pit_now_count: pitNowCount,
          stay_out_count: stayOutCount,
          biggest_gainer: biggestGainer.driver,
          biggest_gain_sec: biggestGainer.time_saved
        },
        grid_strategy: grid
      });
    }
    setLoading(false);
  };

  const getStrategyPill = (strategy: string) => {
    if (strategy === "Pit Now") return <span className="bg-[#FF2D55]/20 text-[#FF2D55] border border-[#FF2D55]/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap">🔴 PIT NOW</span>;
    if (strategy.includes("in 3")) return <span className="bg-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap">🟡 {strategy.toUpperCase()}</span>;
    if (strategy.includes("in 6") || strategy.includes("in 10")) return <span className="bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap">🔵 {strategy.toUpperCase()}</span>;
    return <span className="bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold whitespace-nowrap">🟢 STAY OUT</span>;
  };

  return (
    <div className="min-h-screen bg-void px-6 pb-20 md:px-12">
      <PageHeader title="Strategy Optimizer" subtitle="Global grid evaluation to surface the single fastest path to the flag." />
      
      <div className="mb-8 p-6 bg-panel border border-line rounded-2xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="mb-1 block text-xs text-ink-mid">Season</label>
            <select value={season} onChange={e => setSeason(Number(e.target.value))} className="w-full rounded border border-line-strong bg-panel-2 px-4 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
              {seasons.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-ink-mid">Grand Prix</label>
            <select value={raceId} onChange={e => setRaceId(e.target.value)} className="w-full rounded border border-line-strong bg-panel-2 px-4 py-2 text-sm text-ink-hi outline-none focus:border-cyan appearance-none">
              {races.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 flex justify-between text-xs text-ink-mid"><span>Snapshot Lap</span><span className="font-mono">{snapshotLap}</span></label>
            <input type="range" min="5" max={totalLaps - 5} value={snapshotLap} onChange={e => setSnapshotLap(Number(e.target.value))} className="w-full accent-cyan mt-2" />
          </div>
        </div>

        <div className="border border-line rounded-lg overflow-hidden mb-6">
          <button onClick={() => setIsExpanderOpen(!isExpanderOpen)} className="w-full bg-panel-2 px-4 py-2 text-left text-xs font-semibold text-ink-mid hover:text-cyan flex justify-between items-center transition-colors">
            What does this page do?
            <span>{isExpanderOpen ? "−" : "+"}</span>
          </button>
          {isExpanderOpen && (
            <div className="p-4 text-xs text-ink-lo bg-panel-2/50 border-t border-line space-y-2">
              <p>The Optimizer runs 5 different pit scenarios for every driver on the grid simultaneously.</p>
              <p>It calculates the net time gained or lost by the end of the race for each option, highlighting the optimal move for each car right now.</p>
            </div>
          )}
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-panel-2 p-4 rounded-xl border border-line-strong">
          <div className="flex flex-wrap gap-4 text-sm font-mono text-ink-hi">
            <div>🏁 <span className="text-cyan">{season} {races.find(r=>r.id.toString()===raceId)?.name || 'GP'}</span></div>
            <div className="hidden sm:block text-ink-mid">|</div>
            <div>⏱️ Snapshot Lap: <span className="text-cyan">{snapshotLap}</span></div>
            <div className="hidden sm:block text-ink-mid">|</div>
            <div>🔄 Laps Rem: <span className="text-cyan">{totalLaps - snapshotLap}</span></div>
          </div>
          <button 
            onClick={handleOptimize}
            className="rounded-lg bg-cyan px-8 py-3 text-sm font-bold text-void transition-transform hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(0,229,201,0.4)] whitespace-nowrap"
          >
            {loading ? "Optimizing..." : "Run Optimizer for All Drivers"}
          </button>
        </div>
      </div>

      {!data && !loading && (
        <div className="rounded-2xl border border-line bg-panel p-8 text-center text-ink-mid">
          <div className="font-semibold text-ink-hi mb-4">Evaluates 5 Scenarios per Driver:</div>
          <div className="flex flex-wrap justify-center gap-3">
            <span className="bg-[#FF2D55]/20 text-[#FF2D55] border border-[#FF2D55]/30 px-3 py-1 rounded-full text-xs font-mono font-bold">🔴 PIT NOW</span>
            <span className="bg-[#FFD60A]/20 text-[#FFD60A] border border-[#FFD60A]/30 px-3 py-1 rounded-full text-xs font-mono font-bold">🟡 PIT +3</span>
            <span className="bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 px-3 py-1 rounded-full text-xs font-mono font-bold">🔵 PIT +6</span>
            <span className="bg-[#0A84FF]/20 text-[#0A84FF] border border-[#0A84FF]/30 px-3 py-1 rounded-full text-xs font-mono font-bold">🔵 PIT +10</span>
            <span className="bg-[#32D74B]/20 text-[#32D74B] border border-[#32D74B]/30 px-3 py-1 rounded-full text-xs font-mono font-bold">🟢 STAY OUT</span>
          </div>
        </div>
      )}

      {loading && (
        <div className="rounded-2xl border border-line bg-panel p-8 min-h-[300px] flex flex-col items-center justify-center space-y-4">
           <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent"></div>
           <div className="text-cyan font-mono text-sm animate-pulse">Running 100 scenario permutations...</div>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-6 animate-fade-in">
          {/* Top Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Avg Time Gain</div>
              <div className="text-3xl font-bold text-ink-hi font-mono">
                <span className={data.metrics.avg_gain > 0 ? "text-[#32D74B]" : "text-[#FF2D55]"}>
                  {data.metrics.avg_gain > 0 ? "+" : ""}{data.metrics.avg_gain.toFixed(2)}s
                </span>
              </div>
            </div>
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Drivers Pit Now</div>
              <div className="text-3xl font-bold text-[#FF2D55] font-mono">{data.metrics.pit_now_count}</div>
            </div>
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Drivers Stay Out</div>
              <div className="text-3xl font-bold text-[#32D74B] font-mono">{data.metrics.stay_out_count}</div>
            </div>
            <div className="rounded-xl border border-line bg-panel p-5">
              <div className="text-[10px] font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Biggest Gainer</div>
              <div className="text-2xl font-bold text-ink-hi font-mono mt-1">{data.metrics.biggest_gainer} <span className="text-sm text-[#32D74B]">+{data.metrics.biggest_gain_sec.toFixed(1)}s</span></div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
            <div className="xl:col-span-7 rounded-2xl border border-line bg-panel overflow-hidden flex flex-col">
              <div className="p-4 border-b border-line-strong bg-panel-2">
                <h3 className="text-sm font-semibold uppercase tracking-widest text-cyan">Grid Strategy (Click driver for details)</h3>
              </div>
              <div className="overflow-x-auto flex-1 max-h-[600px] overflow-y-auto">
                <table className="w-full text-left text-sm relative">
                  <thead className="sticky top-0 bg-panel-2 z-10 shadow-md">
                    <tr className="border-b border-line-strong text-ink-mid text-[10px] uppercase tracking-wider">
                      <th className="p-3 font-normal">POS</th>
                      <th className="p-3 font-normal">DRIVER</th>
                      <th className="p-3 font-normal">BEST STRATEGY</th>
                      <th className="p-3 font-normal text-right">PIT LAP</th>
                      <th className="p-3 font-normal text-right">TIME SAVED</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line/50 cursor-pointer">
                    {data.grid_strategy.map((s: any) => (
                      <tr 
                        key={s.driver} 
                        onClick={() => setSelectedDriver(s.driver)}
                        className={clsx(
                          "transition-colors", 
                          selectedDriver === s.driver ? "bg-cyan/10" : "hover:bg-white/[0.02]"
                        )}
                      >
                        <td className="p-3 font-mono text-ink-hi">P{s.position}</td>
                        <td className="p-3 font-medium text-ink-hi">{s.driver} <span className="text-ink-mid text-[10px] ml-1 hidden sm:inline">{s.team}</span></td>
                        <td className="p-3">{getStrategyPill(s.best_strategy)}</td>
                        <td className="p-3 text-right font-mono text-ink-mid">{s.pit_lap > 0 ? s.pit_lap : "—"}</td>
                        <td className="p-3 text-right font-mono">
                          <span className={s.time_saved > 0 ? "text-[#32D74B]" : "text-[#FF2D55]"}>
                            {s.time_saved > 0 ? "▲ " : "▼ "}{Math.abs(s.time_saved).toFixed(1)}s
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="xl:col-span-5 space-y-6">
              <div className="rounded-2xl border border-line bg-panel p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Net Time Gain Potential</h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data.grid_strategy.slice(0, 10)} layout="vertical" margin={{ left: 0, right: 0 }}>
                      <XAxis type="number" stroke="#5B6270" fontSize={10} />
                      <YAxis dataKey="driver" type="category" stroke="#9298A6" fontSize={10} width={40} />
                      <Tooltip contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
                      <Bar dataKey="time_saved" radius={[0, 4, 4, 0]}>
                        {data.grid_strategy.slice(0, 10).map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.time_saved > 0 ? '#00E5C9' : '#FF2D55'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-2xl border border-line bg-panel p-6">
                <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan">Driver Deep Dive</h3>
                {!selectedDriver ? (
                  <div className="h-48 flex items-center justify-center text-ink-mid text-sm border border-dashed border-line-strong rounded-xl">
                    Select a driver from the grid table
                  </div>
                ) : (
                  <div className="animate-fade-in space-y-4">
                    <div className="flex items-center justify-between border-b border-line pb-4">
                      <div className="text-2xl font-bold text-ink-hi">{selectedDriver}</div>
                      <div>{getStrategyPill(data.grid_strategy.find((d:any)=>d.driver===selectedDriver).best_strategy)}</div>
                    </div>
                    
                    <div className="space-y-3">
                      {data.grid_strategy.find((d:any)=>d.driver===selectedDriver).scenarios.map((sc: any) => {
                         const maxTime = Math.max(...data.grid_strategy.find((d:any)=>d.driver===selectedDriver).scenarios.map((s:any)=>Math.abs(s.time)));
                         const pct = Math.abs(sc.time) / maxTime * 100;
                         return (
                           <div key={sc.name} className="relative">
                             <div className="flex justify-between text-xs mb-1">
                               <span className={clsx("font-mono", sc.is_best ? "text-cyan font-bold" : "text-ink-mid")}>{sc.name} {sc.is_best && "★ BEST"}</span>
                               <span className={clsx("font-mono", sc.time > 0 ? "text-[#32D74B]" : "text-[#FF2D55]")}>{sc.time > 0 ? "+" : ""}{sc.time.toFixed(1)}s</span>
                             </div>
                             <div className="h-1.5 w-full bg-void rounded-full overflow-hidden">
                               <div className={clsx("h-full", sc.time > 0 ? "bg-[#32D74B]" : "bg-[#FF2D55]")} style={{ width: `${pct}%` }}></div>
                             </div>
                           </div>
                         );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
