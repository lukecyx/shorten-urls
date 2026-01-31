resource "aws_dynamodb_table" "urls_table" {
  name           = "urls"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "shortUrl"

  attribute {
    name = "shortUrl"
    type = "S"
  }

  tags = {
    Environment = var.env
    Project     = var.project
  }
}

resource "aws_dynamodb_table" "url_counter" {
  name           = "url_counter"
  billing_mode   = "PROVISIONED"
  read_capacity  = 1
  write_capacity = 1
  hash_key       = "counter_id"

  attribute {
    name = "counter_id"
    type = "S"
  }

  tags = {
    Environment = var.env
    Project     = var.project
  }
}

resource "aws_dynamodb_table_item" "initial_counter" {
  table_name = aws_dynamodb_table.url_counter.name
  hash_key   = "counter_id"

  item = jsonencode({
    counter_id = { "S" = "global" }
    url_count  = { "N" = "0" }
  })
}
