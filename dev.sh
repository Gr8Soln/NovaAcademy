#!/usr/bin/env bash
# One-shot local development launcher for the NovaAcademy tmux session.
set -euo pipefail

cd "$(dirname "${BASH_SOURCE[0]}")/.."

SESSION="nova-dev"

if [[ -f ".env" ]]; then
    set -a
    source .env
    set +a
fi

PORT="${PORT:-8000}"
PYTHON="${PYTHON:-.venv/bin/python}"

if [[ "${1:-}" == "down" ]]; then
    echo "Stopping NovaAcademy development services..."
    pkill -f "celery.*app.infrastructure.celery_app.*worker" >/dev/null 2>&1 || true
    pkill -f "celery.*app.infrastructure.celery_app.*beat" >/dev/null 2>&1 || true
    pkill -f "celery.*app.infrastructure.celery_app.*flower" >/dev/null 2>&1 || true

    if tmux has-session -t "$SESSION" 2>/dev/null; then
        tmux kill-session -t "$SESSION"
        echo "Stopped '$SESSION' (backend, UI, Celery, Flower, and ngrok)."
    else
        echo "Session '$SESSION' is not running."
    fi

    for _ in 1 2 3 4 5; do
        pgrep -f "celery.*app.infrastructure.celery_app.*worker" >/dev/null 2>&1 \
            || pgrep -f "celery.*app.infrastructure.celery_app.*beat" >/dev/null 2>&1 \
            || pgrep -f "celery.*app.infrastructure.celery_app.*flower" >/dev/null 2>&1 \
            || break
        sleep 1
    done
    exit 0
fi

if ! command -v tmux >/dev/null 2>&1; then
    echo "tmux is not installed. Install it with: brew install tmux" >&2
    exit 1
fi

if [[ "${NGROK:-1}" != "0" ]] && ! command -v ngrok >/dev/null 2>&1; then
    echo "ngrok is not installed. Install it with: brew install ngrok" >&2
    exit 1
fi

if tmux has-session -t "$SESSION" 2>/dev/null; then
    echo "Session '$SESSION' already exists - attaching..."
    exec tmux attach-session -t "$SESSION"
fi

tmux new-session -d -s "$SESSION" -n dev -c "$PWD"
tmux set-option -t "$SESSION" mouse on
tmux set-option -t "$SESSION" history-limit 100000
tmux set-option -t "$SESSION" pane-border-status top

# Capture stable pane IDs because tmux pane indexes can change after splits.
BACKEND_PANE="$(tmux display-message -p -t "${SESSION}:dev" '#{pane_id}')"

FRONTEND_PANE="$(tmux split-window -h -P -F '#{pane_id}' -t "$BACKEND_PANE" -c "$PWD")"
CELERY_PANE="$(tmux split-window -v -P -F '#{pane_id}' -t "$FRONTEND_PANE" -c "$PWD")"
NGROK_PANE="$(tmux split-window -v -P -F '#{pane_id}' -t "$BACKEND_PANE" -c "$PWD")"

# Backend pane: migrations run before Uvicorn so the API starts ready.
BACKEND_COMMAND="${PYTHON} -m alembic upgrade head && ${PYTHON} -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT} --reload || { exit_code=\$?; echo \"Backend stopped with exit code \$exit_code\"; exec \$SHELL; }"
tmux send-keys -t "$BACKEND_PANE" \
    "$BACKEND_COMMAND" C-m

# Celery worker, beat, and Flower share one visible pane.
CELERY_COMMAND="trap 'kill \$worker_pid \$beat_pid 2>/dev/null || true' EXIT; ${PYTHON} -m celery -A app.infrastructure.celery_app worker --loglevel=info & worker_pid=\$!; ${PYTHON} -m celery -A app.infrastructure.celery_app beat --loglevel=info & beat_pid=\$!; ${PYTHON} -m celery -A app.infrastructure.celery_app flower --port=5555 --url_prefix=/flower"
tmux send-keys -t "$CELERY_PANE" "$CELERY_COMMAND" C-m

# Frontend pane.
tmux send-keys -t "$FRONTEND_PANE" "cd ui && npm run dev -- --host 0.0.0.0" C-m

# ngrok pane, using the configured reserved URL when present.
if [[ "${NGROK:-1}" != "0" ]]; then
    if [[ -n "${NGROK_URL:-}" ]]; then
        NGROK_COMMAND="ngrok http --url=${NGROK_URL} ${PORT}"
    else
        NGROK_COMMAND="ngrok http ${PORT}"
    fi
    tmux send-keys -t "$NGROK_PANE" "$NGROK_COMMAND" C-m
else
    tmux send-keys -t "$NGROK_PANE" "echo 'ngrok disabled (NGROK=0)'; exec \$SHELL" C-m
fi

tmux select-pane -t "$BACKEND_PANE" -T "backend"
tmux select-pane -t "$FRONTEND_PANE" -T "frontend"
tmux select-pane -t "$CELERY_PANE" -T "celery + flower"
tmux select-pane -t "$NGROK_PANE" -T "ngrok"
tmux select-layout -t "$SESSION" tiled
tmux select-pane -t "$BACKEND_PANE"

exec tmux attach-session -t "$SESSION"