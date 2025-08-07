"""
Gemini-powered advisory system for ThermoSense
Generates dynamic, context-aware battery health advice using Google's Gemini-2.5-flash
"""

import os
from typing import Dict, Optional
import google.generativeai as genai
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

if not GEMINI_API_KEY:
    raise RuntimeError("GEMINI_API_KEY missing in backend/.env")

# Configure Gemini
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel('gemini-2.0-flash-exp')

def generate_gemini_advice(
    battery_temp: float,
    ambient_temp: float,
    device_state: str,
    predicted_impact: float,
    alert_level: str
) -> Dict[str, Optional[str]]:
    """
    Generate natural language advice using Gemini-2.5-flash
    
    Args:
        battery_temp: Current battery temperature in Celsius
        ambient_temp: Current ambient temperature in Celsius
        device_state: Current device state (idle/charging/discharging)
        predicted_impact: ML model's predicted health impact score
        alert_level: Alert level (safe/warning/danger)
    
    Returns:
        Dictionary with natural language tip and optional action
    """
    
    # Calculate temperature differential
    temp_diff = battery_temp - ambient_temp
    
    # Create a context-aware prompt
    prompt = f"""You are a battery health advisor for electronic devices. Generate a concise, actionable advice message based on the following parameters:

Battery Temperature: {battery_temp:.1f}°C
Ambient Temperature: {ambient_temp:.1f}°C
Temperature Differential: {temp_diff:+.1f}°C
Device State: {device_state}
Alert Level: {alert_level}
Health Impact Score: {predicted_impact:.3f}

Generate TWO responses:
1. A brief, friendly advisory message (1-2 sentences) explaining the current battery status and any concerns
2. A specific action item if the alert level is "warning" or "danger", or None if "safe"

Format your response as:
TIP: [your advisory message]
ACTION: [specific action or "None"]

Keep the tone professional but approachable. Focus on practical advice."""

    try:
        # Generate response from Gemini
        response = model.generate_content(
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.7,
                max_output_tokens=200,
            )
        )
        
        # Parse the response
        response_text = response.text.strip()
        
        # Extract tip and action from response
        tip = ""
        action = None
        
        for line in response_text.split('\n'):
            if line.startswith('TIP:'):
                tip = line.replace('TIP:', '').strip()
            elif line.startswith('ACTION:'):
                action_text = line.replace('ACTION:', '').strip()
                if action_text.lower() != 'none':
                    action = action_text
        
        # Fallback if parsing fails
        if not tip:
            tip = f"Battery temperature is {battery_temp:.1f}°C ({temp_diff:+.1f}°C above ambient). "
            if alert_level == "danger":
                tip += "Immediate action required to prevent battery damage."
            elif alert_level == "warning":
                tip += "Monitor closely and consider reducing device load."
            else:
                tip += "Operating within normal parameters."
        
        return {
            "natural_language_tip": tip,
            "optional_action": action
        }
        
    except Exception as e:
        # Fallback to deterministic templates if Gemini fails
        print(f"Gemini API error: {e}")
        return generate_fallback_advice(battery_temp, ambient_temp, device_state, alert_level)

def generate_fallback_advice(
    battery_temp: float,
    ambient_temp: float,
    device_state: str,
    alert_level: str
) -> Dict[str, Optional[str]]:
    """
    Fallback advice generation using deterministic templates
    """
    temp_diff = battery_temp - ambient_temp
    
    if alert_level == "danger":
        tip = (
            f"Battery temperature is critically high at {battery_temp:.1f}°C "
            f"({temp_diff:+.1f}°C above ambient) while {device_state}. "
            "Immediate cooling required to prevent damage."
        )
        action = "Stop all intensive tasks and unplug charger immediately. Allow device to cool."
    elif alert_level == "warning":
        tip = (
            f"Battery temperature is elevated at {battery_temp:.1f}°C "
            f"({temp_diff:+.1f}°C above ambient). "
            "Consider reducing workload to prevent overheating."
        )
        action = "Reduce processor-intensive tasks and ensure adequate ventilation."
    else:
        tip = (
            f"Battery temperature is {battery_temp:.1f}°C, within safe operating range. "
            "Your device is running optimally."
        )
        action = None
    
    return {
        "natural_language_tip": tip,
        "optional_action": action
    }

# Test function
if __name__ == "__main__":
    # Test the Gemini advisor
    test_cases = [
        {"battery_temp": 45.5, "ambient_temp": 25.0, "device_state": "charging", "impact": 0.75, "level": "danger"},
        {"battery_temp": 35.0, "ambient_temp": 25.0, "device_state": "discharging", "impact": 0.45, "level": "warning"},
        {"battery_temp": 28.0, "ambient_temp": 24.0, "device_state": "idle", "impact": 0.15, "level": "safe"},
    ]
    
    for test in test_cases:
        print(f"\nTest Case: {test['level'].upper()}")
        print(f"Battery: {test['battery_temp']}°C, Ambient: {test['ambient_temp']}°C, State: {test['device_state']}")
        
        result = generate_gemini_advice(
            test['battery_temp'],
            test['ambient_temp'],
            test['device_state'],
            test['impact'],
            test['level']
        )
        
        print(f"Tip: {result['natural_language_tip']}")
        if result['optional_action']:
            print(f"Action: {result['optional_action']}")
        print("-" * 50)