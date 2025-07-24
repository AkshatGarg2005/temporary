import { useState } from "react";

export default function TemperatureForm({ onSubmit, loading }) {
  const [battery, setBattery] = useState("");
  const [ambient, setAmbient] = useState("");
  const [state, setState] = useState("idle");

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      battery_temp: parseFloat(battery),
      ambient_temp: parseFloat(ambient),
      device_state: state,
    });
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>Battery temperature (°C)</label>
      <input
        type="number"
        step="0.1"
        value={battery}
        onChange={(e) => setBattery(e.target.value)}
        required
      />
      <label>Ambient temperature (°C)</label>
      <input
        type="number"
        step="0.1"
        value={ambient}
        onChange={(e) => setAmbient(e.target.value)}
        required
      />
      <label>Device state</label>
      <select value={state} onChange={(e) => setState(e.target.value)}>
        <option value="idle">Idle</option>
        <option value="charging">Charging</option>
        <option value="discharging">Discharging</option>
      </select>
      <button disabled={loading}>{loading ? "Checking…" : "Get advice"}</button>
    </form>
  );
}
