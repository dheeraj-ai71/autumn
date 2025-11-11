#!/bin/sh

echo "Starting localtunnel setup..."

# Check if running in Docker (look for .dockerenv file)
if [ -f "/.dockerenv" ]; then
    echo "Running in Docker container"
    ENV_FILE="/app/server/.env"
else
    echo "Running locally"
    ENV_FILE=".env"
fi

# Source .env file if it exists
if [ -f "$ENV_FILE" ]; then
    echo "Loading environment from $ENV_FILE"
    . "$ENV_FILE"
    echo "LOCALTUNNEL_RESERVED_KEY loaded: ${LOCALTUNNEL_RESERVED_KEY}"
else
    echo "No .env file found at $ENV_FILE"
fi

# Set default if not found
if [ -z "$LOCALTUNNEL_RESERVED_KEY" ]; then
    echo "No LOCALTUNNEL_RESERVED_KEY found, using default"
    LOCALTUNNEL_RESERVED_KEY="autumn-dev"
fi

echo "Installing localtunnel..."
echo "Reserved key: ${LOCALTUNNEL_RESERVED_KEY}"

# Install localtunnel globally
bun install -g localtunnel

# Wait for server to be ready (important for Docker)
echo "Waiting for server to be ready..."
sleep 10

echo "Starting localtunnel..."
# Use 'server' as hostname in Docker network, 'localhost' when running locally
if [ -f "/.dockerenv" ]; then
    lt --port 8080 --local-host server --subdomain ${LOCALTUNNEL_RESERVED_KEY} --print-requests
else
    lt --port 8080 --subdomain ${LOCALTUNNEL_RESERVED_KEY} --print-requests
fi