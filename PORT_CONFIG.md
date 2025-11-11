# Port Configuration Guide

## Simple .env Approach

To use custom ports, add these variables to your `server/.env` file:

```env
# Custom port configuration (optional)
FRONTEND_PORT=3001
BACKEND_PORT=8081
POSTGRES_PORT=5434
```

## Usage

### Option 1: Using the start script (Recommended)
```bash
./docker-start.sh
```

### Option 2: Manual approach
```bash
# Load .env variables and start
export $(grep -v '^#' server/.env | xargs)
docker compose -f docker-compose.dev.yml up -d
```

### Option 3: Inline environment variables
```bash
FRONTEND_PORT=3001 BACKEND_PORT=8081 docker compose -f docker-compose.dev.yml up -d
```

## What happens:

1. **Frontend** runs on `localhost:${FRONTEND_PORT:-3000}`
2. **Backend** runs on `localhost:${BACKEND_PORT:-8080}`  
3. **PostgreSQL** runs on `localhost:${POSTGRES_PORT:-5433}`
4. **CORS & Auth** automatically allow the custom frontend port
5. **Frontend** automatically connects to the custom backend port

## Default behavior (no .env):
- Frontend: `localhost:3000`
- Backend: `localhost:8080`
- PostgreSQL: `localhost:5433`

## Benefits:
- ✅ Simple configuration in one place (`server/.env`)
- ✅ No code changes needed
- ✅ Works with any available ports
- ✅ Automatic CORS and authentication setup
- ✅ Same workflow for all developers
