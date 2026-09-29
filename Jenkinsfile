pipeline {
    agent any

    options {
        timeout(time: 10, unit: 'MINUTES')
        timestamps()
    }

    environment {
        PROJECT_NAME = 'space-invaders-canvas'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Environment & Tool Verification') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Verifying Build Environment Tools
                    echo ===================================================
                    echo Node Version:
                    node --version
                    echo NPM Version:
                    call npm.cmd --version
                    echo Git Version:
                    git --version
                    echo Java Version:
                    java -version
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

        stage('Build & Syntax Validation') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Validating Source Files and Syntax
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

        stage('Docker Validation') {
            steps {
                bat '''
                    @echo off
                    echo ===================================================
                    echo [CI] Validating Docker Configuration
                    echo ===================================================
                    if not exist Dockerfile (
                        echo ERROR: Dockerfile not found!
                        exit /b 1
                    )
                    if not exist nginx.conf (
                        echo ERROR: nginx.conf not found!
                        exit /b 1
                    )
                    echo Dockerfile and nginx.conf verified.
                    
                    where docker >nul 2>nul
                    if errorlevel 1 (
                        echo [INFO] Docker CLI is not installed in this environment. Skipping container build.
                    ) else (
                        echo Docker CLI found. Building container image...
                        docker build -t space-invaders-game:%BUILD_NUMBER% .
                        if errorlevel 1 exit /b 1
                    )
                    exit /b 0
                '''
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
            echo 'SUCCESS: All Space Invaders CI validation checks passed!'
        }
        failure {
            echo 'FAILURE: Space Invaders CI pipeline encountered errors.'
        }
    }
}
