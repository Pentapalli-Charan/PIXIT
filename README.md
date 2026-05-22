# PIXIT: Multi-Service Dockerized Web Application

PIXIT is a dockerized multi-service web application featuring a React frontend, FastAPI backend, Jenkins local CI/CD pipelines, Prometheus and Grafana monitoring, and automated cloud deployments via GitHub Actions.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite, TailwindCSS) served via Nginx.
- **Backend:** FastAPI (Python 3.11) with SQLite.
- **CI/CD:** 
  - **Local:** Jenkins pipeline utilizing Docker-out-of-Docker (DooD).
  - **Cloud:** GitHub Actions automated builds pushing to Docker Hub.
- **Monitoring:** Prometheus metrics scraping and Grafana dashboard visualization.
- **Deployment:** Render cloud web services configured.

---

## 🚀 Getting Started

### Local Development
To run the full stack locally:
```bash
docker compose up --build
```
- **React Frontend:** `http://localhost:3000`
- **FastAPI Backend:** `http://localhost:8000`
- **Prometheus:** `http://localhost:9090`
- **Grafana:** `http://localhost:3001` (Credentials: `admin`/`admin`)

### Jenkins CI/CD (Local)
To spin up Jenkins locally to run verification pipelines:
```bash
docker compose -f docker-compose.jenkins.yml up --build -d
```
Access Jenkins at `http://localhost:8080`.

### GitHub Actions (Cloud Deployment)
GitHub Actions automatically builds and pushes the frontend and backend Docker images to Docker Hub on every push to the `main` branch. 
See `.github/workflows/docker-publish.yml` for configuration details.
