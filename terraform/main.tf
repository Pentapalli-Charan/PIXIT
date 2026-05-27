resource "kubernetes_namespace" "pixit" {
  metadata {
    name = var.namespace
    labels = {
      app = "pixit"
    }
  }
}

# ----------------------------------------------------
# PostgreSQL Resources
# ----------------------------------------------------
resource "kubernetes_deployment" "postgres" {
  metadata {
    name      = "postgres"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "postgres"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "postgres"
      }
    }

    template {
      metadata {
        labels = {
          app = "postgres"
        }
      }

      spec {
        container {
          name  = "postgres"
          image = "postgres:15-alpine"

          port {
            container_port = 5432
            name           = "postgres"
          }

          env {
            name  = "POSTGRES_DB"
            value = var.postgres_db
          }

          env {
            name  = "POSTGRES_USER"
            value = var.postgres_user
          }

          env {
            name  = "POSTGRES_PASSWORD"
            value = var.postgres_password
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }

          liveness_probe {
            exec {
              command = ["pg_isready", "-U", var.postgres_user, "-d", var.postgres_db]
            }
            initial_delay_seconds = 15
            timeout_seconds       = 5
            period_seconds        = 10
          }

          readiness_probe {
            exec {
              command = ["pg_isready", "-U", var.postgres_user, "-d", var.postgres_db]
            }
            initial_delay_seconds = 10
            timeout_seconds       = 5
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "postgres_service" {
  metadata {
    name      = "postgres-service"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  spec {
    selector = {
      app = "postgres"
    }

    port {
      port        = 5432
      target_port = 5432
      name        = "postgres"
    }

    type = "ClusterIP"
  }
}

# ----------------------------------------------------
# Backend Resources
# ----------------------------------------------------
resource "kubernetes_deployment" "backend" {
  metadata {
    name      = "backend"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "backend"
    }
  }

  spec {
    replicas = var.backend_replicas
    selector {
      match_labels = {
        app = "backend"
      }
    }

    template {
      metadata {
        labels = {
          app = "backend"
        }
      }

      spec {
        container {
          name              = "backend"
          image             = "pixit-backend:latest"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 8000
            name           = "http"
          }

          env {
            name  = "SQLALCHEMY_DATABASE_URL"
            value = "postgresql://${var.postgres_user}:${var.postgres_password}@postgres-service:5432/${var.postgres_db}"
          }

          env {
            name  = "ALLOWED_ORIGINS"
            value = "[\"http://localhost:30001\", \"http://127.0.0.1:30001\", \"*\"]"
          }

          env {
            name = "INSTANCE_NAME"
            value_from {
              field_ref {
                field_path = "metadata.name"
              }
            }
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/health/"
              port = 8000
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/health/"
              port = 8000
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "backend_service" {
  metadata {
    name      = "backend-service"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "backend"
    }
  }

  spec {
    selector = {
      app = "backend"
    }

    port {
      port        = 8000
      target_port = 8000
      name        = "http"
    }

    type = "ClusterIP"
  }
}

# ----------------------------------------------------
# Nginx Load Balancer Resources
# ----------------------------------------------------
resource "kubernetes_config_map" "nginx_lb_config" {
  metadata {
    name      = "nginx-lb-config"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  data = {
    "nginx.conf" = <<EOF
user nginx;
worker_processes 1;
error_log /var/log/nginx/error.log info;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                      '$status $body_bytes_sent "$http_referer" '
                      '"$http_user_agent" "$http_x_forwarded_for" '
                      'upstream: $upstream_addr backend: $upstream_http_x_backend_server';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    keepalive_timeout 65;

    upstream backend_servers {
        server backend-service:8000;
    }

    server {
        listen 8000;
        server_name localhost;

        location / {
            proxy_pass http://backend_servers;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_next_upstream error timeout invalid_header http_500 http_502 http_503 http_504;
            proxy_next_upstream_tries 3;
            proxy_next_upstream_timeout 5s;
        }
    }
}
EOF
  }
}

resource "kubernetes_deployment" "nginx_lb" {
  metadata {
    name      = "nginx-lb"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "nginx-lb"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "nginx-lb"
      }
    }

    template {
      metadata {
        labels = {
          app = "nginx-lb"
        }
      }

      spec {
        container {
          name              = "nginx-lb"
          image             = "nginx:alpine"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 8000
            name           = "http"
          }

          volume_mount {
            name       = "config-volume"
            mount_path = "/etc/nginx/nginx.conf"
            sub_path   = "nginx.conf"
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "128Mi"
            }
          }
        }

        volume {
          name = "config-volume"
          config_map {
            name = kubernetes_config_map.nginx_lb_config.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "nginx_lb_service" {
  metadata {
    name      = "nginx-lb-service"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  spec {
    selector = {
      app = "nginx-lb"
    }

    port {
      port        = 8000
      target_port = 8000
      node_port   = 30002
      name        = "http"
    }

    type = "NodePort"
  }
}

# ----------------------------------------------------
# Frontend Resources
# ----------------------------------------------------
resource "kubernetes_deployment" "frontend" {
  metadata {
    name      = "frontend"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "frontend"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "frontend"
      }
    }

    template {
      metadata {
        labels = {
          app = "frontend"
        }
      }

      spec {
        container {
          name              = "frontend"
          image             = "pixit-frontend:latest"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 80
            name           = "http"
          }

          resources {
            requests = {
              cpu    = "50m"
              memory = "64Mi"
            }
            limits = {
              cpu    = "200m"
              memory = "128Mi"
            }
          }

          liveness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 15
            period_seconds        = 10
          }

          readiness_probe {
            http_get {
              path = "/"
              port = 80
            }
            initial_delay_seconds = 10
            period_seconds        = 10
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "frontend_service" {
  metadata {
    name      = "frontend-service"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  spec {
    selector = {
      app = "frontend"
    }

    port {
      port        = 80
      target_port = 80
      node_port   = 30001
      name        = "http"
    }

    type = "NodePort"
  }
}

# ----------------------------------------------------
# Monitoring Setup (Prometheus & Grafana)
# ----------------------------------------------------
resource "kubernetes_service_account" "prometheus" {
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }
}

resource "kubernetes_cluster_role" "prometheus" {
  metadata {
    name = "prometheus"
  }

  rule {
    api_groups = [""]
    resources  = ["nodes", "nodes/proxy", "services", "endpoints", "pods"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    api_groups = ["apps"]
    resources  = ["deployments"]
    verbs      = ["get", "list", "watch"]
  }

  rule {
    non_resource_urls = ["/metrics"]
    verbs             = ["get"]
  }
}

resource "kubernetes_cluster_role_binding" "prometheus" {
  metadata {
    name = "prometheus"
  }

  role_ref {
    api_group = "rbac.authorization.k8s.io"
    kind      = "ClusterRole"
    name      = kubernetes_cluster_role.prometheus.metadata[0].name
  }

  subject {
    kind      = "ServiceAccount"
    name      = kubernetes_service_account.prometheus.metadata[0].name
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }
}

resource "kubernetes_config_map" "prometheus_config" {
  metadata {
    name      = "prometheus-config"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  data = {
    "prometheus.yml" = <<EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'fastapi-backend-pods'
    kubernetes_sd_configs:
    - role: pod
    relabel_configs:
    - source_labels: [__meta_kubernetes_pod_label_app]
      action: keep
      regex: backend
    - source_labels: [__meta_kubernetes_pod_container_port_number]
      action: keep
      regex: "8000"
    - source_labels: [__meta_kubernetes_pod_name]
      target_label: instance
EOF
  }
}

resource "kubernetes_deployment" "prometheus" {
  metadata {
    name      = "prometheus"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "prometheus"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "prometheus"
      }
    }

    template {
      metadata {
        labels = {
          app = "prometheus"
        }
      }

      spec {
        service_account_name = kubernetes_service_account.prometheus.metadata[0].name

        container {
          name              = "prometheus"
          image             = "prom/prometheus:v2.45.0"
          image_pull_policy = "IfNotPresent"

          args = [
            "--config.file=/etc/prometheus/prometheus.yml",
            "--storage.tsdb.path=/prometheus"
          ]

          port {
            container_port = 9090
            name           = "http"
          }

          volume_mount {
            name       = "config-volume"
            mount_path = "/etc/prometheus"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }
        }

        volume {
          name = "config-volume"
          config_map {
            name = kubernetes_config_map.prometheus_config.metadata[0].name
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "prometheus_service" {
  metadata {
    name      = "prometheus-service"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  spec {
    selector = {
      app = "prometheus"
    }

    port {
      port        = 9090
      target_port = 9090
      node_port   = 30003
      name        = "http"
    }

    type = "NodePort"
  }
}

resource "kubernetes_config_map" "grafana_datasources" {
  metadata {
    name      = "grafana-datasources"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  data = {
    "datasource.yaml" = <<EOF
apiVersion: 1
datasources:
- name: Prometheus
  type: prometheus
  access: proxy
  url: http://prometheus-service:9090
  isDefault: true
EOF
  }
}

resource "kubernetes_config_map" "grafana_dashboards" {
  metadata {
    name      = "grafana-dashboards"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  data = {
    "dashboard.yaml" = <<EOF
apiVersion: 1
providers:
  - name: 'PIXIT Monitoring'
    orgId: 1
    folder: 'PIXIT'
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
EOF

    "pixit_dashboard.json" = <<EOF
{
  "annotations": {
    "list": [
      {
        "builtIn": 1,
        "datasource": {
          "type": "grafana",
          "uid": "-- Grafana --"
        },
        "enable": true,
        "hide": true,
        "name": "Annotations & Alerts",
        "type": "dashboard"
      }
    ]
  },
  "editable": true,
  "fiscalYearStartMonth": 0,
  "graphTooltip": 1,
  "id": null,
  "links": [],
  "liveNow": true,
  "panels": [
    {
      "id": 1,
      "title": "Monitoring Targets Status",
      "type": "stat",
      "gridPos": {
        "h": 4,
        "w": 6,
        "x": 0,
        "y": 0
      },
      "datasource": {
        "type": "prometheus",
        "uid": "Prometheus"
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "editorMode": "code",
          "expr": "up",
          "legendFormat": "{{job}}",
          "range": true,
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "mappings": [
            {
              "options": {
                "0": {
                  "color": "red",
                  "text": "DOWN"
                },
                "1": {
                  "color": "green",
                  "text": "UP"
                }
              },
              "type": "value"
            }
          ],
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "red",
                "value": null
              },
              {
                "color": "green",
                "value": 1
              }
            ]
          }
        }
      }
    },
    {
      "id": 2,
      "title": "API Request Rate (1m)",
      "type": "stat",
      "gridPos": {
        "h": 4,
        "w": 6,
        "x": 6,
        "y": 0
      },
      "datasource": {
        "type": "prometheus",
        "uid": "Prometheus"
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "editorMode": "code",
          "expr": "sum(rate(http_requests_total{job=\"fastapi-backend-pods\"}[1m]))",
          "legendFormat": "Requests/sec",
          "range": true,
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "reqps"
        }
      }
    },
    {
      "id": 3,
      "title": "API HTTP Error Rate (1m)",
      "type": "stat",
      "gridPos": {
        "h": 4,
        "w": 6,
        "x": 12,
        "y": 0
      },
      "datasource": {
        "type": "prometheus",
        "uid": "Prometheus"
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "editorMode": "code",
          "expr": "sum(rate(http_requests_total{status=~\"5..\", job=\"fastapi-backend-pods\"}[1m])) or vector(0)",
          "legendFormat": "Errors/sec",
          "range": true,
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "reqps",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "orange",
                "value": 0.1
              },
              {
                "color": "red",
                "value": 1.0
              }
            ]
          }
        }
      }
    },
    {
      "id": 4,
      "title": "API Latency p95 (1m)",
      "type": "stat",
      "gridPos": {
        "h": 4,
        "w": 6,
        "x": 18,
        "y": 0
      },
      "datasource": {
        "type": "prometheus",
        "uid": "Prometheus"
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "editorMode": "code",
          "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job=\"fastapi-backend-pods\"}[1m])) by (le))",
          "legendFormat": "Latency p95",
          "range": true,
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "unit": "s",
          "thresholds": {
            "mode": "absolute",
            "steps": [
              {
                "color": "green",
                "value": null
              },
              {
                "color": "orange",
                "value": 0.5
              },
              {
                "color": "red",
                "value": 2.0
              }
            ]
          }
        }
      }
    },
    {
      "id": 5,
      "title": "API HTTP Requests Traffic",
      "type": "timeseries",
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 0,
        "y": 4
      },
      "datasource": {
        "type": "prometheus",
        "uid": "Prometheus"
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "editorMode": "code",
          "expr": "sum(rate(http_requests_total{job=\"fastapi-backend-pods\"}[1m])) by (handler, status)",
          "legendFormat": "{{handler}} ({{status}})",
          "range": true,
          "refId": "A"
        }
      ],
      "fieldConfig": {
        "defaults": {
          "custom": {
            "drawStyle": "line",
            "lineInterpolation": "smooth"
          },
          "unit": "reqps"
        }
      }
    },
    {
      "id": 6,
      "title": "API Request Latency Percentiles",
      "type": "timeseries",
      "gridPos": {
        "h": 8,
        "w": 12,
        "x": 12,
        "y": 4
      },
      "datasource": {
        "type": "prometheus",
        "uid": "Prometheus"
      },
      "targets": [
        {
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "editorMode": "code",
          "expr": "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{job=\"fastapi-backend-pods\"}[1m])) by (le))",
          "legendFormat": "p50 (Median)",
          "range": true,
          "refId": "A"
            },
            {
              "datasource": {
                "type": "prometheus",
                "uid": "Prometheus"
              },
              "editorMode": "code",
              "expr": "histogram_quantile(0.90, sum(rate(http_request_duration_seconds_bucket{job=\"fastapi-backend-pods\"}[1m])) by (le))",
              "legendFormat": "p90",
              "range": true,
              "refId": "B"
            },
            {
              "datasource": {
                "type": "prometheus",
                "uid": "Prometheus"
              },
              "editorMode": "code",
              "expr": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job=\"fastapi-backend-pods\"}[1m])) by (le))",
              "legendFormat": "p95",
              "range": true,
              "refId": "C"
            },
            {
              "datasource": {
                "type": "prometheus",
                "uid": "Prometheus"
              },
              "editorMode": "code",
              "expr": "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{job=\"fastapi-backend-pods\"}[1m])) by (le))",
              "legendFormat": "p99",
              "range": true,
              "refId": "D"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "custom": {
                "drawStyle": "line",
                "lineInterpolation": "smooth"
              },
              "unit": "s"
            }
          }
        },
        {
          "id": 7,
          "title": "Backend Process Resource Usage",
          "type": "timeseries",
          "gridPos": {
            "h": 8,
            "w": 12,
            "x": 0,
            "y": 12
          },
          "datasource": {
            "type": "prometheus",
            "uid": "Prometheus"
          },
          "targets": [
            {
              "datasource": {
                "type": "prometheus",
                "uid": "Prometheus"
              },
              "editorMode": "code",
              "expr": "rate(process_cpu_seconds_total{job=\"fastapi-backend-pods\"}[1m]) * 100",
              "legendFormat": "{{instance}} CPU",
              "range": true,
              "refId": "A"
            },
            {
              "datasource": {
                "type": "prometheus",
                "uid": "Prometheus"
              },
              "editorMode": "code",
              "expr": "process_resident_memory_bytes{job=\"fastapi-backend-pods\"} / 1024 / 1024",
              "legendFormat": "{{instance}} Memory (MB)",
              "range": true,
              "refId": "B"
            }
          ],
          "fieldConfig": {
            "defaults": {
              "custom": {
                "drawStyle": "line",
                "lineInterpolation": "smooth"
              }
            }
          }
        }
      ],
      "schemaVersion": 38,
      "style": "dark",
      "tags": [
        "pixit",
        "monitoring"
      ],
      "templating": {
        "list": []
      },
      "time": {
        "from": "now-30m",
        "to": "now"
      },
      "timepicker": {},
      "timezone": "",
      "title": "PIXIT System Monitor",
      "uid": "pixit-system-monitor",
      "version": 2,
      "weekStart": ""
    }
EOF
  }
}

resource "kubernetes_deployment" "grafana" {
  metadata {
    name      = "grafana"
    namespace = kubernetes_namespace.pixit.metadata[0].name
    labels = {
      app = "grafana"
    }
  }

  spec {
    replicas = 1
    selector {
      match_labels = {
        app = "grafana"
      }
    }

    template {
      metadata {
        labels = {
          app = "grafana"
        }
      }

      spec {
        container {
          name              = "grafana"
          image             = "grafana/grafana:10.0.0"
          image_pull_policy = "IfNotPresent"

          port {
            container_port = 3000
            name           = "http"
          }

          env {
            name  = "GF_SECURITY_ADMIN_PASSWORD"
            value = "admin"
          }

          volume_mount {
            name       = "datasource-volume"
            mount_path = "/etc/grafana/provisioning/datasources"
          }

          volume_mount {
            name       = "dashboard-provider-volume"
            mount_path = "/etc/grafana/provisioning/dashboards"
          }

          volume_mount {
            name       = "dashboard-json-volume"
            mount_path = "/var/lib/grafana/dashboards"
          }

          resources {
            requests = {
              cpu    = "100m"
              memory = "128Mi"
            }
            limits = {
              cpu    = "500m"
              memory = "256Mi"
            }
          }
        }

        volume {
          name = "datasource-volume"
          config_map {
            name = kubernetes_config_map.grafana_datasources.metadata[0].name
          }
        }

        volume {
          name = "dashboard-provider-volume"
          config_map {
            name = kubernetes_config_map.grafana_dashboards.metadata[0].name
            items {
              key  = "dashboard.yaml"
              path = "dashboard.yaml"
            }
          }
        }

        volume {
          name = "dashboard-json-volume"
          config_map {
            name = kubernetes_config_map.grafana_dashboards.metadata[0].name
            items {
              key  = "pixit_dashboard.json"
              path = "pixit_dashboard.json"
            }
          }
        }
      }
    }
  }
}

resource "kubernetes_service" "grafana_service" {
  metadata {
    name      = "grafana-service"
    namespace = kubernetes_namespace.pixit.metadata[0].name
  }

  spec {
    selector = {
      app = "grafana"
    }

    port {
      port        = 3000
      target_port = 3000
      node_port   = 30004
      name        = "http"
    }

    type = "NodePort"
  }
}
