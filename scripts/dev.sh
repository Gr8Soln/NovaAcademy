#!/usr/bin/env bash
set -e

set -euo pipefail
cd "$(dirname "$0")/.."

echo "Starting NovaAcademy local development environment..."
echo "Press Ctrl+C to stop all services."
echo "------------------------------------------------------"
if ! command -v tmux >/dev/null 2>&1; then
    echo "Error: tmux is not installed. Please install it (e.g., 'brew install tmux') to split the terminal." >&2
    exit 1
fi

cleanup() {
    echo ""
    echo "Stopping all services..."
    kill 0
    wait
    echo "All services stopped."
    exit 0
}
SESSION="nova-dev"

trap cleanup SIGINT SIGTERM
if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Session '$SESSION' already exists. Attaching..."
    exec tmux attach-session -t "$SESSION"
fi

# Start Backend
./scripts/backend.sh 2>&1 | sed -e 's/^/[BACKEND] /' &
BACKEND_PID=$!
echo "Starting NovaAcademy local development environment in tmux..."

# Start Frontend
./scripts/frontend.sh 2>&1 | sed -e 's/^/[FRONTEND] /' &
FRONTEND_PID=$!
tmux new-session -d -s "$SESSION" -n dev -c "$PWD"
tmux set-option -t "$SESSION" mouse on

# Start Worker
./scripts/worker.sh 2>&1 | sed -e 's/^/[WORKER] /' &
WORKER_PID=$!
# Capture stable pane IDs
BACKEND_PANE="$(tmux display-message -p -t "${SESSION}:dev" '#{pane_id}')"
FRONTEND_PANE="$(tmux split-window -h -P -F '#{pane_id}' -t "$BACKEND_PANE" -c "$PWD")"
CELERY_PANE="$(tmux split-window -v -P -F '#{pane_id}' -t "$FRONTEND_PANE" -c "$PWD")"

# Start Beat
./scripts/beat.sh 2>&1 | sed -e 's/^/[BEAT] /' &
BEAT_PID=$!
# Start the services using the semantic Make commands
tmux send-keys -t "$BACKEND_PANE" "make backend" C-m
tmux send-keys -t "$FRONTEND_PANE" "make frontend" C-m
# Running worker and beat together in the celery pane
tmux send-keys -t "$CELERY_PANE" "make worker" C-m

wait
# Select layout and attach
tmux select-pane -t "$BACKEND_PANE" -T "Backend"
tmux select-pane -t "$FRONTEND_PANE" -T "Frontend"
tmux select-pane -t "$CELERY_PANE" -T "Celery Worker"
tmux select-layout -t "$SESSION" tiled
tmux select-pane -t "$BACKEND_PANE"

exec tmux attach-session -t "$SESSION"
