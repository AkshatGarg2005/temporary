import { useEffect, useState, useCallback } from "react";
import StatCard from "./StatCard";
import DualAxisChart from "./DualAxisChart";

const OPENWX_KEY = "fd81503191483c84f5c6b38525dd9634";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weather, setWeather] = useState(null);
  const [advisory, setAdvisory] = useState(null);

  // -------- fetchers -------
  const fetchStats = useCallback(async () => {
    const j = await fetch("http://127.0.0.1:8000/system_stats").then((r) =>
      r.json()
    );
    setStats(j);
  }, []);

  const fetchWeather = useCallback((lat, lon) => {
    fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${OPENWX_KEY}`
    )
      .then((r) => r.json())
      .then(setWeather);
  }, []);

  const fetchAdvisory = useCallback(async (deviceTemp, ambient, state) => {
    const payload = {
      battery_temp: deviceTemp,
      ambient_temp: ambient,
      device_state: state,
    };
    const j = await fetch("http://127.0.0.1:8000/advisory", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).then((r) => r.json());
    setAdvisory(j);
  }, []);

  // -------- polling -------
  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // -------- geo once -------
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(23.2599, 77.4126)
    );
  }, [fetchWeather]);

  // -------- advisory whenever both pieces ready -------
  useEffect(() => {
    if (!stats || !weather) return;
    const state = stats.charging ? "charging" : "idle";
    const deviceTemp =
      stats.battery_temp ?? stats.cpu_temp ?? weather.main.temp; // fallback
    fetchAdvisory(deviceTemp, weather.main.temp, state);
  }, [stats, weather, fetchAdvisory]);

  // -------- helpers -------
  const pressureColour = (lvl) =>
    lvl === "Critical"
      ? "#d32f2f"
      : lvl === "Serious"
      ? "#d98200"
      : lvl === "Elevated"
      ? "#e4c441"
      : "#1c7c1c"; // Nominal

  // -------- UI -------
  return (
    <div className="container">
      <h1>ThermoSense Dashboard</h1>

      {!stats && <p>Loading system data…</p>}

      {stats && (
        <>
          <div className="grid">
            <StatCard
              title="Battery"
              value={
                stats.battery_percent != null
                  ? `${stats.battery_percent} %`
                  : "N/A"
              }
              sub={`Status: ${stats.charging ? "Charging" : "Idle"}`}
            />

            {stats.battery_temp != null ? (
              <StatCard
                title="Battery Temp"
                value={`${stats.battery_temp.toFixed(1)} °C`}
                sub="Battery sensor"
              />
            ) : stats.cpu_temp != null ? (
              <StatCard
                title="CPU Temp"
                value={`${stats.cpu_temp.toFixed(1)} °C`}
                sub="Unavailable on M‑series"
              />
            ) : (
              <StatCard
                title="Thermal Pressure"
                value={stats.thermal_pressure ?? "N/A"}
                sub="powermetrics"
                colour={pressureColour(stats.thermal_pressure)}
              />
            )}

            <StatCard
              title="CPU Load"
              value={`${stats.cpu_load.toFixed(1)} %`}
              sub="1 s avg"
            />
            <StatCard
              title="RAM Use"
              value={`${stats.mem_percent.toFixed(1)} %`}
              sub="System"
            />
            {weather && (
              <StatCard
                title={`Weather (${weather.name})`}
                value={`${weather.main.temp.toFixed(1)} °C`}
                sub={weather.weather[0].main}
              />
            )}
          </div>

          {advisory && (
            <>
              <h2>
                Alert&nbsp;
                <span
                  className={
                    advisory.alert_level === "danger"
                      ? "alert-danger"
                      : advisory.alert_level === "warning"
                      ? "alert-warning"
                      : "alert-safe"
                  }
                >
                  ({advisory.alert_level.toUpperCase()})
                </span>
              </h2>
              <p>{advisory.natural_language_tip}</p>
              {advisory.optional_action && <p>👉 {advisory.optional_action}</p>}
            </>
          )}

          {stats && weather && (
            <DualAxisChart
              data={[
                {
                  name: "Now",
                  battery:
                    stats.battery_temp ??
                    stats.cpu_temp ??
                    (stats.thermal_pressure
                      ? { Nominal: 35, Elevated: 45, Serious: 55, Critical: 65 }[
                          stats.thermal_pressure
                        ]
                      : 0),
                  ambient: weather.main.temp,
                },
              ]}
            />
          )}
        </>
      )}
    </div>
  );
}
