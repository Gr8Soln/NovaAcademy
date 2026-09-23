import os
import shlex
import shutil
import subprocess
import sys


SESSION = "nova-dev"


def command_exists(name):
    return shutil.which(name) is not None


def shell_command(*parts):
    return " ".join(shlex.quote(str(part)) for part in parts)


def tmux(*args):
    subprocess.run(["tmux", *args], check=True)


def tmux_output(*args):
    return subprocess.check_output(["tmux", *args], text=True).strip()


def main():
    if not command_exists("tmux"):
        raise SystemExit(
            "tmux is required for make dev. Install it with 'brew install tmux' "
            "or use make backend, make worker, make beat, and make ui separately."
        )

    if subprocess.run(["tmux", "has-session", "-t", SESSION], capture_output=True).returncode == 0:
        print(f"Attaching to existing tmux session '{SESSION}'.")
        os.execvp("tmux", ["tmux", "attach-session", "-t", SESSION])

    python = sys.executable
    panes = [
        ("migrations", shell_command(python, "-m", "alembic", "upgrade", "head")),
        ("backend", " && ".join((
            shell_command(python, "-m", "alembic", "upgrade", "head"),
            shell_command(python, "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", os.environ.get("PORT", "8000"), "--reload"),
        ))),
        ("ui", "cd ui && npm run dev -- --host 0.0.0.0"),
        ("worker", shell_command(python, "-m", "celery", "-A", "app.infrastructure.celery_app", "worker", "--loglevel=info")),
        ("beat", shell_command(python, "-m", "celery", "-A", "app.infrastructure.celery_app", "beat", "--loglevel=info")),
    ]

    if os.environ.get("NGROK", "1").lower() not in {"0", "false", "no"}:
        if command_exists("ngrok"):
            panes.append(("ngrok", f"ngrok http {os.environ.get('PORT', '8000')}"))
        else:
            panes.append(("ngrok", "echo 'ngrok not found; install it or run NGROK=0 make dev'; exec $SHELL"))

    first_name, first_command = panes[0]
    tmux("new-session", "-d", "-s", SESSION, "-n", "dev", first_command)
    first_pane = tmux_output("display-message", "-p", "-t", SESSION, "#{pane_id}")
    tmux("select-pane", "-t", first_pane, "-T", first_name)

    for index, (name, command) in enumerate(panes[1:], start=1):
        pane_id = tmux_output("split-window", "-P", "-F", "#{pane_id}", "-t", SESSION, "-v" if index % 2 else "-h", command)
        tmux("select-pane", "-t", pane_id, "-T", name)

    tmux("select-layout", "-t", SESSION, "tiled")
    print(f"Starting panes for backend, UI, workers, migrations, and ngrok in '{SESSION}'.")
    os.execvp("tmux", ["tmux", "attach-session", "-t", SESSION])


if __name__ == "__main__":
    main()