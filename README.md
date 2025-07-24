# ThermoSense 🌡️⚡

Cross‑platform battery–health dashboard powered by a Random‑Forest model, FastAPI, and a React front‑end.

| OS                | Back‑end runs | Sensor data available | Front‑end runs |
|-------------------|--------------|-----------------------|----------------|
| **macOS (Apple/Intel)** | **Native** (Python 3.11) | Battery °C (via `ioreg`), Thermal‑pressure (`powermetrics`) | Docker (Nginx) |
| **Windows 10/11** | **Native** (Python 3.11) | CPU package °C (via WMI) \* | Docker (Nginx) |

\* Install `wmi` for CPU‑temp, otherwise temperature charts fall back to ambient.

---

## 📂 Directory layout
```
thermosense/
├── backend/                    # FastAPI + ML + sensors
│   ├── app.py
│   ├── main.py
│   ├── system_stats.py
│   ├── requirements.txt
│   └── .env                    # <-- holds OPENWEATHER_API_KEY (git‑ignored)
└── docker/
    ├── client/                 # React + Nginx container
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   ├── .dockerignore
    │   └── src/…               # React source
    └── docker-compose.yml
```

---

## 🔑 Secrets

Create `backend/.env` (never commit it):

```env
OPENWEATHER_API_KEY=your_api_key
```

---

## 🛠️ Initial setup (once per machine)

#### macOS
```bash
# clone
git clone [https://github.com/](https://github.com/)<you>/thermosense.git
cd thermosense

# back‑end venv
python3 -m venv backend/.venv
source backend/.venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt

# Docker: build React image
cd docker
docker compose build
```

#### Windows
```powershell
# clone
git clone [https://github.com/](https://github.com/)<you>/thermosense.git
cd thermosense

# back‑end venv
python -m venv backend\.venv
.\backend\.venv\Scripts\Activate.ps1
pip install --upgrade pip
pip install -r backend\requirements.txt
pip install wmi            # optional CPU‑temp

# build React image
cd docker
docker compose build
```
---

## 🚀 Every‑day run

1.  **Start native FastAPI (Terminal 1)**
    * **macOS**
        ```bash
        cd backend
        source .venv/bin/activate
        sudo uvicorn app:app --host 0.0.0.0 --port 8000 --reload
        ```
    * **Windows** (no `sudo`)
        ```powershell
        cd backend
        .\.venv\Scripts\Activate.ps1
        uvicorn app:app --host 0.0.0.0 --port 8000 --reload
        ```

2.  **Start React container (Terminal 2)**
    ```bash
    cd docker
    docker compose up -d
    ```

3.  **Open the dashboard**
    Open your browser to `http://localhost:3000`

---

## 🛑 Stopping

* **Stop FastAPI:** Press `CTRL‑C` in Terminal 1.

* **Stop and remove container:**
    ```bash
    cd docker
    docker compose down
    ```
---

## 🐙 Git workflow
```bash
# if not already a repo
git init

# add important files to .gitignore
echo "backend/.env" >> .gitignore
echo "backend/.venv/" >> .gitignore
echo "docker/client/node_modules/" >> .gitignore
echo "docker/client/build/" >> .gitignore

# commit and push
git add .
git commit -m "Cross‑platform ThermoSense: native API, dockerised React"
git remote add origin [https://github.com/](https://github.com/)<you>/thermosense.git
git push -u origin main
```
---

## 📝 Notes
* **macOS** requires `sudo` for `powermetrics`. You can add a `NOPASSWD` line in `/etc/sudoers` for password‑less startup if desired.
* **Windows** CPU‑temp depends on motherboard sensors being exposed via WMI. If they're unsupported, the dashboard gracefully falls back to ambient temperature.
* The front‑end reads the `REACT_APP_API_ROOT` environment variable at build time. The `docker-compose.yml` file sets this to `http://localhost:8000`.

Enjoy your portable, sensor‑aware ThermoSense dashboard! 🚀