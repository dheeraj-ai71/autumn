#!/bin/bash

# Load environment variables from server/.env if it exists
if [ -f "server/.env" ]; then
    echo "Loading environment variables from server/.env..."
    export $(grep -v '^#' server/.env | xargs)
fi

# Start Docker Compose with loaded environment variables
echo "Starting Docker containers..."
docker compose -f docker-compose.dev.yml up -d

echo "✅ Docker containers started!"
echo "Frontend: http://localhost:${FRONTEND_PORT:-3000}"
echo "Backend: http://localhost:${BACKEND_PORT:-8080}"
echo "PostgreSQL: localhost:${POSTGRES_PORT:-5433}"
