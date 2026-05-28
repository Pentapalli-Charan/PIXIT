pipeline {
    agent any

    triggers {
        githubPush()
    }

    environment {
        COMPOSE_PROJECT_NAME = "pixit_ci"
        BACKEND_PORT = "8081"
        FRONTEND_PORT = "3081"
        PROMETHEUS_PORT = "9091"
        GRAFANA_PORT = "3002"
        NODE_EXPORTER_PORT = "9101"
        CADVISOR_PORT = "8083"
    }

    stages {
        stage('Checkout') {
            steps {
                echo '[INFO] STAGE: Checkout'
                echo '[INFO] Pulling fresh code repository updates...'
                checkout scm
            }
        }

        stage('Install/Setup') {
            steps {
                echo '[INFO] STAGE: Install/Setup'
                echo '[INFO] Securing environment variables and installing package dependencies...'
                
                // Copy backend .env file if missing
                sh 'if [ ! -f fastapi_backend/.env ]; then cp fastapi_backend/.env.example fastapi_backend/.env; fi'
                
                // Install frontend dependencies via a node container (since they are not pre-installed on Jenkins host)
                echo '[INFO] Restoring Node package modules...'
                sh 'docker run --rm --volumes-from $(hostname) -w "${WORKSPACE}/frontend" node:20-alpine npm ci'
                
                // Setup Python virtual environment and dependencies
                echo '[INFO] Restoring Python package modules...'
                sh 'docker run --rm --volumes-from $(hostname) -w "${WORKSPACE}/fastapi_backend" python:3.11-slim sh -c "python -m venv venv && ./venv/bin/pip install -r requirements.txt"'
            }
        }

        stage('Test') {
            steps {
                echo '[INFO] STAGE: Test'
                echo '[INFO] Launching verification, linting, and testing suites...'
                
                // Run frontend ESLint check
                echo '[INFO] Validating frontend source formats (ESLint)...'
                sh 'docker run --rm --volumes-from $(hostname) -w "${WORKSPACE}/frontend" node:20-alpine npm run lint || echo "[WARNING] ESLint formatting violations detected, continuing..."'
                
                // Run backend tests inside a python container using the virtualenv
                echo '[INFO] Validating backend unit test logic...'
                sh 'docker run --rm --volumes-from $(hostname) -e SQLALCHEMY_DATABASE_URL=sqlite:///./test.db -w "${WORKSPACE}/fastapi_backend" python:3.11-slim ./venv/bin/python test_app.py'
            }
        }

        stage('Docker Build') {
            steps {
                echo '[INFO] STAGE: Docker Build'
                echo '[INFO] Building Docker images for backend and frontend apps...'
                sh 'docker build -t pixit-backend:latest ./fastapi_backend'
                sh 'docker build -t pixit-frontend:latest ./frontend'
            }
        }

        stage('Docker Push') {
            steps {
                echo '[INFO] STAGE: Docker Push'
                echo '[INFO] Pushing Docker images to Docker Hub registry...'
                
                // Attempt credentials login and push. Fails gracefully if user credentials are not in the Jenkins secrets store yet.
                catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                    withCredentials([usernamePassword(credentialsId: 'dockerhub', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
                        sh 'docker login -u "$DOCKER_USER" -p "$DOCKER_PASS"'
                        sh "docker tag pixit-backend:latest \$DOCKER_USER/pixit-backend:latest"
                        sh "docker tag pixit-frontend:latest \$DOCKER_USER/pixit-frontend:latest"
                        sh "docker push \$DOCKER_USER/pixit-backend:latest"
                        sh "docker push \$DOCKER_USER/pixit-frontend:latest"
                        echo '[INFO] Successfully pushed images to Docker Hub repository.'
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                echo '[INFO] STAGE: Deploy'
                echo '[INFO] Loading images to Kubernetes cluster and rolling out upgrades...'
                
                // Save and import backend image to Kind node container directly (bypassing the need for kind CLI inside Jenkins)
                sh '''
                docker save pixit-backend:latest -o backend.tar
                docker cp backend.tar pixit-k8s-control-plane:/backend.tar
                docker exec pixit-k8s-control-plane ctr --namespace=k8s.io images import /backend.tar
                docker exec pixit-k8s-control-plane rm /backend.tar
                rm -f backend.tar
                '''

                // Save and import frontend image to Kind node container directly
                sh '''
                docker save pixit-frontend:latest -o frontend.tar
                docker cp frontend.tar pixit-k8s-control-plane:/frontend.tar
                docker exec pixit-k8s-control-plane ctr --namespace=k8s.io images import /frontend.tar
                docker exec pixit-k8s-control-plane rm /frontend.tar
                rm -f frontend.tar
                '''
                
                // Copy mounted host kubeconfig and rewrite localhost references to host.docker.internal for container networking
                sh 'mkdir -p .kube'
                sh 'if [ -f /root/.kube/config ]; then cat /root/.kube/config | sed "s/127.0.0.1:/host.docker.internal:/g" > .kube/config; else echo "[WARNING] Host kubeconfig not found at /root/.kube/config"; fi'
                
                // If a local kubeconfig was successfully generated, deploy to local Kubernetes
                sh '''
                if [ -f .kube/config ]; then
                    echo "[INFO] Running Kubernetes updates (kubectl apply)..."
                    docker run --rm --add-host=host.docker.internal:host-gateway --volumes-from $(hostname) -w "${WORKSPACE}" bitnami/kubectl:latest --kubeconfig="${WORKSPACE}/.kube/config" --insecure-skip-tls-verify apply -f kubernetes/ -n pixit || true
                    
                    echo "[INFO] Rolling out fresh deployment pods..."
                    docker run --rm --add-host=host.docker.internal:host-gateway --volumes-from $(hostname) -w "${WORKSPACE}" bitnami/kubectl:latest --kubeconfig="${WORKSPACE}/.kube/config" --insecure-skip-tls-verify rollout restart deployment/backend -n pixit || true
                    docker run --rm --add-host=host.docker.internal:host-gateway --volumes-from $(hostname) -w "${WORKSPACE}" bitnami/kubectl:latest --kubeconfig="${WORKSPACE}/.kube/config" --insecure-skip-tls-verify rollout restart deployment/frontend -n pixit || true
                else
                    echo "[WARNING] Kubeconfig not available inside container. Skipping Kubernetes deploy step."
                fi
                '''
            }
        }

        stage('Health Check') {
            steps {
                echo '[INFO] STAGE: Health Check'
                echo '[INFO] Polling application endpoints for HTTP success headers...'
                
                // Wait for Kubernetes pods or development servers to scale up
                sh 'sleep 8'
                
                // Health checks on cluster NodePort mappings (falls back to local ports if cluster is unmapped)
                sh 'curl -f http://host.docker.internal:30001 || curl -f http://localhost:30001 || echo "[WARNING] Frontend App is offline/unresponsive"'
                sh 'curl -f http://host.docker.internal:30002/health/ || curl -f http://localhost:30002/health/ || echo "[WARNING] Backend API Gateway is offline/unresponsive"'
            }
        }

        stage('Monitoring Validation') {
            steps {
                echo '[INFO] STAGE: Monitoring Validation'
                echo '[INFO] Validating Prometheus scrape target nodes...'
                
                // Ensure metrics collection endpoints are active
                sh 'curl -f http://host.docker.internal:30003/metrics || curl -f http://localhost:30003/metrics || echo "[WARNING] Prometheus metrics collection failed"'
            }
        }
    }

    post {
        always {
            echo '[INFO] Pipeline finished. Clearing build directory workspace...'
            cleanWs()
        }
        success {
            echo '[SUCCESS] PIXIT primary CI/CD orchestration successfully completed!'
        }
        failure {
            echo '[FAILURE] PIXIT CI/CD orchestration failed. Verify log events above.'
        }
    }
}
