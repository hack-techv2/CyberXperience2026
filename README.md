# CyberXperience 2026: The Shell Chronicles

A beginner-friendly 3-stage security CTF challenge featuring Path Traversal, Command Injection, and Privilege Escalation.

## Quick Start

```bash
# Build and start all services
docker-compose up --build

# Access the CTF at http://localhost:3000
```

## Architecture

```
+----------------------------------------------------------------+
|                         Frontend (Next.js)                       |
|                         http://localhost:3000                    |
+----------------------------------------------------------------+
|                              |                                   |
|         +--------------------+--------------------+              |
|         |                    |                    |              |
|         v                    v                    |              |
|  +--------------+    +--------------+             |              |
|  | Web Traversal|    |   Gateway    |<------------+              |
|  |   (Flask)    |    |  (Node.js)   |                            |
|  |  Port 5000   |    |  Port 4000   |                            |
|  +--------------+    +------+-------+                            |
|                             |                                    |
|                             | Docker API                         |
|                             v                                    |
|                      +--------------+                            |
|                      |Shell Backend |                            |
|                      |  (Ubuntu)    |                            |
|                      +--------------+                            |
+----------------------------------------------------------------+
```

## Challenge Stages

### Stage 1: Information Disclosure (Path Traversal)

**Target:** Web Traversal API (`/api/files/<filename>`)

**Vulnerability:** The file path is not sanitized, allowing `../` sequences.

**Goal:** Read `/data/secrets/credentials.txt` to obtain shell credentials.

---

### Stage 2: Command Injection (Shell Escape)

**Target:** Restricted Shell

**Vulnerability:** The shell checks only the first command word but allows shell operators.

**Goal:** Read `/home/ctf_user/flag2.txt`

---

### Stage 3: Privilege Escalation (GTFOBins)

**Target:** Root access via misconfigured sudo

**Vulnerability:** A common GTFOBins technique can be used to escalate privileges.

**Goal:** Read `/root/root_flag.txt`

---

## Development

### Running in Development Mode

```bash
# Frontend (requires Node.js 18+)
cd frontend
npm install
npm run dev

# Gateway
cd gateway
npm install
npm run dev

# Services (require Docker)
docker-compose up web-traversal shell-backend
```

### File Structure

```
CyberXperience2026/
+-- docker-compose.yml
+-- flags.json               # Centralized flag configuration
+-- frontend/                # Next.js web interface
|   +-- app/
|   +-- components/
|   +-- hooks/
|   +-- lib/
|   +-- Dockerfile
+-- gateway/                 # Socket.io terminal bridge
|   +-- server.js
|   +-- Dockerfile
+-- services/
    +-- web-traversal/       # Flask API (Stage 1)
    |   +-- app.py
    |   +-- create_secrets.sh
    |   +-- Dockerfile
    +-- shell-backend/       # Ubuntu shell (Stage 2 & 3)
        +-- restricted_shell.py
        +-- setup_flags.sh
        +-- ctf_user_sudoers
        +-- Dockerfile
```

## Educational Notes

This CTF demonstrates three fundamental web/system vulnerabilities:

1. **Path Traversal** - Never trust user input for file paths. Always use secure path joining and validate paths stay within allowed directories.

2. **Command Injection** - Never pass user input to shell commands. Use parameterized commands or avoid shell execution entirely.

3. **Privilege Escalation** - Follow the principle of least privilege. Audit sudo permissions regularly and avoid allowing commands that can execute arbitrary code.

## License

Educational use only. Do not use these techniques against systems without authorization.
