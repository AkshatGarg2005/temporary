"""
System‑stats helper for ThermoSense
• Battery % / charging          – psutil
• Battery temperature (all Macs)
    • Reads AppleSmartBattery   – value units differ by model
• Thermal‑pressure (Apple‑silicon fallback) – powermetrics
• CPU‑load / RAM                – psutil
"""

import psutil, subprocess, re
from typing import Optional

# ---------------------------------------------------------------------
# 1. Battery temperature – works on Intel AND Apple‑silicon
# ---------------------------------------------------------------------
def _apple_battery_temp() -> Optional[float]:
    """
    Runs: ioreg -r -n AppleSmartBattery
    Captures `"Temperature" = ###`
        • On Intel Macs  : 0.1 Kelvin units   (e.g. 2982 → 25.07 °C)
        • On Apple M‑series : 0.01 °C units  (e.g. 3043 → 30.43 °C)
    Returns °C rounded to 0.1, else None.
    """
    try:
        out = subprocess.check_output(
            ["ioreg", "-r", "-n", "AppleSmartBattery"], text=True
        )
        m = re.search(r'"Temperature"\s*=\s*(\d+)', out)
        if not m:
            return None
        raw = int(m.group(1))
        # Heuristic: value > 2000 ⇒ centi‑°C; else 0.1 K
        if raw > 2000:
            temp_c = raw / 100.0                    # centi‑°C
        else:
            temp_c = raw / 10.0 - 273.15            # 0.1 K → °C
        return round(temp_c, 1)
    except Exception:
        return None


# ---------------------------------------------------------------------
# 2. Thermal pressure – Apple‑silicon coarse backup
# ---------------------------------------------------------------------
def _thermal_pressure() -> Optional[str]:
    """
    sudo powermetrics -n 1 -s thermal
    Parses: Current pressure level: Nominal|Elevated|Serious|Critical
    Returns the level or None.
    """
    try:
        out = subprocess.check_output(
            ["sudo", "-n", "powermetrics", "-n", "1", "-s", "thermal"],
            text=True,
            stderr=subprocess.DEVNULL,
        )
        m = re.search(r"Current pressure level:\s+(\w+)", out)
        if m:
            return m.group(1)
    except subprocess.CalledProcessError:
        # sudo password needed or command not permitted
        pass
    return None


# ---------------------------------------------------------------------
# 3. Public helper for FastAPI
# ---------------------------------------------------------------------
def get_stats() -> dict:
    batt = psutil.sensors_battery()
    return {
        "battery_percent": batt.percent if batt else None,
        "charging": batt.power_plugged if batt else None,
        "battery_temp": _apple_battery_temp(),          # now works on M‑series
        "cpu_temp": None,                               # Apple hides die temp
        "thermal_pressure": _thermal_pressure(),
        "cpu_load": psutil.cpu_percent(interval=0.3),
        "mem_percent": psutil.virtual_memory().percent,
    }
