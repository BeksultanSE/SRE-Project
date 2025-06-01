provider "google" {
  project     = "spry-blade-461310-v2"
  region      = "us-central1"
  credentials = file("spry-blade-461310-v2-80196ff26fb2.json")
}

module "networking" {
  source     = "./modules/networking"
  project_id = "spry-blade-461310-v2"
}

module "compute" {
  source     = "./modules/compute"
  project_id = "spry-blade-461310-v2"
  network    = module.networking.network_self_link
  subnet_a   = module.networking.subnet_a_self_link
  subnet_b   = module.networking.subnet_b_self_link
}

module "load_balancer" {
  source         = "./modules/load_balancer"
  project_id     = "spry-blade-461310-v2"
  instance_group = module.compute.instance_group_manager
}