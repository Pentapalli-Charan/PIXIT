output "frontend_url" {
  value       = "http://localhost:30001"
  description = "Access URL for the React frontend application"
}

output "backend_api_url" {
  value       = "http://localhost:30002"
  description = "Access URL for the Nginx Backend Load Balancer API"
}

output "prometheus_url" {
  value       = "http://localhost:30003"
  description = "Access URL for the Prometheus monitoring server"
}

output "grafana_url" {
  value       = "http://localhost:30004"
  description = "Access URL for the Grafana dashboard server"
}
