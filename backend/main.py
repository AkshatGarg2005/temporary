"""
ThermoSense advisory engine  – 27 Jul 2025
-----------------------------------------
• Trains Random‑Forest on thermosense_test_data.csv
• Features: battery_temp, ambient_temp, hour_of_day, device_state (one‑hot)
• Computes model thresholds (75th / 90th percentile) at startup
• Alert logic:
      Danger  – battery_temp ≥ 50 °C OR impact ≥ p90
      Warning – battery_temp ≥ 40 °C OR impact ≥ p75
      Safe    – otherwise
• Advice sentences are deterministic templates (no GPT truncation)
"""

import pathlib, json, warnings
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ---------------------------------------------------------------------------
# 0.  Load CSV & feature‑engineer
# ---------------------------------------------------------------------------
BASE = pathlib.Path(__file__).resolve().parent
CSV  = BASE / "thermosense_test_data.csv"

df = pd.read_csv(CSV, parse_dates=["timestamp"])
df["hour_of_day"] = df["timestamp"].dt.hour

FEATURES = ["battery_temp", "ambient_temp", "hour_of_day", "device_state"]
TARGET   = "measured_health_impact"

enc = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
state_ohe = enc.fit_transform(df[["device_state"]])
state_df  = pd.DataFrame(
    state_ohe, columns=enc.get_feature_names_out(["device_state"])
)

X = pd.concat(
    [
        df[["battery_temp", "ambient_temp", "hour_of_day"]].reset_index(drop=True),
        state_df.reset_index(drop=True),
    ],
    axis=1,
)
y = df[TARGET]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

rf = RandomForestRegressor(n_estimators=140, random_state=42)
rf.fit(X_train, y_train)

# ---------------------------------------------------------------------------
# 1.  Impact thresholds derived from training data
# ---------------------------------------------------------------------------
THRESH_WARN   = float(y.quantile(0.75))   # 75th‑percentile ≈ “elevated”
THRESH_DANGER = float(y.quantile(0.90))   # 90th‑percentile ≈ “critical”

print(f"[ThermoSense] impact thresholds – Warning ≥ {THRESH_WARN:.3f}, "
      f"Danger ≥ {THRESH_DANGER:.3f}")

# ---------------------------------------------------------------------------
# 2.  Alert logic
# ---------------------------------------------------------------------------
def _alert(bat_c: float, impact: float) -> str:
    if bat_c >= 50 or impact >= THRESH_DANGER:
        return "danger"
    if bat_c >= 40 or impact >= THRESH_WARN:
        return "warning"
    return "safe"

# ---------------------------------------------------------------------------
# 3.  Advice templates
# ---------------------------------------------------------------------------
def _advice(level: str, bat: float, amb: float, state: str) -> str:
    Δ = bat - amb
    if level == "danger":
        return (
            f"Battery temperature is {bat:.1f} °C "
            f"({Δ:+.1f} °C over ambient) while {state}. "
            "Unplug the charger or stop heavy tasks and let the device cool immediately."
        )
    if level == "warning":
        return (
            f"Battery temperature is {bat:.1f} °C "
            f"({Δ:+.1f} °C over ambient). "
            "Reduce workload and monitor the temperature."
        )
    return (
        f"Battery temperature is {bat:.1f} °C, within the safe range. "
        "Normal operation is fine."
    )

# ---------------------------------------------------------------------------
# 4.  Public function used by FastAPI
# ---------------------------------------------------------------------------
def advisory_service(inp: dict) -> dict:
    """
    inp = {
        battery_temp : float,
        ambient_temp : float,
        device_state : str,
        hour_of_day  : int | None (backend fills with local time if missing)
    }
    """
    if "hour_of_day" not in inp or inp["hour_of_day"] is None:
        from datetime import datetime
        inp["hour_of_day"] = datetime.now().hour

    df_live = pd.DataFrame([inp])

    state_enc = enc.transform(df_live[["device_state"]])
    state_df  = pd.DataFrame(
        state_enc, columns=enc.get_feature_names_out(["device_state"])
    )

    X_live = pd.concat(
        [
            df_live[["battery_temp", "ambient_temp", "hour_of_day"]]
            .reset_index(drop=True),
            state_df.reset_index(drop=True),
        ],
        axis=1,
    ).reindex(columns=X_train.columns, fill_value=0)

    impact = float(rf.predict(X_live)[0])

    level  = _alert(inp["battery_temp"], impact)
    tip    = _advice(
        level,
        inp["battery_temp"],
        inp["ambient_temp"],
        inp["device_state"],
    )
    action = (
        "Stop using the device and let it cool."
        if level == "danger"
        else "Consider giving the device a short rest."
        if level == "warning"
        else None
    )

    return {
        "alert_level": level,
        "natural_language_tip": tip,
        "optional_action": action,
        "predicted_health_impact": round(impact, 5),
    }

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    demo = {
        "battery_temp": 30.4,
        "ambient_temp": 24.2,
        "device_state": "idle",
    }
    print(json.dumps(advisory_service(demo), indent=2))
