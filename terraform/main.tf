# ==============================================================================
# Space Invaders Infrastructure - Main Resources
# ==============================================================================

# ------------------------------------------------------------------------------
# 1. AMI Data Source (Latest Amazon Linux 2023)
# Used automatically if var.ami_id is not explicitly specified.
# ------------------------------------------------------------------------------
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }
}

# ------------------------------------------------------------------------------
# 2. Virtual Private Cloud (VPC)
# Provides an isolated virtual network dedicated to the Space Invaders project.
# ------------------------------------------------------------------------------
resource "aws_vpc" "space_invaders_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-vpc"
  }
}

# ------------------------------------------------------------------------------
# 3. Internet Gateway (IGW)
# Enables communication between the VPC and the outside internet.
# ------------------------------------------------------------------------------
resource "aws_internet_gateway" "space_invaders_igw" {
  vpc_id = aws_vpc.space_invaders_vpc.id

  tags = {
    Name = "${var.project_name}-igw"
  }
}

# ------------------------------------------------------------------------------
# 4. Public Subnet
# Network segment where public-facing compute instances reside.
# ------------------------------------------------------------------------------
resource "aws_subnet" "space_invaders_public_subnet" {
  vpc_id                  = aws_vpc.space_invaders_vpc.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet"
  }
}

# ------------------------------------------------------------------------------
# 5. Route Table & Default Route
# Routes all outbound traffic (0.0.0.0/0) through the Internet Gateway.
# ------------------------------------------------------------------------------
resource "aws_route_table" "space_invaders_public_rt" {
  vpc_id = aws_vpc.space_invaders_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.space_invaders_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-rt"
  }
}

# ------------------------------------------------------------------------------
# 6. Route Table Association
# Binds the public subnet to the public route table.
# ------------------------------------------------------------------------------
resource "aws_route_table_association" "space_invaders_public_assoc" {
  subnet_id      = aws_subnet.space_invaders_public_subnet.id
  route_table_id = aws_route_table.space_invaders_public_rt.id
}

# ------------------------------------------------------------------------------
# 7. Security Group
# Acts as a virtual firewall controlling inbound and outbound traffic.
# ------------------------------------------------------------------------------
resource "aws_security_group" "space_invaders_sg" {
  name        = "${var.project_name}-sg"
  description = "Security group for Space Invaders EC2 host"
  vpc_id      = aws_vpc.space_invaders_vpc.id

  # Inbound Rule 1: SSH (Port 22) for administration
  ingress {
    description = "SSH access from configured CIDRs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.ssh_allowed_cidr
  }

  # Inbound Rule 2: HTTP (Port 80) for Nginx web server
  ingress {
    description = "HTTP web traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Inbound Rule 3: App Port (8080) for alternative application access
  ingress {
    description = "Application port 8080 traffic"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  # Outbound Rule: Allow all egress traffic (needed for package installation & updates)
  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-sg"
  }
}

# ------------------------------------------------------------------------------
# 8. EC2 Instance
# Low-cost virtual machine instance running Amazon Linux 2023.
# ------------------------------------------------------------------------------
resource "aws_instance" "space_invaders_ec2" {
  ami                         = var.ami_id != "" ? var.ami_id : data.aws_ami.amazon_linux_2023.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.space_invaders_public_subnet.id
  vpc_security_group_ids      = [aws_security_group.space_invaders_sg.id]
  key_name                    = var.key_name != "" ? var.key_name : null
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    delete_on_termination = true
    encrypted             = true

    tags = {
      Name = "${var.project_name}-root-volume"
    }
  }

  # User data bootstrap script: Pre-installs Docker and prepares the host
  user_data = <<-EOF
              #!/bin/bash
              set -e
              dnf update -y
              dnf install -y docker git
              systemctl enable --now docker
              usermod -aG docker ec2-user
              echo "Space Invaders EC2 host initialized successfully." > /tmp/bootstrap.log
              EOF

  tags = {
    Name = "${var.project_name}-ec2-host"
  }
}
