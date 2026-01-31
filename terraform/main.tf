module "dynamodb" {
  source  = "./dynamodb"
  env     = var.env
  project = var.project
}
