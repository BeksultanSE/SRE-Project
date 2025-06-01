variable "project_id" {
  description = "The ID of the GCP project"
}

resource "google_compute_network" "vpc_network" {
  name                    = "sre-vpc"
  project                 = var.project_id
  auto_create_subnetworks = false
}

resource "google_compute_subnetwork" "subnet_a" {
  name          = "sre-subnet-a"
  project       = var.project_id
  network       = google_compute_network.vpc_network.id
  ip_cidr_range = "10.0.1.0/24"
  region        = "us-central1"
}

resource "google_compute_subnetwork" "subnet_b" {
  name          = "sre-subnet-b"
  project       = var.project_id
  network       = google_compute_network.vpc_network.id
  ip_cidr_range = "10.0.2.0/24"
  region        = "us-central1"
}

resource "google_compute_firewall" "http" {
  name    = "allow-http"
  project = var.project_id
  network = google_compute_network.vpc_network.name
  allow {
    protocol = "tcp"
    ports    = ["5000"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server"]
}

resource "google_compute_firewall" "ssh" {
  name    = "allow-ssh"
  project = var.project_id
  network = google_compute_network.vpc_network.name
  allow {
    protocol = "tcp"
    ports    = ["22"]
  }
  source_ranges = ["0.0.0.0/0"]
  target_tags   = ["http-server"]
}

output "network_self_link" {
  value = google_compute_network.vpc_network.self_link
}

output "subnet_a_self_link" {
  value = google_compute_subnetwork.subnet_a.self_link
}

output "subnet_b_self_link" {
  value = google_compute_subnetwork.subnet_b.self_link
}