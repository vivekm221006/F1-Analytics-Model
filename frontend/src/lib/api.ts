export const api = {
  getCircuits: async () => {
    const res = await fetch("/api/meta/circuits");
    if (!res.ok) throw new Error("Failed to fetch circuits");
    return res.json();
  },
  getSeasons: async () => {
    const res = await fetch("/api/meta/seasons");
    if (!res.ok) throw new Error("Failed to fetch seasons");
    return res.json();
  },
  getGrid: async (year: number) => {
    const res = await fetch(`/api/meta/grid/${year}`);
    if (!res.ok) throw new Error("Failed to fetch grid");
    return res.json();
  },
  getRaces: async (year: number) => {
    const res = await fetch(`/api/meta/races/${year}`);
    if (!res.ok) throw new Error("Failed to fetch races");
    return res.json();
  },
  predictLap: async (data: any) => {
    const res = await fetch("/api/predict/lap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to predict lap");
    return res.json();
  },
  predictLapGrid: async (data: any) => {
    const res = await fetch("/api/predict/lap/grid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to predict lap grid");
    return res.json();
  },
  predictPit: async (data: any) => {
    const res = await fetch("/api/predict/pit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to predict pit");
    return res.json();
  },
  predictPitProjection: async (data: any) => {
    const res = await fetch("/api/predict/pit/projection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to predict pit projection");
    return res.json();
  },
  predictPitCompounds: async (data: any) => {
    const res = await fetch("/api/predict/pit/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to predict pit compounds");
    return res.json();
  },
  simulateRace: async (data: any) => {
    const res = await fetch("/api/simulate/race", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to simulate race");
    return res.json();
  },
  strategyOptimize: async (data: any) => {
    const res = await fetch("/api/strategy/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to optimize strategy");
    return res.json();
  },
  strategyDriver: async (data: any) => {
    const res = await fetch("/api/strategy/driver", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to optimize driver strategy");
    return res.json();
  },
  getLapModelAnalytics: async () => {
    const res = await fetch("/api/analytics/lap-model");
    if (!res.ok) throw new Error("Failed to fetch lap model analytics");
    return res.json();
  },
  getShapAnalytics: async () => {
    const res = await fetch("/api/analytics/shap");
    if (!res.ok) throw new Error("Failed to fetch SHAP analytics");
    return res.json();
  },
  getPitModelAnalytics: async () => {
    const res = await fetch("/api/analytics/pit-model");
    if (!res.ok) throw new Error("Failed to fetch pit model analytics");
    return res.json();
  },
};
