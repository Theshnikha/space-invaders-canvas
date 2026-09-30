# ==============================================================================
# Ansible README - Space Invaders DevOps Project
# ==============================================================================

## Overview

This Ansible configuration automates the deployment and management of the Space Invaders Canvas Game on an AWS EC2 instance after Terraform provisions the infrastructure.

## Directory Structure

```
ansible/
├── ansible.cfg                         # Ansible default settings
├── inventory/
│   ├── hosts.ini                       # EC2 host inventory (configure after terraform apply)
│   └── group_vars/
│       └── all.yml                     # Global variables (non-sensitive)
└── playbooks/
    ├── 01-setup-host.yml              # Install Docker, Git on EC2
    ├── 02-deploy-app.yml              # Pull image from DockerHub and run container
    └── 03-verify-deployment.yml       # Verify application is healthy
```

## Prerequisites

1. **Ansible installed** on your local machine:
   ```bash
   pip install ansible
   # or
   pip3 install ansible
   ```

2. **EC2 instance running** (provisioned via `terraform apply`).

3. **EC2 public IP** collected from Terraform outputs:
   ```bash
   terraform -chdir=terraform output ec2_public_ip
   ```

4. **EC2 SSH Key Pair** (.pem file) downloaded from AWS Console.

## Configuration

### Step 1: Update Inventory with EC2 IP
Open `inventory/hosts.ini` and replace the placeholder values:
```ini
ec2_host ansible_host=<YOUR_EC2_PUBLIC_IP>   # From: terraform output ec2_public_ip
```
```ini
ansible_ssh_private_key_file=/full/path/to/your-key.pem
```

> [!IMPORTANT]
> **Never commit your actual EC2 IP or SSH key path to Git if they are sensitive.**

### Step 2: Update DockerHub Image in group_vars
Open `inventory/group_vars/all.yml` and set:
```yaml
docker_image: "YOUR_DOCKERHUB_USERNAME/space-invaders"
```

### Step 3: Secure the SSH Key
```bash
chmod 400 /path/to/your-key.pem
```

## Running the Playbooks

Run from the `ansible/` directory:

```bash
# Step 1: Configure EC2 host with Docker
ansible-playbook -i inventory/hosts.ini playbooks/01-setup-host.yml

# Step 2: Deploy the Space Invaders container
ansible-playbook -i inventory/hosts.ini playbooks/02-deploy-app.yml

# Step 3: Verify deployment is healthy
ansible-playbook -i inventory/hosts.ini playbooks/03-verify-deployment.yml

# Deploy a specific image tag
ansible-playbook -i inventory/hosts.ini playbooks/02-deploy-app.yml -e "image_tag=2.0"
```

## Security Notes

- ❌ **Never** put SSH private key content in any playbook or variable file.
- ❌ **Never** put DockerHub passwords in any playbook or variable file.
- ❌ **Never** put AWS credentials in any playbook or variable file.
- ✅ Use `ansible-vault` for sensitive variables if needed:
  ```bash
  ansible-vault create inventory/group_vars/vault.yml
  ```

## Troubleshooting

| Problem | Solution |
| :--- | :--- |
| SSH connection refused | Verify EC2 security group allows port 22 from your IP |
| Permission denied (publickey) | Check `ansible_ssh_private_key_file` path and `chmod 400` |
| Docker pull fails | Verify DockerHub image exists and is public |
| Container not starting | Check `docker logs space-invaders-container` on EC2 |
