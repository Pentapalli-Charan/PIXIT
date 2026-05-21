pipeline {
    agent any

    environment {
        // Force compose project name to keep CI containers isolated from development ones
        COMPOSE_PROJECT_NAME = "pixit_ci"
        BACKEND_PORT = "8081"
        FRONTEND_PORT = "3081"
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Pulling latest code from repository...'
                checkout scm
            }
        }

        stage('Backend Preparation') {
            steps {
                echo 'Checking backend structure...'
                dir('fastapi_backend') {
                    // Check if requirements.txt and Dockerfile exist
                    sh 'ls -la'
                }
            }
        }

        stage('Frontend Preparation') {
            steps {
                echo 'Checking frontend structure...'
                dir('frontend') {
                    // Check if package.json and Dockerfile exist
                    sh 'ls -la'
                }
            }
        }

        stage('Build & Deploy Stack') {
            steps {
                echo 'Building and launching Docker containers...'
                // Ensure .env file exists in the cloned repository workspace for Docker Compose to read
                sh 'if [ ! -f fastapi_backend/.env ]; then cp fastapi_backend/.env.example fastapi_backend/.env; fi'
                // Build and start the containers using the standard docker-compose file in the repo root
                sh 'docker compose -f docker-compose.yml down'
                sh 'docker compose -f docker-compose.yml build --no-cache'
                sh 'docker compose -f docker-compose.yml up -d'
                echo 'Containers successfully started.'
            }
        }

        stage('Health Verification') {
            steps {
                echo 'Verifying application health...'
                // Wait for FastAPI backend container to start up and perform a health check curl
                sh 'sleep 5'
                // Verify health check on the CI backend port (8081) mapped to host
                sh 'curl -f http://host.docker.internal:${BACKEND_PORT}/health/ || curl -f http://localhost:${BACKEND_PORT}/health/ || exit 1'
                echo 'Sanity check passed! App is responsive.'
            }
        }
    }

    post {
        always {
            echo 'Pipeline finished. Cleaning workspace...'
            cleanWs()
        }
        success {
            echo 'CI/CD pipeline completed successfully!'
        }
        failure {
            echo 'CI/CD pipeline failed. Inspect the logs above.'
        }
    }
}
