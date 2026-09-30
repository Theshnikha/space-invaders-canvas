pipeline {
    agent any

    options {
        timeout(time: 10, unit: 'MINUTES')
        timestamps()
    }

    environment {
        PROJECT_NAME = 'space-invaders-canvas'
        IMAGE_NAME = 'space-invaders'
        IMAGE_TAG = '1.0'
        PATH = "C:\\Users\\user\\AppData\\Local\\Programs\\DockerDesktop\\resources\\bin;${env.PATH}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment Check') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Verifying Build Environment Tools and Docker
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
                    echo Docker Engine Info:
                    docker info --format "{{.ServerVersion}}"
                    exit /b 0
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Checking and Installing Dependencies
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

        stage('Run Automated Tests') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Executing Automated Unit Tests (32 tests)
                    echo ===================================================
                    call npm.cmd test
                    if errorlevel 1 exit /b 1
                    exit /b 0
                '''
            }
        }

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
                    echo All JavaScript source files verified successfully.
                    exit /b 0
                '''
            }
        }

        stage('Docker Image Build') {
            steps {
                bat """
                    @echo off
                    echo ===================================================
                    echo [CI] Building Docker Image (${IMAGE_NAME}:${IMAGE_TAG})
                    echo ===================================================
                    if not exist Dockerfile (
                        echo ERROR: Dockerfile not found!
                        exit /b 1
                    )
                    if not exist nginx.conf (
                        echo ERROR: nginx.conf not found!
                        exit /b 1
                    )
                    docker build -t ${IMAGE_NAME}:${IMAGE_TAG} -t ${IMAGE_NAME}:%BUILD_NUMBER% .
                    if errorlevel 1 (
                        echo ERROR: Docker build failed!
                        exit /b 1
                    )
                    echo Docker build succeeded.
                    exit /b 0
                """
            }
        }

        stage('Docker Image Verification') {
            steps {
                bat """
                    @echo off
                    echo ===================================================
                    echo [CI] Verifying Built Docker Image
                    echo ===================================================
                    docker images ${IMAGE_NAME}:${IMAGE_TAG}
                    if errorlevel 1 exit /b 1
                    echo Docker Image ${IMAGE_NAME}:${IMAGE_TAG} is verified and ready.
                    exit /b 0
                """
            }
        }
    }

    post {
        always {
            echo '==================================================='
            echo "Space Invaders CI - Build #${env.BUILD_NUMBER} completed with status: ${currentBuild.currentResult}"
            echo '==================================================='
        }
        success {
            echo 'SUCCESS: All Space Invaders CI and Docker Build checks passed!'
        }
        failure {
            echo 'FAILURE: Space Invaders CI pipeline encountered errors.'
        }
    }
}
