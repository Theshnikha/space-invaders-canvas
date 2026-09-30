# Space Invaders Canvas Game — Production DevOps Pipeline

A retro arcade **Space Invaders** game built with HTML5 Canvas, Vanilla JavaScript, and Nginx — packaged as a Docker container and deployed through a complete production-grade DevOps pipeline.

---

## 🎮 Live Architecture

```
GitHub (Source Control)
   ↓
Jenkins CI/CD (10-Stage Pipeline)
   ↓
Node.js Tests (32 Automated Unit Tests)
   ↓
Docker Build (Nginx Alpine ~73 MB)
   ↓
DockerHub (Image Registry)
   ↓
Terraform (AWS VPC + EC2 Infrastructure)
   ↓
Ansible (Host Configuration + Deployment)
   ↓
Kubernetes (Container Orchestration)
   ↓
Space Invaders — Live & Accessible
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Application** | HTML5 Canvas, CSS3, Vanilla JavaScript |
| **Web Server** | Nginx 1.27 Alpine |
| **Containerization** | Docker 29.8.1 |
| **Image Registry** | DockerHub |
| **CI/CD** | Jenkins 2.568.3 (Declarative Pipeline) |
| **Testing** | Node.js Native Test Runner (32 tests) |
| **Infrastructure** | Terraform 1.16.2 + AWS |
| **Configuration** | Ansible |
| **Orchestration** | Kubernetes |
| **Version Control** | GitHub |
| **OS** | Amazon Linux 2023 (EC2) |

---

## 🚀 Quick Start — Local Development

```bash
# Clone the repository
git clone https://github.com/Theshnikha/space-invaders-canvas.git
cd space-invaders-canvas

# Run the unit tests (32 tests, no external dependencies)
npm install
npm test

# Build and run with Docker
docker build -t space-invaders:1.0 .
docker run -d --name space-invaders -p 8080:80 space-invaders:1.0

# Open the game
start http://localhost:8080
```

---

## 🧪 Testing

### Unit Tests (32 tests)
```bash
npm test
```

Tests cover:
- Player movement and boundary clamping (6)
- Bullet creation, cooldown, projectile mechanics (5)
- Alien fleet formation and march acceleration (5)
- AABB collision detection and bunker erosion (4)
- Score calculation per alien species and UFO bonus (4)
- Player lives, damage states, invulnerability frames (3)
- Game Over triggers and invasion detection (3)
- Level and wave progression (2)

---

## 🐳 Docker

### Build Image
```bash
docker build -t space-invaders:1.0 .
```

### Run Container
```bash
docker run -d --name space-invaders -p 8080:80 space-invaders:1.0
```

### Verify
- Game: http://localhost:8080
- Health: http://localhost:8080/healthz (returns `healthy`)

### Stop and Remove
```bash
docker stop space-invaders
docker rm space-invaders
```

---

## 🐋 DockerHub

The Jenkins pipeline automatically pushes the image to DockerHub after a successful build.

### Pull the Latest Image
```bash
docker pull theshnikha/space-invaders:latest
```

### Jenkins DockerHub Credential Setup (Required Once)
1. Go to **Jenkins → Manage Jenkins → Credentials → Global**
2. Click **Add Credentials**
3. Kind: **Username with password**
4. Username: your DockerHub username
5. Password: your DockerHub Access Token *(not your password)*
6. ID: **`dockerhub-credentials`** (must match exactly)

> [!CAUTION]
> Never put DockerHub passwords or tokens in the `Jenkinsfile`, `.env`, or any Git-tracked file.

---

## 🔧 Jenkins CI/CD Pipeline

### 10-Stage Pipeline

| # | Stage | Description |
| :- | :--- | :--- |
| 1 | **Checkout** | Clones latest code from GitHub `main` branch |
| 2 | **Environment Check** | Verifies Node, NPM, Git, Java, Docker versions |
| 3 | **Install Dependencies** | Runs `npm ci` or `npm install` |
| 4 | **Run Automated Tests** | Executes all 32 unit tests |
| 5 | **Syntax Validation** | `node --check` on all JS files |
| 6 | **Docker Image Build** | Builds `theshnikha/space-invaders:BUILD_NUMBER` |
| 7 | **Docker Image Verification** | Confirms image exists in local Docker |
| 8 | **DockerHub Push** | Pushes `:BUILD_NUMBER` and `:latest` tags |
| 9 | **Kubernetes Manifest Validation** | Validates K8s YAML manifests |
| 10 | **Container Health Check** | Spins up container, hits `/healthz`, cleans up |

### Jenkins URL
http://localhost:8081

---

## 🏗️ Terraform — AWS Infrastructure

### Prerequisites
- Terraform v1.16.2+ installed
- AWS CLI v2 installed and configured
- AWS IAM credentials with EC2, VPC permissions

### Resources Provisioned
- VPC (`10.0.0.0/16`)
- Public Subnet (`10.0.1.0/24`)
- Internet Gateway
- Route Table + Association
- Security Group (Ports: 22, 80, 8080)
- EC2 Instance (`t2.micro` — Free Tier eligible, Amazon Linux 2023, Docker pre-installed)

### Setup
```bash
cd terraform

# Copy and configure variables
copy terraform.tfvars.example terraform.tfvars
# Edit terraform.tfvars with your values (no credentials!)

# Configure AWS credentials securely (NOT in project files)
aws configure

# Initialize and validate
terraform init
terraform fmt
terraform validate

# Preview the plan (READ-ONLY — no resources created)
terraform plan

# Apply infrastructure (only after reviewing the plan)
# terraform apply

# Clean up all resources when finished
# terraform destroy
```

> [!IMPORTANT]
> Never put AWS Access Keys inside any `.tf` file. Use `aws configure` or environment variables.

---

## 🔧 Ansible — Host Configuration & Deployment

### Prerequisites
- Ansible installed: `pip install ansible`
- EC2 instance running (from `terraform apply`)
- EC2 SSH key pair `.pem` file available locally

### Configure Inventory
1. Get EC2 public IP: `terraform -chdir=terraform output ec2_public_ip`
2. Edit `ansible/inventory/hosts.ini`:
   ```ini
   ec2_host ansible_host=<EC2_PUBLIC_IP>
   ansible_ssh_private_key_file=/path/to/your-key.pem
   ```

### Run Playbooks
```bash
cd ansible

# Step 1: Configure EC2 with Docker
ansible-playbook -i inventory/hosts.ini playbooks/01-setup-host.yml

# Step 2: Deploy the application
ansible-playbook -i inventory/hosts.ini playbooks/02-deploy-app.yml

# Step 3: Verify deployment
ansible-playbook -i inventory/hosts.ini playbooks/03-verify-deployment.yml
```

---

## ☸️ Kubernetes — Container Orchestration

### Manifests in `k8s/`

| File | Resource |
| :--- | :--- |
| `namespace.yaml` | `space-invaders` Namespace |
| `configmap.yaml` | Non-sensitive app configuration |
| `deployment.yaml` | 2 replicas, rolling update, liveness/readiness probes |
| `service.yaml` | NodePort on `30080` |
| `ingress.yaml` | HTTP routing (requires Ingress Controller) |

### Before Applying
1. Replace `YOUR_DOCKERHUB_USERNAME` in `k8s/deployment.yaml` with your DockerHub username.
2. Ensure the image has been pushed to DockerHub by the Jenkins pipeline.

### Apply Manifests
```bash
# Apply all manifests
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/service.yaml

# Optional: Ingress (requires nginx-ingress-controller)
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl rollout status deployment/space-invaders -n space-invaders

# Get pods
kubectl get pods -n space-invaders

# Get service
kubectl get svc -n space-invaders
```

---

## 🔒 Security

| Practice | Implementation |
| :--- | :--- |
| No hardcoded secrets | All credentials via Jenkins Credentials / `aws configure` |
| Git protection | `.gitignore` prevents committing `terraform.tfvars`, `.pem`, `.env` |
| Docker protection | `.dockerignore` excludes Terraform, tests, CI files from image |
| Security Headers | Nginx returns `X-Frame-Options`, `X-XSS-Protection`, `X-Content-Type-Options` |
| SSH restriction | Security Group SSH CIDR configurable via Terraform variable |
| Container health | HEALTHCHECK in Dockerfile + K8s liveness/readiness probes |
| Encrypted EBS | EC2 root volume encrypted by default (`encrypted = true`) |

---

## 🧹 Cleanup

### Stop Local Docker Container
```bash
docker stop space-invaders
docker rm space-invaders
```

### Destroy AWS Infrastructure (After Testing)
```bash
cd terraform
terraform destroy
```
Type `yes` when prompted. All 7 AWS resources will be cleanly removed.

### Remove Kubernetes Resources
```bash
kubectl delete namespace space-invaders
```

---

## 🔍 Troubleshooting

| Problem | Solution |
| :--- | :--- |
| Jenkins `pipeline` DSL not found | Restart Jenkins to reload Declarative Pipeline plugins |
| Docker build fails | Verify Docker Desktop is running |
| `docker push` 401 Unauthorized | Add `dockerhub-credentials` in Jenkins Credentials |
| `terraform plan` no credentials | Run `aws configure` in your terminal |
| Ansible SSH timeout | Check EC2 security group allows port 22 from your IP |
| K8s pod CrashLoopBackOff | Run `kubectl logs <pod> -n space-invaders` |
| Container unhealthy | Hit `http://localhost:8080/healthz` to check Nginx |
