// Path: frontend/thermosense-client/src/components/Dashboard.jsx

import { useEffect, useState, useCallback } from "react";
import StatCard from "./StatCard";
import DualAxisChart from "./DualAxisChart";
import HistoryPanel from "./HistoryPanel";

const API =
  process.env.REACT_APP_API_ROOT || "http://127.0.0.1:8000";

const HISTORY_KEY = "thermosense_history";
const MAX_HISTORY_ITEMS = 50; // Maximum number of history items to store

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [weather, setWeather] = useState(null);
  const [advisory, setAdvisory] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setTheme] = useState('dark');
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  // Initialize theme from saved preference
  useEffect(() => {
    const savedTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_KEY);
      if (savedHistory) {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed);
      }
    } catch (error) {
      console.error("Failed to load history from localStorage:", error);
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (error) {
      console.error("Failed to save history to localStorage:", error);
    }
  }, [history]);

  // Toggle theme
  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  // Add data point to history
  const addToHistory = useCallback((statsData, weatherData, advisoryData) => {
    const historyItem = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      stats: {
        battery_percent: statsData.battery_percent,
        battery_temp: statsData.battery_temp,
        cpu_temp: statsData.cpu_temp,
        thermal_pressure: statsData.thermal_pressure,
        cpu_load: statsData.cpu_load,
        mem_percent: statsData.mem_percent,
        charging: statsData.charging,
        platform: statsData.platform
      },
      weather: weatherData ? {
        name: weatherData.name,
        temp: weatherData.temp,
        main: weatherData.main
      } : null,
      advisory: advisoryData ? {
        alert_level: advisoryData.alert_level,
        natural_language_tip: advisoryData.natural_language_tip,
        optional_action: advisoryData.optional_action,
        predicted_health_impact: advisoryData.predicted_health_impact
      } : null
    };

    setHistory(prev => {
      // Keep only the most recent MAX_HISTORY_ITEMS
      const newHistory = [historyItem, ...prev].slice(0, MAX_HISTORY_ITEMS);
      return newHistory;
    });
  }, []);

  // Clear history
  const clearHistory = () => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      localStorage.removeItem(HISTORY_KEY);
    }
  };

  // Delete single history item
  const deleteHistoryItem = (id) => {
    setHistory(prev => prev.filter(item => item.id !== id));
  };

  // ---------- system‑stats fetch ----------
  const fetchStats = useCallback(async () => {
    try {
      const j = await fetch(`${API}/system_stats`).then((r) =>
        r.json()
      );
      setStats(j);
      setLastUpdate(new Date());
      setIsLoading(false);
      
      // Add to history if we have all data
      if (weather && advisory) {
        addToHistory(j, weather, advisory);
      }
    } catch {
      console.error("stats fetch failed");
      setIsLoading(false);
    }
  }, [weather, advisory, addToHistory]);

  // ---------- weather via backend proxy ----------
  const fetchWeather = useCallback((lat, lon) => {
    fetch(`${API}/weather?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((j) => {
        const weatherData = {
          name: j.name,
          temp: j.temp,
          main: j.condition,
        };
        setWeather(weatherData);
      })
      .catch(() => console.error("weather fetch failed"));
  }, []);

  // ---------- advisory fetch ----------
  const fetchAdvisory = useCallback(async (deviceTemp, ambient, state) => {
    const payload = {
      battery_temp: deviceTemp,
      ambient_temp: ambient,
      device_state: state,
    };
    try {
      const j = await fetch(`${API}/advisory`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).then((r) => r.json());
      setAdvisory(j);
    } catch (error) {
      console.error("Advisory fetch failed:", error);
    }
  }, []);

  // ---------- polling for stats ----------
  useEffect(() => {
    fetchStats();
    const id = setInterval(fetchStats, 30000);
    return () => clearInterval(id);
  }, [fetchStats]);

  // ---------- geolocation once ----------
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (pos) => fetchWeather(pos.coords.latitude, pos.coords.longitude),
      () => fetchWeather(23.2599, 77.4126) // fallback: Bhopal, MP
    );
  }, [fetchWeather]);

  // ---------- advisory whenever both pieces ready ----------
  useEffect(() => {
    if (!stats || !weather) return;
    const state = stats.charging ? "charging" : "idle";
    const deviceTemp =
      stats.battery_temp ?? stats.cpu_temp ?? weather.temp /* fallback */;
    fetchAdvisory(deviceTemp, weather.temp, state);
  }, [stats, weather, fetchAdvisory]);

  // ---------- helpers ----------
  const pressureColour = (lvl) =>
    lvl === "Critical"
      ? "#d32f2f"
      : lvl === "Serious"
      ? "#d98200"
      : lvl === "Elevated"
      ? "#e4c441"
      : "#1c7c1c"; // Nominal

  const getAlertIcon = (level) => {
    switch (level) {
      case "danger":
        return "⚠️";
      case "warning":
        return "⚡";
      default:
        return "✅";
    }
  };

  const formatUptime = () => {
    const now = new Date();
    const diff = now - lastUpdate;
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  const getPlatformIcon = (platform) => {
    switch(platform?.toLowerCase()) {
      case 'darwin': return '🍎';
      case 'windows': return '🪟';
      case 'linux': return '🐧';
      default: return '💻';
    }
  };

  // Get chart data from history
  const getChartData = () => {
    const currentData = stats && weather ? [{
      name: "Current",
      battery: stats.battery_temp ?? stats.cpu_temp ?? 0,
      ambient: weather.temp,
    }] : [];

    // Add last 10 history items for chart
    const historicalData = history.slice(0, 10).reverse().map((item, index) => ({
      name: new Date(item.timestamp).toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      battery: item.stats.battery_temp ?? item.stats.cpu_temp ?? 0,
      ambient: item.weather?.temp ?? 0,
    }));

    return [...historicalData, ...currentData];
  };

  if (isLoading) {
    return (
      <div className="container">
        <h1>ThermoSense Dashboard</h1>
        <div className="loading">Loading system data...</div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Theme Toggle Button */}
      <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
        <div className="theme-toggle-track">
          <div className="theme-toggle-thumb"></div>
          <div className="theme-icons">
            <span className="theme-icon dark-icon">🌙</span>
            <span className="theme-icon light-icon">☀️</span>
          </div>
        </div>
      </button>

      {/* History Toggle Button */}
      <button 
        className="history-toggle"
        onClick={() => setShowHistory(!showHistory)}
        style={{
          position: 'fixed',
          top: '20px',
          right: '160px',
          background: 'var(--card-bg)',
          backdropFilter: 'blur(var(--blur-amount))',
          WebkitBackdropFilter: 'blur(var(--blur-amount))',
          border: '1px solid var(--card-border)',
          borderRadius: '50px',
          padding: '12px 24px',
          cursor: 'pointer',
          transition: 'var(--transition-smooth)',
          zIndex: 1000,
          boxShadow: 'var(--shadow-soft)',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          color: 'var(--text-primary)',
          fontSize: '0.875rem',
          fontWeight: '500',
          textTransform: 'uppercase',
          letterSpacing: '1px',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = 'var(--shadow-soft), var(--shadow-glow)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = 'var(--shadow-soft)';
        }}
      >
        📊 History ({history.length})
      </button>

      <h1>ThermoSense Dashboard</h1>

      {stats && (
        <>
          {/* ------ top grid - 8 cards -------------- */}
          <div className="grid">
            <StatCard
              title="Battery Level"
              value={
                stats.battery_percent != null
                  ? `${stats.battery_percent}%`
                  : "N/A"
              }
              sub={`${stats.charging ? "⚡ Charging" : "🔋 Idle"}`}
              icon="🔋"
              gradient={stats.charging ? "warning" : "safe"}
              style={{ "--card-index": 0 }}
            />

            {stats.battery_temp != null ? (
              <StatCard
                title="Battery Temperature"
                value={`${stats.battery_temp.toFixed(1)}°`}
                sub="Battery sensor"
                unit="C"
                icon="🌡️"
                gradient={stats.battery_temp > 40 ? "danger" : stats.battery_temp > 30 ? "warning" : "safe"}
                style={{ "--card-index": 1 }}
              />
            ) : stats.cpu_temp != null ? (
              <StatCard
                title="CPU Temperature"
                value={`${stats.cpu_temp.toFixed(1)}°`}
                sub="Processor temp"
                unit="C"
                icon="💻"
                gradient={stats.cpu_temp > 70 ? "danger" : stats.cpu_temp > 50 ? "warning" : "safe"}
                style={{ "--card-index": 1 }}
              />
            ) : (
              <StatCard
                title="Thermal Pressure"
                value={stats.thermal_pressure ?? "N/A"}
                sub="System thermal state"
                icon="🔥"
                colour={pressureColour(stats.thermal_pressure)}
                style={{ "--card-index": 1 }}
              />
            )}

            <StatCard
              title="CPU Load"
              value={`${stats.cpu_load.toFixed(1)}%`}
              sub="Processing usage"
              icon="⚙️"
              gradient={stats.cpu_load > 80 ? "danger" : stats.cpu_load > 50 ? "warning" : "safe"}
              style={{ "--card-index": 2 }}
            />
            
            <StatCard
              title="Memory Usage"
              value={`${stats.mem_percent.toFixed(1)}%`}
              sub="RAM utilization"
              icon="💾"
              gradient={stats.mem_percent > 80 ? "danger" : stats.mem_percent > 60 ? "warning" : "safe"}
              style={{ "--card-index": 3 }}
            />

            {weather && (
              <StatCard
                title={`Weather`}
                value={`${weather.temp.toFixed(1)}°`}
                sub={`${weather.main} • ${weather.name}`}
                unit="C"
                icon="☁️"
                className="weather-card"
                style={{ "--card-index": 4 }}
              />
            )}

            <StatCard
              title="System Platform"
              value={getPlatformIcon(stats.platform)}
              sub={stats.platform || "Unknown"}
              icon="🖥️"
              className="platform-card"
              style={{ "--card-index": 5 }}
            />

            <StatCard
              title="Last Update"
              value={formatUptime()}
              sub="Auto-refresh: 30s"
              icon="🔄"
              className="system-card"
              style={{ "--card-index": 6 }}
            />

            <StatCard
              title="System Status"
              value={advisory ? getAlertIcon(advisory.alert_level) : "🔍"}
              sub={advisory ? advisory.alert_level.toUpperCase() : "Analyzing..."}
              icon="📊"
              gradient={
                advisory?.alert_level === "danger" ? "danger" : 
                advisory?.alert_level === "warning" ? "warning" : 
                "safe"
              }
              style={{ "--card-index": 7 }}
            />
          </div>

          {/* ------ advisory block ---------------------------------------- */}
          {advisory && (
            <div className="advisory-panel">
              <h2>
                System Advisory
                <span
                  className={`alert-badge ${
                    advisory.alert_level === "danger"
                      ? "alert-danger"
                      : advisory.alert_level === "warning"
                      ? "alert-warning"
                      : "alert-safe"
                  }`}
                >
                  {getAlertIcon(advisory.alert_level)} {advisory.alert_level}
                </span>
              </h2>
              <p>{advisory.natural_language_tip}</p>
              {advisory.optional_action && (
                <div className="action-item">
                  <span style={{ fontSize: "1.5rem" }}>👉</span>
                  <span>{advisory.optional_action}</span>
                </div>
              )}
              <p className="impact-score">
                ML Health Impact Score: {advisory.predicted_health_impact.toFixed(5)}
              </p>
            </div>
          )}

          {/* ------ History Panel -------------------------------------------------- */}
          {showHistory && (
            <HistoryPanel 
              history={history}
              onClose={() => setShowHistory(false)}
              onClear={clearHistory}
              onDelete={deleteHistoryItem}
            />
          )}

          {/* ------ chart with historical data ------------------------------------ */}
          {stats && weather && (
            <DualAxisChart data={getChartData()} />
          )}
        </>
      )}
    </div>
  );
}