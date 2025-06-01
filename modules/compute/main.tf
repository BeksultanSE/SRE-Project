variable "project_id" {
  description = "The ID of the GCP project"
}

variable "network" {
  description = "The self-link of the network"
}

variable "subnet_a" {
  description = "The self-link of subnet A"
}

variable "subnet_b" {
  description = "The self-link of subnet B"
}

resource "google_compute_instance_template" "app_template" {
  name_prefix  = "sre-app-template-"
  project      = var.project_id
  machine_type = "e2-medium"

  disk {
    source_image = "debian-cloud/debian-11"
    auto_delete  = true
    boot         = true
  }

  network_interface {
    network    = var.network
    subnetwork = var.subnet_a
    access_config {}
  }

  tags = ["http-server"]

  service_account {
    email  = "sre-project-1@spry-blade-461310-v2.iam.gserviceaccount.com"
    scopes = ["https://www.googleapis.com/auth/cloud-platform"]
  }

  metadata_startup_script = <<SCRIPT
#!/bin/bash
apt-get update
apt-get install -y nodejs npm google-cloud-sdk
export JWT_SECRET=$(gcloud secrets versions access latest --secret=jwt-secret)
export JWT_REFRESH_SECRET=$(gcloud secrets versions access latest --secret=jwt-refresh-secret)
export MongoDbCollection_CONNECTION_URL=$(gcloud secrets versions access latest --secret=mongodb-connection)
export PORT=$(gcloud secrets versions access latest --secret=port)
export SMTP_HOST=$(gcloud secrets versions access latest --secret=smtp-host)
export SMTP_PORT=$(gcloud secrets versions access latest --secret=smtp-port)
export SMTP_USER=$(gcloud secrets versions access latest --secret=smtp-user)
export SMTP_PASSWORD=$(gcloud secrets versions access latest --secret=smtp-password)
export API_URL=$(gcloud secrets versions access latest --secret=api-url)
git clone https://github.com/BeksultanSE/SRE-Project.git /home/nodejs/app
cd /home/nodejs/app
npm install
nohup npm start > app.log 2>&1 &
SCRIPT
}

resource "google_compute_instance_group_manager" "app_group" {
  name               = "sre-app-group"
  project            = var.project_id
  zone               = "us-central1-a"
  base_instance_name = "sre-app"
  target_size        = 2

  version {
    instance_template = google_compute_instance_template.app_template.id
  }
}

resource "google_compute_autoscaler" "app_autoscaler" {
  name    = "sre-app-autoscaler"
  project = var.project_id
  zone    = "us-central1-a"
  target  = google_compute_instance_group_manager.app_group.id

  autoscaling_policy {
    max_replicas    = 5
    min_replicas    = 2
    cpu_utilization {
      target = 0.6
    }
  }
}

output "instance_group_manager" {
  value = google_compute_instance_group_manager.app_group.id
}