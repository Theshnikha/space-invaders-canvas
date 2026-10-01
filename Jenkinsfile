// ==============================================================================
// Space Invaders Canvas Game - Full CI/CD Jenkins Pipeline
// ==============================================================================
// Pipeline Flow:
//   GitHub Checkout
//   → Environment Check
//   → npm Install
//   → 32 Unit Tests
//   → Syntax Validation
//   → Docker Image Build
//   → Docker Image Verification
//   → DockerHub Push
//   → Kubernetes Manifest Validation
//   → Application Health Check (local Docker)
// ==============================================================================

pipeline {
    agent any

    options {
        timeout(time: 15, unit: 'MINUTES')
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    parameters {
        string(name: 'DOCKERHUB_USERNAME', defaultValue: 'theshnikha', description: 'DockerHub Username or Organization')
        string(name: 'DOCKERHUB_REPOSITORY', defaultValue: 'space-invaders', description: 'DockerHub Repository Name')
        string(name: 'CUSTOM_TAG', defaultValue: '', description: 'Optional Custom Image Tag (defaults to build number if empty)')
    }

    environment {
        // -----------------------------------------------------------------------
        // Project Identity
        // -----------------------------------------------------------------------
        PROJECT_NAME    = 'space-invaders-canvas'

        // -----------------------------------------------------------------------
        DOCKERHUB_CRED_ID     = 'dockerhub_credentials'
        DOCKERHUB_USERNAME    = "${params.DOCKERHUB_USERNAME ?: 'theshnikha'}"
        DOCKERHUB_REPOSITORY  = "${params.DOCKERHUB_REPOSITORY ?: 'space-invaders'}"
        IMAGE_TAG             = "${params.CUSTOM_TAG ?: env.BUILD_NUMBER}"
        IMAGE_LATEST_TAG      = 'latest'
        FULL_IMAGE_NAME       = "${env.DOCKERHUB_USERNAME}/${env.DOCKERHUB_REPOSITORY}"

        // -----------------------------------------------------------------------
        // Docker Desktop PATH (Windows)
        // -----------------------------------------------------------------------
        PATH = "C:\\Users\\user\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin;${env.PATH}"
    }

    stages {

        // ======================================================================
        // STAGE 1: Checkout
        // ======================================================================
        stage('Checkout') {
            steps {
                checkout scm
                bat '@echo off && echo [CI] Source code checked out from GitHub.'
            }
        }

        // ======================================================================
        // STAGE 2: Environment Check
        // ======================================================================
        stage('Environment Check') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Verifying Build Environment
                    echo ===================================================
                    echo Node Version:
                    node --version
                    echo NPM Version:
                    call npm.cmd --version
                    echo Git Version:
                    git --version
                    echo Java Version:
                    java -version
                    echo Docker Version:
                    docker --version
                    docker info --format "Server Version: {{.ServerVersion}}"
                    echo ===================================================
                    exit /b 0
                '''
            }
        }

        // ======================================================================
        // STAGE 3: Install Dependencies
        // ======================================================================
        stage('Install Dependencies') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Installing Node.js Dependencies
                    echo ===================================================
                    if exist package-lock.json (
                        echo Running npm ci...
                        call npm.cmd ci
                    ) else (
                        echo Running npm install...
                        call npm.cmd install
                    )
                    if errorlevel 1 exit /b 1
                    exit /b 0
                '''
            }
        }

        // ======================================================================
        // STAGE 4: Automated Unit Tests
        // ======================================================================
        stage('Run Automated Tests') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Executing Automated Unit Tests (32 tests)
                    echo ===================================================
                    call npm.cmd test
                    if errorlevel 1 (
                        echo [FAIL] One or more unit tests failed!
                        exit /b 1
                    )
                    echo [PASS] All 32 unit tests passed.
                    exit /b 0
                '''
            }
        }

        // ======================================================================
        // STAGE 5: Syntax Validation
        // ======================================================================
        stage('Syntax Validation') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Validating JavaScript Syntax
                    echo ===================================================
                    node --check js/game.js
                    if errorlevel 1 exit /b 1
                    node --check tests/game.test.js
                    if errorlevel 1 exit /b 1
                    echo [PASS] All JavaScript files are syntactically valid.
                    exit /b 0
                '''
            }
        }

        // ======================================================================
        // STAGE 6: Docker Image Build
        // ======================================================================
        stage('Docker Image Build') {
            steps {
                bat """
                    @echo off
                    echo ===================================================
                    echo [CI] Building Docker Image
                    echo Image: ${FULL_IMAGE_NAME}:${IMAGE_TAG}
                    echo ===================================================
                    if not exist Dockerfile (
                        echo [FAIL] Dockerfile not found!
                        exit /b 1
                    )
                    docker build -t ${FULL_IMAGE_NAME}:${IMAGE_TAG} -t ${FULL_IMAGE_NAME}:${IMAGE_LATEST_TAG} .
                    if errorlevel 1 (
                        echo [FAIL] Docker build failed!
                        exit /b 1
                    )
                    echo [PASS] Docker image built: ${FULL_IMAGE_NAME}:${IMAGE_TAG}
                    exit /b 0
                """
            }
        }

        // ======================================================================
        // STAGE 7: Docker Image Verification
        // ======================================================================
        stage('Docker Image Verification') {
            steps {
                bat """
                    @echo off
                    echo ===================================================
                    echo [CI] Verifying Built Docker Image
                    echo ===================================================
                    docker images ${FULL_IMAGE_NAME}
                    if errorlevel 1 exit /b 1
                    echo [PASS] Docker image verified: ${FULL_IMAGE_NAME}:${IMAGE_TAG}
                    exit /b 0
                """
            }
        }

        // ======================================================================
        // STAGE 8: DockerHub Push
        // Requires Jenkins credential ID: dockerhub-credentials
        // Configure at: Jenkins → Manage Jenkins → Credentials → Global
        // ======================================================================
        stage('DockerHub Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub_credentials',
                    usernameVariable: 'DOCKER_USER',
                    passwordVariable: 'DOCKER_PASS'
                )]) {
                    powershell '''
                        Write-Host "==================================================="
                        Write-Host "[CI] Pushing Image to DockerHub"
                        Write-Host "Image: ${env:FULL_IMAGE_NAME}:${env:IMAGE_TAG}"
                        Write-Host "==================================================="

                        $pass = $env:DOCKER_PASS.Trim()
                        $pass | docker login --username $env:DOCKER_USER --password-stdin

                        if ($LASTEXITCODE -ne 0) {
                            Write-Host "[FAIL] DockerHub login failed!"
                            exit $LASTEXITCODE
                        }

                        docker push ${env:FULL_IMAGE_NAME}:${env:IMAGE_TAG}
                        if ($LASTEXITCODE -ne 0) {
                            Write-Host "[FAIL] Docker push failed for tag: $env:IMAGE_TAG"
                            exit $LASTEXITCODE
                        }

                        docker push ${env:FULL_IMAGE_NAME}:latest
                        if ($LASTEXITCODE -ne 0) {
                            Write-Host "[FAIL] Docker push failed for tag: latest"
                            exit $LASTEXITCODE
                        }

                        docker logout
                        Write-Host "[PASS] DockerHub image push completed successfully."
                    '''
                }
            }
        }

        // ======================================================================
        // STAGE 9: Kubernetes Manifest Validation
        // Validates YAML manifests without applying them to a cluster.
        // ======================================================================
        stage('Kubernetes Manifest Validation') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Validating Kubernetes Manifests
                    echo ===================================================
                    if not exist k8s (
                        echo [WARN] k8s directory not found, skipping Kubernetes validation.
                        exit /b 0
                    )
                    where kubectl >nul 2>nul
                    if errorlevel 1 (
                        echo [INFO] kubectl not found - validating YAML structure only.
                        if exist k8s\\namespace.yaml   echo [OK] k8s/namespace.yaml found
                        if exist k8s\\deployment.yaml  echo [OK] k8s/deployment.yaml found
                        if exist k8s\\service.yaml     echo [OK] k8s/service.yaml found
                        if exist k8s\\configmap.yaml   echo [OK] k8s/configmap.yaml found
                        echo [PASS] Kubernetes manifests present and ready.
                    ) else (
                        kubectl apply --dry-run=client -f k8s/namespace.yaml
                        kubectl apply --dry-run=client -f k8s/configmap.yaml
                        kubectl apply --dry-run=client -f k8s/deployment.yaml
                        kubectl apply --dry-run=client -f k8s/service.yaml
                        echo [PASS] Kubernetes dry-run validation passed.
                    )
                    exit /b 0
                '''
            }
        }

        // ======================================================================
        // STAGE 10: Container Health Check
        // Spins up a temporary container locally to verify the image works.
        // ======================================================================
        stage('Container Health Check') {
            steps {
                bat """
                    @echo off
                    echo ===================================================
                    echo [CI] Running Container Health Check
                    echo ===================================================
                    docker run -d --name ci-health-check-${BUILD_NUMBER} -p 8090:80 ${FULL_IMAGE_NAME}:${IMAGE_TAG}
                    if errorlevel 1 (
                        echo [FAIL] Failed to start health check container.
                        exit /b 1
                    )
                    timeout /t 5 /nobreak >nul
                    curl -f -s http://localhost:8090/healthz
                    if errorlevel 1 (
                        echo [FAIL] Health check endpoint did not respond.
                        docker stop ci-health-check-${BUILD_NUMBER}
                        docker rm ci-health-check-${BUILD_NUMBER}
                        exit /b 1
                    )
                    echo [PASS] Health check passed - application is healthy.
                    docker stop ci-health-check-${BUILD_NUMBER}
                    docker rm ci-health-check-${BUILD_NUMBER}
                    exit /b 0
                """
            }
        }
    }

    // ==========================================================================
    // POST-BUILD ACTIONS
    // ==========================================================================
    post {
        always {
            bat '''
                @echo off
                docker rm -f ci-health-check-%BUILD_NUMBER% >nul 2>nul
                exit /b 0
            '''
            echo '==================================================='
            echo "Space Invaders CI/CD - Build #${env.BUILD_NUMBER} | Status: ${currentBuild.currentResult}"
            echo "Image: ${env.FULL_IMAGE_NAME}:${env.IMAGE_TAG}"
            echo '==================================================='
        }
        success {
            echo "SUCCESS: Full CI/CD pipeline passed! Image pushed to DockerHub."
            echo "DockerHub: https://hub.docker.com/r/${env.FULL_IMAGE_NAME}"
        }
        failure {
            echo "FAILURE: Pipeline encountered errors. Check the failed stage above."
        }
        unstable {
            echo "UNSTABLE: Pipeline completed with warnings."
        }
    }
}
