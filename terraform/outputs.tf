# ==============================================================================
# Terraform Outputs for Space Invaders Infrastructure
# ==============================================================================

output "vpc_id" {
  description = "The ID of the custom Space Invaders VPC."
  value       = aws_vpc.space_invaders_vpc.id
}

output "subnet_id" {
  description = "The ID of the public subnet hosting the EC2 instance."
  value       = aws_subnet.space_invaders_public_subnet.id
}

output "security_group_id" {
  description = "The ID of the security group attached to the EC2 instance."
  value       = aws_security_group.space_invaders_sg.id
}

output "ec2_instance_id" {
  description = "The unique instance ID of the Space Invaders EC2 host."
  value       = aws_instance.space_invaders_ec2.id
}

output "ec2_public_ip" {
  description = "The public IPv4 address assigned to the Space Invaders EC2 host."
  value       = aws_instance.space_invaders_ec2.public_ip
}

output "ec2_public_dns" {
  description = "The public DNS hostname assigned to the Space Invaders EC2 host."
  value       = aws_instance.space_invaders_ec2.public_dns
}

output "application_url" {
  description = "Direct HTTP access URL to the Space Invaders web application once deployed."
  value       = "http://${aws_instance.space_invaders_ec2.public_ip}:8080"
}
