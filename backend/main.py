"""
ThermoSense – self‑contained advisory module
-------------------------------------------
• Trains a RandomForest on thermosense_test_data.csv
• Uses a lightweight T5 model to turn numbers into advice text
• Exposes advisory_service(input_row)  -> dict(JSON‑serialisable)
"""

import json, warnings, pathlib
import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder
from transformers import T5Tokenizer, T5ForConditionalGeneration
import torch

warnings.filterwarnings("ignore", category=UserWarning, module="sklearn")

# ---------------------------------------------------------------------------
# 0.  Locate the CSV (same folder) – no hard‑coded absolute path!
# ---------------------------------------------------------------------------
BASE_DIR = pathlib.Path(__file__).resolve().parent
CSV_PATH = BASE_DIR / "thermosense_test_data.csv"

# 1.  Load & prep data -------------------------------------------------------
df = pd.read_csv(CSV_PATH)

features = ["battery_temp", "ambient_temp", "device_state"]
target   = "measured_health_impact"

enc = OneHotEncoder(sparse_output=False, handle_unknown="ignore")
state_enc = enc.fit_transform(df[["device_state"]])
state_df  = pd.DataFrame(state_enc,
                         columns=enc.get_feature_names_out(["device_state"]))

X = pd.concat([df[["battery_temp", "ambient_temp"]].reset_index(drop=True),
               state_df.reset_index(drop=True)], axis=1)
y = df[target]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)

model = RandomForestRegressor(n_estimators=120, random_state=42)
model.fit(X_train, y_train)

# 2.  Tiny T5 for advice text ------------------------------------------------
tokenizer = T5Tokenizer.from_pretrained("t5-small", legacy=False)
generator = T5ForConditionalGeneration.from_pretrained("t5-small")
generator.eval()

FEW_SHOT = (
    "Given the data below, output a **concise, actionable battery‑safety tip**.\n"
    "Example:\n"
    "- Battery: 45.0°C, Ambient: 32.0°C, State: Charging, Impact: 0.128 -> "
    "\"Danger: Unplug the charger and let the device cool down immediately.\"\n\n"
)

def _nl_advice(batt, amb, state, impact) -> str:
    prompt = (
        FEW_SHOT +
        f"Battery: {batt:.1f}°C, Ambient: {amb:.1f}°C, "
        f"State: {state.capitalize()}, Impact: {impact:.3f} ->"
    )
    ids = tokenizer.encode(prompt, return_tensors="pt", truncation=True)
    with torch.no_grad():
        out = generator.generate(ids, max_length=40)
    return tokenizer.decode(out[0], skip_special_tokens=True)

# 3.  Helper to map impact -> alert level -----------------------------------
def _alert(impact: float) -> str:
    if impact > 0.07:   # tweak thresholds as you like
        return "danger"
    if impact > 0.04:
        return "warning"
    return "safe"

# 4.  **Public** function ----------------------------------------------------
def advisory_service(input_row: dict) -> dict:
    """
    input_row = {
        "battery_temp": float,
        "ambient_temp": float,
        "device_state": "charging|idle|discharging"
    }
    """
    df_live = pd.DataFrame([input_row])

    # one‑hot
    live_state = enc.transform(df_live[["device_state"]])
    live_state_df = pd.DataFrame(
        live_state, columns=enc.get_feature_names_out(["device_state"])
    )

    X_live = pd.concat(
        [df_live[["battery_temp", "ambient_temp"]].reset_index(drop=True),
         live_state_df.reset_index(drop=True)],
        axis=1
    ).reindex(columns=X_train.columns, fill_value=0)

    impact = float(model.predict(X_live)[0])
    alert  = _alert(impact)
    tip    = _nl_advice(
        input_row["battery_temp"],
        input_row["ambient_temp"],
        input_row["device_state"],
        impact
    )

    if alert == "danger":
        action = "Stop using the device and let it cool."
    elif alert == "warning":
        action = "Reduce screen brightness and workload."
    else:
        action = None

    return {
        "alert_level": alert,
        "natural_language_tip": tip,
        "optional_action": action,
        "predicted_health_impact": round(impact, 5)
    }

# ---------------------------------------------------------------------------
if __name__ == "__main__":
    demo_input = {
        "battery_temp": 42.3,
        "ambient_temp": 35.0,
        "device_state": "charging"
    }
    print(json.dumps(advisory_service(demo_input), indent=2))
