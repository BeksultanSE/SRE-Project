variable "project_id" {
  description = "The ID of the GCP project"
}

variable "instance_group" {
  description = "The ID of the instance group"
}

resource "google_compute_health_check" "app_health" {
  name               = "sre-app-health-check"
  project            = var.project_id
  http_health_check {
    port         = 5000
    request_path = "/health"
  }
}

resource "google_compute_backend_service" "app_backend" {
  name          = "sre-app-backend"
  project       = var.project_id
  health_checks = [google_compute_health_check.app_health.id]
  backend {
    group = var.instance_group
  }
}

resource "google_compute_url_map" "app_url_map" {
  name            = "sre-app-url-map"
  project         = var.project_id
  default_service = google_compute_backend_service.app_backend.id
}

resource "google_compute_target_http_proxy" "app_proxy" {
  name    = "sre-app-proxy"
  project = var.project_id
  url_map = google_compute_url_map.app_url_map.id
}

resource "google_compute_global_forwarding_rule" "app_forwarding_rule" {
  name       = "sre-app-forwarding-rule"
  project    = var.project_id
  target     = google_compute_target_http_proxy.app_proxy.id
  port_range = "80"
}

output "load_balancer_ip" {
  value = google_compute_global_forwarding_rule.app_forwarding_rule.ip_address
}