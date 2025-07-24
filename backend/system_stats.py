"""
Cross‑platform system‑stats helper
• macOS   : battery %, charging, battery_temp (AppleSmartBattery), thermal_pressure
• Windows : battery %, charging, cpu_temp (via WMI)  — battery temp not exposed
• Linux   : battery %, charging, cpu_temp (sensors), battery_temp if hwmon present
• All     : cpu_load, mem_percent
"""

import psutil, platform, subprocess, re, os
from typing import Optional

PLAT = platform.system().lower()

# ---------------------------------------------------------------------------
# macOS helpers
# ---------------------------------------------------------------------------
def _mac_battery_temp() -> Optional[float]:
    try:
        out = subprocess.check_output(["ioreg", "-r", "-n", "AppleSmartBattery"], text=True)
        # Prefer VirtualTemperature (centi‑°C)
        m = re.search(r'"VirtualTemperature"\s*=\s*(\d+)', out)
        if m:
            return round(int(m.group(1)) / 100.0, 1)
        # Fallback to Temperature (Intel 0.1 K, Apple‑silicon centi‑°C)
        m = re.search(r'"Temperature"\s*=\s*(\d+)', out)
        if not m:
            return None
        raw = int(m.group(1))
        temp_c = raw / 100.0 if raw > 2000 else raw / 10.0 - 273.15
        return round(temp_c, 1)
    except Exception:
        return None


def _mac_thermal_pressure() -> Optional[str]:
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
        pass  # sudo password needed
    return None


# ---------------------------------------------------------------------------
# Windows helpers (requires 'wmi' package)
# ---------------------------------------------------------------------------
def _win_cpu_temp() -> Optional[float]:
    try:
        import wmi  # lazy import
        w = wmi.WMI(namespace="root\\OpenHardwareMonitor")
        sensors = w.Sensor()
        temps = [s for s in sensors if s.SensorType == "Temperature" and "CPU Package" in s.Name]
        if temps:
            return round(max(t.Value for t in temps), 1)
    except ImportError:
        pass
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Linux helpers
# ---------------------------------------------------------------------------
def _linux_cpu_temp() -> Optional[float]:
    try:
        temps = psutil.sensors_temperatures()
        if not temps:
            return None
        # pick first package/core reading
        for label, entries in temps.items():
            for entry in entries:
                if entry.current and ("package" in entry.label.lower() or "core 0" in entry.label.lower()):
                    return round(entry.current, 1)
    except Exception:
        pass
    return None


def _linux_battery_temp() -> Optional[float]:
    try:
        # many distros expose /sys/class/power_supply/BAT*/temp (milli‑°C)
        for bat in os.listdir("/sys/class/power_supply"):
            path = f"/sys/class/power_supply/{bat}/temp"
            if os.path.exists(path):
                with open(path) as f:
                    return round(int(f.read().strip()) / 1000.0, 1)
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Master get_stats()
# ---------------------------------------------------------------------------
def get_stats() -> dict:
    batt = psutil.sensors_battery()

    # platform‑specific temps
    if PLAT == "darwin":
        battery_temp = _mac_battery_temp()
        cpu_temp = None
        thermal_pressure = _mac_thermal_pressure()
    elif PLAT == "windows":
        battery_temp = None  # not available
        cpu_temp = _win_cpu_temp()
        thermal_pressure = None
    else:  # linux/other
        battery_temp = _linux_battery_temp()
        cpu_temp = _linux_cpu_temp()
        thermal_pressure = None

    return {
        "battery_percent": batt.percent if batt else None,
        "charging": batt.power_plugged if batt else None,
        "battery_temp": battery_temp,
        "cpu_temp": cpu_temp,
        "thermal_pressure": thermal_pressure,
        "cpu_load": psutil.cpu_percent(interval=0.3),
        "mem_percent": psutil.virtual_memory().percent,
        "platform": PLAT,
    }
