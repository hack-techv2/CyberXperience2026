# CyberXperience 2026

A 3-stage security CTF covering path traversal, command injection, and privilege escalation in a containerized Linux environment.

## Background

This platform provides a hands-on environment for practising common web and system exploitation techniques. Each stage builds on the last: Stage 1 leaks shell credentials via path traversal, Stage 2 exploits a command injection flaw to read a user flag, and Stage 3 escalates to root via a misconfigured sudo rule. All services run in isolated Docker containers on a single host.

## Prerequisites

- Docker 24+
- Docker Compose v2 (or `docker-compose` v1.29+)
- Ports 3000, 4000, and 5000 available on the host

## Install

```bash
docker-compose up --build
```

Access the CTF at `http://localhost:3000`.

## Architecture

| Service       | Port | Runtime    | Role                                      |
|---------------|------|------------|-------------------------------------------|
| frontend      | 3000 | Next.js    | Web UI; proxies to gateway and web-traversal |
| gateway       | 4000 | Node.js 20 | Socket.io terminal bridge; JWT auth; flag validation |
| web-traversal | 5000 | Python 3.11 | Stage 1 Flask API (intentionally vulnerable) |
| shell-backend | —    | Ubuntu 22.04 | Stage 2 & 3 restricted shell; no exposed port |

All services connect on the `ctf-network` Docker bridge network.

## Challenge Stages

| Stage | Technique             | Target                           | Objective                          |
|-------|-----------------------|----------------------------------|------------------------------------|
| 1     | Path Traversal        | `/api/files/read` (web-traversal) | Read `/data/secrets/credentials.txt` |
| 2     | Command Injection     | Restricted shell (shell-backend)  | Read `/home/ctf_user/flag2.txt`    |
| 3     | Privilege Escalation  | Misconfigured sudo (shell-backend) | Read `/root/root_flag.txt`         |

## Development

Running services individually (requires Node.js 20+ and Python 3.11 locally for non-Docker workflows):

```bash
# Frontend
cd frontend && npm install && npm run dev

# Gateway
cd gateway && npm install && npm run dev

# Backend services only (Docker required)
docker-compose up web-traversal shell-backend
```

## File Structure

```
CyberXperience2026/
├── docker-compose.yml
├── flags.json               # Centralized flag configuration
├── frontend/                # Next.js web interface
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   └── Dockerfile
├── gateway/                 # Socket.io terminal bridge
│   ├── server.js
│   └── Dockerfile
└── services/
    ├── web-traversal/       # Flask API (Stage 1)
    │   ├── app.py
    │   ├── create_secrets.sh
    │   └── Dockerfile
    └── shell-backend/       # Ubuntu shell (Stages 2 & 3)
        ├── restricted_shell.py
        ├── setup_flags.sh
        ├── ctf_user_sudoers
        └── Dockerfile
```

## Security Notes

- **Path traversal:** `os.path.join(WEB_ROOT, filename)` in `app.py` with no sanitization; never trust user-supplied path components.
- **Command injection:** `subprocess.run(cmd_input, shell=True)` with a first-word-only whitelist check; whitelist validation must cover the full input or avoid `shell=True`.
- **Privilege escalation:** `ctf_user ALL=(ALL) NOPASSWD: /usr/bin/find` in `ctf_user_sudoers`; avoid granting sudo on binaries listed in GTFOBins.
- **JWT:** Gateway accepts `alg: none` (unsigned tokens); always enforce algorithm allowlists server-side.

For authorized use only. Do not deploy on networks where unauthorized users may access port 3000.

## License

Educational use only. Do not apply these techniques to systems without explicit authorization.
