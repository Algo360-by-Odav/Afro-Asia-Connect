#!/bin/bash

# AfroAsiaConnect Deployment Script
# This script automates the deployment process for production

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BRANCH=${2:-main}

echo -e "${BLUE}🚀 Starting AfroAsiaConnect deployment to ${ENVIRONMENT}${NC}"
echo "=================================================="

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}📋 Checking prerequisites...${NC}"
    
    # Check if required tools are installed
    command -v docker >/dev/null 2>&1 || { echo -e "${RED}❌ Docker is required but not installed.${NC}" >&2; exit 1; }
    command -v docker-compose >/dev/null 2>&1 || { echo -e "${RED}❌ Docker Compose is required but not installed.${NC}" >&2; exit 1; }
    command -v git >/dev/null 2>&1 || { echo -e "${RED}❌ Git is required but not installed.${NC}" >&2; exit 1; }
    
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env file not found. Please copy env.example to .env and configure it.${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Prerequisites check passed${NC}"
}

# Pull latest code
pull_code() {
    echo -e "${YELLOW}📥 Pulling latest code from ${BRANCH} branch...${NC}"
    git fetch origin
    git checkout ${BRANCH}
    git pull origin ${BRANCH}
    echo -e "${GREEN}✅ Code updated${NC}"
}

# Build and deploy with Docker
deploy_with_docker() {
    echo -e "${YELLOW}🐳 Building and deploying with Docker...${NC}"
    
    # Stop existing containers
    docker-compose down --remove-orphans
    
    # Build new images
    docker-compose build --no-cache
    
    # Start services
    docker-compose up -d
    
    # Wait for services to be healthy
    echo -e "${YELLOW}⏳ Waiting for services to be healthy...${NC}"
    sleep 30
    
    # Check service health
    if docker-compose ps | grep -q "Up (healthy)"; then
        echo -e "${GREEN}✅ Services are healthy${NC}"
    else
        echo -e "${RED}❌ Some services are not healthy${NC}"
        docker-compose ps
        exit 1
    fi
}

# Run database migrations
run_migrations() {
    echo -e "${YELLOW}🗄️  Running database migrations...${NC}"
    docker-compose exec backend npx prisma migrate deploy
    echo -e "${GREEN}✅ Migrations completed${NC}"
}

# Run health checks
health_check() {
    echo -e "${YELLOW}🏥 Running health checks...${NC}"
    
    # Check frontend
    if curl -f http://localhost:3000 >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Frontend is healthy${NC}"
    else
        echo -e "${RED}❌ Frontend health check failed${NC}"
        exit 1
    fi
    
    # Check backend
    if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend is healthy${NC}"
    else
        echo -e "${RED}❌ Backend health check failed${NC}"
        exit 1
    fi
    
    # Check database connection
    if docker-compose exec backend node -e "require('./config/db.js').testConnection()" >/dev/null 2>&1; then
        echo -e "${GREEN}✅ Database connection is healthy${NC}"
    else
        echo -e "${RED}❌ Database connection failed${NC}"
        exit 1
    fi
}

# Backup database
backup_database() {
    echo -e "${YELLOW}💾 Creating database backup...${NC}"
    
    BACKUP_DIR="backups"
    mkdir -p ${BACKUP_DIR}
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="${BACKUP_DIR}/afroasiaconnect_backup_${TIMESTAMP}.sql"
    
    docker-compose exec postgres pg_dump -U postgres afroasiaconnect > ${BACKUP_FILE}
    
    echo -e "${GREEN}✅ Database backup created: ${BACKUP_FILE}${NC}"
}

# Cleanup old backups (keep last 7 days)
cleanup_backups() {
    echo -e "${YELLOW}🧹 Cleaning up old backups...${NC}"
    find backups/ -name "*.sql" -mtime +7 -delete 2>/dev/null || true
    echo -e "${GREEN}✅ Old backups cleaned up${NC}"
}

# Send deployment notification
send_notification() {
    local status=$1
    local message="AfroAsiaConnect deployment to ${ENVIRONMENT}: ${status}"
    
    # Send to Slack if webhook is configured
    if [ ! -z "${SLACK_WEBHOOK}" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"${message}\"}" \
            ${SLACK_WEBHOOK} >/dev/null 2>&1 || true
    fi
    
    echo -e "${GREEN}📢 Notification sent${NC}"
}

# Main deployment function
main() {
    echo -e "${BLUE}Starting deployment process...${NC}"
    
    check_prerequisites
    
    if [ "${ENVIRONMENT}" = "production" ]; then
        backup_database
    fi
    
    pull_code
    deploy_with_docker
    run_migrations
    health_check
    cleanup_backups
    
    echo -e "${GREEN}🎉 Deployment completed successfully!${NC}"
    echo "=================================================="
    echo -e "${BLUE}Application URLs:${NC}"
    echo "Frontend: http://localhost:3000"
    echo "Backend API: http://localhost:3001/api"
    echo "Admin Panel: http://localhost:3000/admin"
    
    send_notification "SUCCESS"
}

# Error handling
trap 'echo -e "${RED}❌ Deployment failed!${NC}"; send_notification "FAILED"; exit 1' ERR

# Run main function
main

echo -e "${GREEN}✨ Deployment script completed${NC}"
