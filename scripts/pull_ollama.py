import shutil
import subprocess
import sys


def run(command):
    subprocess.run(command, check=True)


def main():
    models = sys.argv[1:]
    if not models:
        raise SystemExit("Pass at least one Ollama model name.")

    ollama = shutil.which("ollama")
    if ollama:
        print("Using host Ollama")
        for model in models:
            run([ollama, "pull", model])
        return

    docker = shutil.which("docker")
    if not docker:
        raise SystemExit("Ollama and Docker are not installed.")

    print("Host Ollama not found; using the Compose Ollama container")
    run([docker, "compose", "up", "-d", "ollama"])
    for model in models:
        run([docker, "compose", "exec", "ollama", "ollama", "pull", model])


if __name__ == "__main__":
    main()