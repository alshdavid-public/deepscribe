terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  // Store state in S3
  backend "s3" {
    bucket         = "000-alshdavid-terraform-state"
    key            = "deepscribe/web/terraform.tfstate"
    region         = "ap-southeast-2"
    dynamodb_table = "000-alshdavid-terraform-state"
    encrypt        = true
  }
}

provider "aws" {
  region = "ap-southeast-2"
}