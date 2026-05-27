variable "namespace" {
  type        = string
  description = "Kubernetes namespace for PIXIT resources"
  default     = "pixit"
}

variable "backend_replicas" {
  type        = number
  description = "Number of FastAPI backend pod replicas"
  default     = 3
}

variable "postgres_db" {
  type        = string
  description = "PostgreSQL database name"
  default     = "pixit_db"
}

variable "postgres_user" {
  type        = string
  description = "PostgreSQL user"
  default     = "pixit_user"
}

variable "postgres_password" {
  type        = string
  description = "PostgreSQL password"
  sensitive   = true
  default     = "pixit_password"
}
