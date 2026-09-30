# ==============================================================================
# Terraform Variables for Space Invaders Infrastructure
# ==============================================================================

variable "aws_region" {
  type        = string
  description = "The AWS Region where all infrastructure resources will be created."
  default     = "us-east-1"
}

variable "project_name" {
  type        = string
  description = "Project name prefix applied to all AWS resource names and tags."
  default     = "space-invaders"
}

variable "environment" {
  type        = string
  description = "Target deployment environment (e.g., dev, staging, prod)."
  default     = "dev"
}

variable "vpc_cidr" {
  type        = string
  description = "IP CIDR block allocated for the custom VPC."
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type        = string
  description = "IP CIDR block allocated for the public subnet."
  default     = "10.0.1.0/24"
}

variable "availability_zone" {
  type        = string
  description = "AWS Availability Zone for the public subnet (e.g., us-east-1a)."
  default     = "us-east-1a"
}

variable "instance_type" {
  type        = string
  description = "EC2 instance size/type (t2.micro / t3.micro are AWS Free Tier eligible)."
  default     = "t2.micro"
}

variable "ami_id" {
  type        = string
  description = "Custom Amazon Linux AMI ID. If left empty (\"\"), Terraform automatically queries and selects the latest official Amazon Linux 2023 AMI."
  default     = ""
}

variable "key_name" {
  type        = string
  description = "Name of an existing EC2 Key Pair created in your AWS account for SSH access. Leave empty if no key is attached."
  default     = ""
}

variable "ssh_allowed_cidr" {
  type        = list(string)
  description = "List of IPv4 CIDR blocks permitted to SSH into EC2 instance on Port 22. Best practice: specify your personal public IP (e.g., [\"203.0.113.50/32\"])."
  default     = ["0.0.0.0/0"]
}
