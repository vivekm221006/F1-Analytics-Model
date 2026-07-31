"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { PageHeader } from "@/components/layout/PageHeader";
import { api } from "@/lib/api";
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid, LineChart, Line, BarChart, Bar, Cell } from "recharts";
import clsx from "clsx";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false, loading: () => <div className="h-full w-full flex items-center justify-center text-ink-mid font-mono text-sm animate-pulse">Loading Plotly...</div> });

const TABS = ["📈 Lap Time Model", "🧠 SHAP Explainability", "🔧 Pit Model", "📐 Strategy Charts"];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState(TABS[0]);
  const [loading, setLoading] = useState(false);
  
  // Data states
  const [lapData, setLapData] = useState<any>(null);
  const [shapData, setShapData] = useState<any>(null);
  const [pitData, setPitData] = useState<any>(null);
  const [strategyData, setStrategyData] = useState<any>(null);

  // SHAP Tab controls
  const [shapSampleSize, setShapSampleSize] = useState(500);

  useEffect(() => {
    const loadTabData = async (tab: string) => {
      setLoading(true);
      try {
        if (tab === "📈 Lap Time Model") {
          if (!lapData) {
            // Fetch or mock
            setLapData({
              r2: 0.892, mae: 1.12, rmse: 1.45,
              scatter: Array.from({length: 150}, () => {
                const act = 80 + Math.random()*30;
                const err = (Math.random()*4-2);
                return { x: act, y: act + err, error: Math.abs(err) };
              }),
              residuals: Array.from({length: 20}, (_, i) => ({ bin: -2 + i*0.2, count: Math.exp(-Math.pow(-2+i*0.2, 2))*100 })),
              feature_importance: [
                {feature: "tyre_age", importance: 0.35},
                {feature: "circuit_base_pace", importance: 0.25},
                {feature: "driver_rolling_pace", importance: 0.15},
                {feature: "fuel_load", importance: 0.10},
                {feature: "track_temperature", importance: 0.05},
                {feature: "traffic", importance: 0.04},
                {feature: "position", importance: 0.03},
                {feature: "grid_position", importance: 0.015},
                {feature: "qualifying_position", importance: 0.01},
                {feature: "weather", importance: 0.005},
              ]
            });
          }
        } else if (tab === "🔧 Pit Model") {
          if (!pitData) {
            setPitData({
              roc_auc: 0.945, f1: 0.88,
              confusion_matrix: [[120, 15], [20, 85]],
              roc_curve: Array.from({length: 20}, (_, i) => ({fpr: i/20, tpr: Math.pow(i/20, 0.4)}))
            });
          }
        } else if (tab === "📐 Strategy Charts") {
           if (!strategyData) {
             setStrategyData({
               recommended_pit_lap: [
                 { range: "Lap 15-20", count: 12 }, { range: "Lap 20-25", count: 24 }, { range: "Lap 25-30", count: 8 }, { range: "Stay Out", count: 4 }
               ],
               time_gain: [
                 { driver: "VER", gain: 4.2 }, { driver: "HAM", gain: 3.5 }, { driver: "LEC", gain: -1.2 }, { driver: "NOR", gain: 2.1 }
               ],
               pos_gain: [
                 { driver: "VER", gain: 2 }, { driver: "HAM", gain: 1 }, { driver: "LEC", gain: -1 }, { driver: "NOR", gain: 0 }
               ]
             });
           }
        }
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    };

    loadTabData(activeTab);
  }, [activeTab, lapData, pitData, strategyData]);

  const handleGenerateShap = () => {
    setLoading(true);
    setTimeout(() => {
      setShapData({
        features: ["tyre_age", "circuit_base_pace", "driver_rolling_pace", "fuel_load", "track_temperature"],
        values: [0.8, -0.6, 0.4, 0.3, -0.1]
      });
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-void px-6 pb-20 md:px-12">
      <PageHeader title="Analytics Dashboard" subtitle="Model diagnostics, global SHAP explanations, and strategy visualizations." />
      
      <div className="mb-8 flex gap-2 border-b border-line pb-px overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
              activeTab === tab ? "border-cyan text-cyan" : "border-transparent text-ink-mid hover:text-ink-hi"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[500px]">
        {loading && activeTab !== "🧠 SHAP Explainability" ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan border-t-transparent"></div>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* TAB 1: LAP MODEL */}
            {activeTab === "📈 Lap Time Model" && lapData && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col justify-center">
                    <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">R² Score</div>
                    <div className="text-4xl font-bold tracking-tighter text-ink-hi">{lapData.r2.toFixed(3)}</div>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col justify-center">
                    <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">Mean Absolute Error</div>
                    <div className="text-4xl font-bold tracking-tighter text-ink-hi">{lapData.mae.toFixed(2)}s</div>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col justify-center">
                    <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">RMSE</div>
                    <div className="text-4xl font-bold tracking-tighter text-ink-hi">{lapData.rmse.toFixed(2)}s</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Actual vs Predicted (s)</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
                          <XAxis type="number" dataKey="x" name="Actual" domain={['auto', 'auto']} stroke="#5B6270" fontSize={10} />
                          <YAxis type="number" dataKey="y" name="Predicted" domain={['auto', 'auto']} stroke="#5B6270" fontSize={10} />
                          <RechartsTooltip cursor={{strokeDasharray: '3 3'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                          <Scatter name="Laps" data={lapData.scatter}>
                             {lapData.scatter.map((entry: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={entry.error > 1.5 ? '#FF2D55' : entry.error > 0.8 ? '#FFD60A' : '#00E5C9'} opacity={0.7} />
                             ))}
                          </Scatter>
                          <Line dataKey="y" data={[{x:80, y:80}, {x:110, y:110}]} stroke="#FF2D55" strokeDasharray="3 3" dot={false} strokeWidth={2} />
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Residuals Histogram</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={lapData.residuals}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                          <XAxis dataKey="bin" stroke="#5B6270" fontSize={10} tickFormatter={v => v.toFixed(1)} />
                          <YAxis stroke="#5B6270" fontSize={10} />
                          <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                          <Bar dataKey="count" fill="#0A84FF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-line bg-panel p-6">
                  <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Feature Importance (Top 13)</h3>
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={lapData.feature_importance} layout="vertical" margin={{ left: 120, right: 20 }}>
                        <XAxis type="number" stroke="#5B6270" fontSize={10} />
                        <YAxis dataKey="feature" type="category" stroke="#9298A6" fontSize={10} width={110} />
                        <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                        <Bar dataKey="importance" fill="#00E5C9" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: SHAP */}
            {activeTab === "🧠 SHAP Explainability" && (
              <div className="space-y-6">
                <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col md:flex-row items-end gap-6">
                  <div className="flex-1 w-full">
                    <label className="mb-1 flex justify-between text-xs text-ink-mid">
                      <span>Sample Size for SHAP</span>
                      <span className="font-mono text-ink-hi">{shapSampleSize} rows</span>
                    </label>
                    <input type="range" min="200" max="2000" step="100" value={shapSampleSize} onChange={e => setShapSampleSize(Number(e.target.value))} className="w-full accent-cyan mt-2" />
                  </div>
                  <button onClick={handleGenerateShap} className="rounded-lg bg-cyan px-8 py-3 text-sm font-bold text-void transition-transform hover:-translate-y-0.5 whitespace-nowrap">
                    {loading ? "Generating..." : "Generate SHAP Explanations"}
                  </button>
                </div>

                {shapData && !loading && (
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                     <div className="rounded-2xl border border-line bg-panel p-6">
                        <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">SHAP Summary Plot</h3>
                        <div className="h-64 flex items-center justify-center border border-dashed border-line-strong rounded text-ink-mid text-sm">
                           Python SHAP summary dot-plot representation
                        </div>
                     </div>
                     <div className="rounded-2xl border border-line bg-panel p-6">
                        <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">SHAP Bar Plot</h3>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={shapData.features.map((f:string, i:number) => ({ feature: f, value: shapData.values[i] }))} layout="vertical" margin={{ left: 100, right: 20 }}>
                              <XAxis type="number" stroke="#5B6270" fontSize={10} />
                              <YAxis dataKey="feature" type="category" stroke="#9298A6" fontSize={10} width={100} />
                              <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                {shapData.features.map((f:string, index: number) => (
                                   <Cell key={`cell-${index}`} fill={shapData.values[index] > 0 ? '#FF2D55' : '#00E5C9'} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                     </div>
                   </div>
                )}
              </div>
            )}

            {/* TAB 3: PIT MODEL */}
            {activeTab === "🔧 Pit Model" && pitData && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col justify-center">
                    <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">ROC AUC</div>
                    <div className="text-4xl font-bold tracking-tighter text-ink-hi">{pitData.roc_auc.toFixed(3)}</div>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel p-6 flex flex-col justify-center">
                    <div className="text-xs font-mono uppercase tracking-[0.2em] mb-2 text-ink-mid">F1 Score</div>
                    <div className="text-4xl font-bold tracking-tighter text-ink-hi">{pitData.f1.toFixed(3)}</div>
                  </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Confusion Matrix Heatmap</h3>
                    <div className="h-72 w-full bg-void rounded flex items-center justify-center overflow-hidden border border-line-strong">
                      <Plot
                        data={[
                          {
                            z: pitData.confusion_matrix,
                            x: ['Pred: No Pit', 'Pred: Pit'],
                            y: ['Act: No Pit', 'Act: Pit'],
                            type: 'heatmap',
                            colorscale: [
                              ['0.0', '#0B0E16'],
                              ['1.0', '#00E5C9']
                            ],
                            showscale: false
                          }
                        ]}
                        layout={{
                          margin: { t: 20, r: 20, b: 40, l: 60 },
                          paper_bgcolor: 'transparent',
                          plot_bgcolor: 'transparent',
                          font: { color: '#9298A6', family: 'var(--font-jetbrains)' },
                          xaxis: { fixedrange: true },
                          yaxis: { fixedrange: true, autorange: 'reversed' }
                        }}
                        config={{ displayModeBar: false }}
                        style={{ width: '100%', height: '100%' }}
                      />
                    </div>
                  </div>

                  <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">ROC Curve</h3>
                    <div className="h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={pitData.roc_curve} margin={{ top: 10, right: 10, bottom: 0, left: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" />
                          <XAxis type="number" dataKey="fpr" domain={[0, 1]} stroke="#5B6270" fontSize={10} />
                          <YAxis type="number" dataKey="tpr" domain={[0, 1]} stroke="#5B6270" fontSize={10} />
                          <RechartsTooltip contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                          <Line type="monotone" dataKey="tpr" stroke="#FFD60A" strokeWidth={2} dot={false} />
                          <Line type="linear" dataKey="fpr" stroke="#5B6270" strokeDasharray="5 5" dot={false} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: STRATEGY CHARTS */}
            {activeTab === "📐 Strategy Charts" && strategyData && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                 <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Recommended Pit Lap Distribution</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={strategyData.recommended_pit_lap}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#2a2e39" vertical={false} />
                          <XAxis dataKey="range" stroke="#5B6270" fontSize={10} />
                          <YAxis stroke="#5B6270" fontSize={10} />
                          <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                          <Bar dataKey="count" fill="#32D74B" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Time Gain vs Stay Out</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={strategyData.time_gain} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" stroke="#5B6270" fontSize={10} />
                          <YAxis dataKey="driver" type="category" stroke="#9298A6" fontSize={10} />
                          <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                          <Bar dataKey="gain" radius={[0, 4, 4, 0]}>
                            {strategyData.time_gain.map((entry: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={entry.gain > 0 ? '#00E5C9' : '#FF2D55'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>

                 <div className="rounded-2xl border border-line bg-panel p-6">
                    <h3 className="mb-6 text-sm font-semibold uppercase tracking-widest text-cyan">Position Gain Predictions</h3>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={strategyData.pos_gain} layout="vertical" margin={{ left: 20 }}>
                          <XAxis type="number" stroke="#5B6270" fontSize={10} />
                          <YAxis dataKey="driver" type="category" stroke="#9298A6" fontSize={10} />
                          <RechartsTooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{ backgroundColor: '#0B0E16', border: '1px solid rgba(255,255,255,0.14)', fontSize: '12px' }} />
                          <Bar dataKey="gain" radius={[0, 4, 4, 0]}>
                            {strategyData.pos_gain.map((entry: any, index: number) => (
                               <Cell key={`cell-${index}`} fill={entry.gain > 0 ? '#32D74B' : entry.gain === 0 ? '#FFD60A' : '#FF2D55'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                 </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
