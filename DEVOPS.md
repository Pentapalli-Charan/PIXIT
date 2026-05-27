# PIXIT DevOps Orchestration: Kubernetes & Terraform Setup

This guide documents the local Kubernetes orchestration and Terraform infrastructure layer added to **PIXIT** for demonstration, scalability testing, and viva preparation. 

*Important Note: This setup acts as a local demonstration layer and does not disrupt or replace the existing production Docker Compose / Render deployment workflows.*

---

## 🏛️ Architecture Overview

The local DevOps setup relies on a containerized multi-node Kubernetes cluster (Kind) managed through Terraform, using Nginx as an internal Layer 7 load balancer to distribute traffic across FastAPI replica pods.

```mermaid
graph TD
    Client[Client Browser / Tool]
    
    subgraph Kind Kubernetes Cluster (pixit-k8s)
        subgraph Networking & Gateway
            NginxLB[Nginx Load Balancer Pod<br/>NodePort: 30002]
            FrontendPod[Frontend React Pod<br/>NodePort: 30001]
        end
        
        subgraph Application Services
            BackendSVC[Backend Service<br/>ClusterIP: 8000]
            Backend1[FastAPI Pod Replica 1]
            Backend2[FastAPI Pod Replica 2]
            Backend3[FastAPI Pod Replica 3]
        end
        
        subgraph Database Layer
            PostgresSVC[PostgreSQL Service<br/>ClusterIP: 5432]
            PostgresPod[PostgreSQL Pod]
        end
        
        subgraph Monitoring Stack
            Prometheus[Prometheus Pod<br/>NodePort: 30003]
            Grafana[Grafana Pod<br/>NodePort: 30004]
        end
    end

    Client -->|Port 30001| FrontendPod
    Client -->|Port 30002| NginxLB
    Client -->|Port 30003| Prometheus
    Client -->|Port 30004| Grafana
    
    NginxLB -->|Proxy Pass| BackendSVC
    BackendSVC -->|kube-proxy Load Balancing| Backend1
    BackendSVC -->|kube-proxy Load Balancing| Backend2
    BackendSVC -->|kube-proxy Load Balancing| Backend3
    
    Backend1 & Backend2 & Backend3 -->|SQL Connections| PostgresSVC
    PostgresSVC --> PostgresPod
    
    Prometheus -->|Scrape /metrics| Backend1 & Backend2 & Backend3
    Grafana -->|Query Datasource| Prometheus
```

---

## 🌐 Dynamic Load Balancing & Routing Flow

1. **Client Request**: The client requests the FastAPI backend through `http://localhost:30002/health/`.
2. **Gateway (Nginx)**: The request lands on the Nginx Load Balancer Pod (listening on NodePort `30002`).
3. **Internal Routing**: Nginx forwards the request to the upstream target `backend-service:8000`.
4. **Kubernetes Service Distribution**: The `backend-service` (ClusterIP) distributes traffic across the three FastAPI replica pods using `iptables` rules managed by `kube-proxy`.
5. **Dynamic Identification**: Each FastAPI pod determines its unique pod name using the Kubernetes Downward API (`metadata.name` bound to `INSTANCE_NAME`) and returns it in the `X-Backend-Server` header.
6. **Persistence & Database**: The pods establish safe connections to PostgreSQL using the internal service name `postgres-service:5432`.

---

## 📈 Monitoring Stack

- **Metrics Collection**: The FastAPI backend exposes Prometheus-compatible metrics on the `/metrics` endpoint using `prometheus_client`.
- **Auto-Discovery (Prometheus)**: Prometheus runs with a `ServiceAccount` and a `ClusterRole` permissions to query the Kubernetes API. It dynamically auto-discovers backing backend pods labeled `app=backend` and scrapes their statistics.
- **Pre-provisioned Dashboards (Grafana)**: Grafana starts with preloaded datasource connections pointing to Prometheus (`http://prometheus-service:9090`) and loads a custom system health dashboard (`PIXIT System Monitor`) immediately showing per-replica RAM, CPU, request rates, latency (p50/p90/p95/p99), and HTTP status rates.

---

## ⚙️ Quick Start Guide

### 1. Prerequisites
Ensure you have the following binaries installed and added to your `PATH` (precompiled `kind.exe` and `terraform.exe` are located under `devops_tools/`):
- Docker Desktop
- Kind (Kubernetes in Docker)
- Terraform (v1.8.0+)
- Kubectl

---

### 2. Kind Cluster Initialization
Create the Kind cluster with custom port mappings for the NodePorts:

```powershell
# Create Kind cluster using the configuration file
kind create cluster --config kind-config.yaml --name pixit-k8s
```

---

### 3. Build & Load Local Images
Build the fresh frontend and backend Docker images containing the dynamic metadata headers and load them directly into the Kind cluster:

```powershell
# Build images
docker build -t pixit-backend:latest ./fastapi_backend
docker build -t pixit-frontend:latest ./frontend

# Load images into the Kind cluster
kind load docker-image pixit-backend:latest --name pixit-k8s
kind load docker-image pixit-frontend:latest --name pixit-k8s
```

---

### 4. Deploy via Terraform
Navigate to the `terraform/` folder and deploy the entire Kubernetes infrastructure:

```powershell
cd terraform

# Initialize providers
terraform init

# Apply the infrastructure configuration
terraform apply -auto-approve
```

---

### 5. Verify & Access Services
Once deployed, verify that the resources are running:

```powershell
# Check running pods in the pixit namespace
kubectl get pods -n pixit
```

#### Endpoints:
- **Frontend App**: [http://localhost:30001](http://localhost:30001)
- **API Gateway (Nginx)**: [http://localhost:30002/health/](http://localhost:30002/health/)
- **Prometheus UI**: [http://localhost:30003](http://localhost:30003)
- **Grafana UI**: [http://localhost:30004/d/pixit-system-monitor/pixit-system-monitor?orgId=1](http://localhost:30004/d/pixit-system-monitor/pixit-system-monitor?orgId=1) *(Login using `admin` / `admin`, then click 'Skip' when prompted to change password)*

---

### 6. Clean Up
To tear down the infrastructure and remove the Kind cluster:

```powershell
# Destroy Terraform resources
cd terraform
terraform destroy -auto-approve

# Delete Kind cluster
kind delete cluster --name pixit-k8s
```
