#!/bin/bash

################################################################################
# NovaAcademy Development Startup Script
# 
# This script handles:
# - Virtual environment creation and activation
# - Python dependencies installation
# - Backend API server
# - Celery worker and beat scheduler
# - Frontend React dev server
# - Graceful cleanup on exit
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="${PROJECT_ROOT}/.venv"
LOGS_DIR="${PROJECT_ROOT}/logs"
UI_DIR="${PROJECT_ROOT}/ui"
ENV_FILE="${PROJECT_ROOT}/.env"

# Default ports (will be overridden by .env if present)
BACKEND_PORT=8000
FRONTEND_PORT=5173

# Process tracking
PIDS=()

################################################################################
# Utility Functions
################################################################################

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

cleanup() {
    log_info "Shutting down NovaAcademy..."
    
    # Kill all tracked processes
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            log_info "Stopping process $pid"
            kill "$pid" 2>/dev/null || true
        fi
    done
    
    # Wait a moment for graceful shutdown
    sleep 2
    
    # Force kill any remaining processes
    for pid in "${PIDS[@]}"; do
        if kill -0 "$pid" 2>/dev/null; then
            log_warning "Force killing process $pid"
            kill -9 "$pid" 2>/dev/null || true
        fi
    done
    
    log_success "All processes stopped. Goodbye!"
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM EXIT

################################################################################
# Environment Setup
################################################################################

load_env() {
    if [ -f "$ENV_FILE" ]; then
        log_info "Loading environment variables from .env"

        # Load .env as plain KEY=VALUE pairs (do not execute it as shell code).
        while IFS= read -r line || [ -n "$line" ]; do
            # Normalize CRLF endings and skip blanks/comments
            line="${line%$'\r'}"
            [ -z "${line//[[:space:]]/}" ] && continue
            case "$line" in
                \#*) continue ;;
            esac

            # Allow optional "export KEY=VALUE" syntax
            case "$line" in
                export\ *) line="${line#export }" ;;
            esac

            # Ignore malformed lines
            case "$line" in
                *=*) ;;
                *)
                    log_warning "Skipping invalid .env line: $line"
                    continue
                    ;;
            esac

            key="${line%%=*}"
            value="${line#*=}"

            # Trim whitespace around key
            key="${key#${key%%[![:space:]]*}}"
            key="${key%${key##*[![:space:]]}}"

            # Trim whitespace around value
            value="${value#${value%%[![:space:]]*}}"
            value="${value%${value##*[![:space:]]}}"

            # Remove wrapping single/double quotes when present
            if [ "${#value}" -ge 2 ]; then
                first_char="${value:0:1}"
                last_char="${value: -1}"
                if [ "$first_char" = '"' ] && [ "$last_char" = '"' ]; then
                    value="${value:1:${#value}-2}"
                elif [ "$first_char" = "'" ] && [ "$last_char" = "'" ]; then
                    value="${value:1:${#value}-2}"
                fi
            fi

            export "$key=$value"
        done < "$ENV_FILE"
        
        # Override ports if defined in .env
        if [ -n "${PORT:-}" ]; then
            BACKEND_PORT=$PORT
        fi
        if [ -n "${VITE_PORT:-}" ]; then
            FRONTEND_PORT=$VITE_PORT
        fi
        
        log_success "Environment loaded (Backend: $BACKEND_PORT, Frontend: $FRONTEND_PORT)"
    else
        log_warning ".env file not found. Using defaults."
        log_info "Consider copying .env.example to .env and configuring it."
    fi
}

create_logs_directory() {
    if [ ! -d "$LOGS_DIR" ]; then
        log_info "Creating logs directory..."
        mkdir -p "$LOGS_DIR"
        log_success "Logs directory created at $LOGS_DIR"
    fi
}

################################################################################
# Virtual Environment Setup
################################################################################

setup_venv() {
    if [ ! -d "$VENV_DIR" ]; then
        log_info "Virtual environment not found. Creating one..."
        if command -v python3 >/dev/null 2>&1; then
            python3 -m venv "$VENV_DIR"
        elif command -v python >/dev/null 2>&1; then
            python -m venv "$VENV_DIR"
        else
            log_error "Python is not available in PATH."
            exit 1
        fi
        log_success "Virtual environment created at $VENV_DIR"
    else
        log_info "Virtual environment already exists"
    fi
}

activate_venv() {
    log_info "Activating virtual environment..."

    if [ -f "$VENV_DIR/bin/activate" ]; then
        # POSIX layout
        source "$VENV_DIR/bin/activate"
    elif [ -f "$VENV_DIR/Scripts/activate" ]; then
        # Windows venv layout (Git Bash)
        source "$VENV_DIR/Scripts/activate"
    else
        log_error "Could not find virtual environment activation script."
        log_error "Looked for: $VENV_DIR/bin/activate and $VENV_DIR/Scripts/activate"
        exit 1
    fi

    log_success "Virtual environment activated"
}

install_python_deps() {
    log_info "Checking Python dependencies..."
    
    # Check if requirements are already installed by looking for a marker file
    MARKER_FILE="$VENV_DIR/.deps_installed"
    REQUIREMENTS_HASH=$(md5sum requirements.txt 2>/dev/null | cut -d' ' -f1 || echo "none")
    
    if [ -f "$MARKER_FILE" ]; then
        INSTALLED_HASH=$(cat "$MARKER_FILE")
        if [ "$REQUIREMENTS_HASH" = "$INSTALLED_HASH" ]; then
            log_success "Python dependencies already installed and up to date"
            return
        fi
    fi
    
    log_info "Installing Python dependencies from requirements.txt..."
    python -m pip install --upgrade pip -q
    python -m pip install -r requirements.txt -q
    
    # Mark dependencies as installed
    echo "$REQUIREMENTS_HASH" > "$MARKER_FILE"
    log_success "Python dependencies installed"
}

################################################################################
# Service Health Checks
################################################################################

check_postgres() {
    log_info "Checking PostgreSQL availability..."
    
    # Extract connection details from DATABASE_URL if available
    if [ -n "$DATABASE_URL" ]; then
        # Simple check using psql if available
        if command -v psql &> /dev/null; then
            if psql "$DATABASE_URL" -c "SELECT 1;" &> /dev/null; then
                log_success "PostgreSQL is running and accessible"
                return 0
            fi
        fi
        
        # Fallback: try to connect using Python
        python -c "
import sys
try:
    import asyncpg
    import asyncio
    async def check():
        try:
            conn = await asyncpg.connect('$DATABASE_URL')
            await conn.close()
            return True
        except:
            return False
    result = asyncio.run(check())
    sys.exit(0 if result else 1)
except:
    sys.exit(1)
" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log_success "PostgreSQL is running and accessible"
            return 0
        fi
    fi
    
    log_error "PostgreSQL is not accessible. Please start PostgreSQL and ensure DATABASE_URL is correct."
    exit 1
}

check_redis() {
    log_info "Checking Redis availability..."
    
    if [ -n "$REDIS_URL" ]; then
        # Try using redis-cli if available
        if command -v redis-cli &> /dev/null; then
            REDIS_HOST=$(echo "$REDIS_URL" | sed -n 's|redis://\([^:]*\).*|\1|p')
            REDIS_PORT=$(echo "$REDIS_URL" | sed -n 's|redis://[^:]*:\([0-9]*\).*|\1|p')
            
            if [ -z "$REDIS_PORT" ]; then
                REDIS_PORT=6379
            fi
            
            if redis-cli -h "$REDIS_HOST" -p "$REDIS_PORT" ping &> /dev/null; then
                log_success "Redis is running and accessible"
                return 0
            fi
        fi
        
        # Fallback: try Python redis connection
        python -c "
import sys
try:
    import redis
    r = redis.from_url('$REDIS_URL')
    r.ping()
    sys.exit(0)
except:
    sys.exit(1)
" 2>/dev/null
        
        if [ $? -eq 0 ]; then
            log_success "Redis is running and accessible"
            return 0
        fi
    fi
    
    log_error "Redis is not accessible. Please start Redis and ensure REDIS_URL is correct."
    exit 1
}

################################################################################
# Frontend Setup
################################################################################

install_frontend_deps() {
    if [ ! -d "$UI_DIR" ]; then
        log_error "Frontend directory not found at $UI_DIR"
        exit 1
    fi
    
    cd "$UI_DIR"
    
    if [ ! -d "$UI_DIR/node_modules" ]; then
        log_info "Installing frontend dependencies..."
        npm install
        log_success "Frontend dependencies installed"
    else
        log_success "Frontend dependencies already installed"
    fi
    
    cd "$PROJECT_ROOT"
}

################################################################################
# Process Starters
################################################################################

start_backend() {
    log_info "Starting FastAPI backend on port $BACKEND_PORT..."
    
    cd "$PROJECT_ROOT"
    python -m app.main > "$LOGS_DIR/backend.log" 2>&1 &
    PIDS+=($!)
    
    log_success "Backend started (PID: ${PIDS[-1]}, Log: logs/backend.log)"
}

start_celery_worker() {
    log_info "Starting Celery worker..."
    
    cd "$PROJECT_ROOT"
    
    # Detect OS for pool option
    if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
        celery -A app.infrastructure.celery_app.celery_app worker --pool=solo --loglevel=info > "$LOGS_DIR/celery-worker.log" 2>&1 &
    else
        celery -A app.infrastructure.celery_app.celery_app worker --loglevel=info > "$LOGS_DIR/celery-worker.log" 2>&1 &
    fi
    
    PIDS+=($!)
    log_success "Celery worker started (PID: ${PIDS[-1]}, Log: logs/celery-worker.log)"
}

start_celery_beat() {
    log_info "Starting Celery beat scheduler..."
    
    cd "$PROJECT_ROOT"
    celery -A app.infrastructure.celery_app.celery_app beat --loglevel=info > "$LOGS_DIR/celery-beat.log" 2>&1 &
    PIDS+=($!)
    
    log_success "Celery beat started (PID: ${PIDS[-1]}, Log: logs/celery-beat.log)"
}

start_frontend() {
    log_info "Starting React frontend on port $FRONTEND_PORT..."
    
    cd "$UI_DIR"
    npm run dev > "$LOGS_DIR/frontend.log" 2>&1 &
    PIDS+=($!)
    
    log_success "Frontend started (PID: ${PIDS[-1]}, Log: logs/frontend.log)"
    cd "$PROJECT_ROOT"
}

################################################################################
# Main Execution
################################################################################

main() {
    echo ""
    log_info "========================================="
    log_info "  NovaAcademy Development Startup"
    log_info "========================================="
    echo ""
    
    # Step 1: Load environment
    load_env
    
    # Step 2: Create logs directory
    create_logs_directory
    
    # Step 3: Setup Python environment
    setup_venv
    activate_venv
    install_python_deps
    
    # Step 4: Install frontend dependencies
    install_frontend_deps
    
    # Step 5: Start all services
    echo ""
    log_info "Starting all services..."
    echo ""
    
    start_backend
    sleep 2  # Give backend a moment to start
    
    start_celery_worker
    sleep 1
    
    start_celery_beat
    sleep 1
    
    start_frontend
    
    echo ""
    log_success "========================================="
    log_success "  NovaAcademy is now running!"
    log_success "========================================="
    echo ""
    log_info "Frontend:  http://localhost:$FRONTEND_PORT"
    log_info "Backend:   http://localhost:$BACKEND_PORT"
    log_info "API Docs:  http://localhost:$BACKEND_PORT/api/v1/docs"
    echo ""
    log_info "Logs are being written to: $LOGS_DIR/"
    log_info "Press Ctrl+C to stop all services"
    echo ""
    
    # Wait for all processes
    wait
}

# Run main function
main