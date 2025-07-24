import { useState } from "react";
import TemperatureForm from "./components/TemperatureForm";
import DualAxisChart from "./components/DualAxisChart";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [advisory, setAdvisory] = useState(null);
  const [chartData, setChartData] = useState([]);

  const handleSubmit = async (payload) => {
    setLoading(true);
    setAdvisory(null);

    try {
      const res = await fetch("http://127.0.0.1:8000/advisory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setAdvisory({ ...data, ...payload });
      setChartData([
        {
          name: "Now",
          battery: payload.battery_temp,
          ambient: payload.ambient_temp,
        },
      ]);
    } catch (err) {
      alert("Could not reach the API. Is it running?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <h1>ThermoSense Advisor</h1>
      <TemperatureForm onSubmit={handleSubmit} loading={loading} />

      {advisory && (
        <>
          <h2>
            Advice&nbsp;
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
          <p>
            Predicted health impact score:&nbsp;
            {advisory.predicted_health_impact}
          </p>
          <DualAxisChart data={chartData} />
        </>
      )}
    </div>
  );
}

export default App;
