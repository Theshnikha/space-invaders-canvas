# ==============================================================================
# AWS Provider Configuration
# ==============================================================================
# Credentials are authenticated securely via:
# 1. AWS CLI named profile (~/.aws/credentials) configured via `aws configure`
# 2. Environment variables (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_REGION)
# 3. AWS IAM roles (when running inside AWS / CI-CD agents)
#
# DO NOT hard-code secret access keys or credentials anywhere in this codebase.
# ==============================================================================

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
