terraform {
  backend "gcs" {
    bucket = "sre-project-terraform-state"
    prefix = "terraform/state"
  }
}