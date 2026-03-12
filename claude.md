# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CyberXperience 2026 is an educational CTF (Capture The Flag) platform with 3 security challenge stages (path traversal, command injection, privilege escalation) plus a Stage 0 beginner tutorial. All services run in Docker containers.

## Commands

```bash
# Full stack (primary workflow)
docker-compose up --build

# Frontend only (requires Node.js 20+)
cd frontend && npm install && npm run dev

# Gateway only
cd gateway && npm install && npm run dev

# Backend services only
docker-compose up web-traversal shell-backend

# Lint
cd frontend && npm run lint

# Production build check
cd frontend && npm run build
```

## Tests

```bash
# All stages (92 tests)
bash tests/run-all.sh

# Individual stages
node tests/stage1.test.mjs        # Stage 1: path traversal (frontend logic)
python3 tests/stage2.test.py      # Stage 2: command injection (restricted shell)
python3 tests/stage3.test.py      # Stage 3: privilege escalation (config validation)
node tests/stage4.test.mjs        # Stage 4: victory button (JWT verification)
```

Tests replicate core logic from source files (no imports) and validate challenge mechanics:
- **Stage 1**: `normalizePath`, `buildDisplayPath`, cd/ls simulation, exploit path traversal to `/data/secrets`
- **Stage 2**: `get_base_command`, whitelist enforcement, injection vectors (pipe, semicolon, `&&`, `||`, backticks, `$()`, redirects), exploit verification
- **Stage 3**: sudoers config, `setup_flags.sh` permissions, Dockerfile packages/user setup, GTFOBin exploit validation

Verification of CTF challenge mechanics is otherwise manual via the browser.

## Architecture

```
Browser → Frontend (Next.js :3000)
            ├─ REST proxy (/api/web/*) → Web-Traversal (Flask :5000)
            └─ Socket.io → Gateway (Node.js :4000)
                              └─ Docker API → Shell-Backend (Ubuntu, no port)
```

- **Frontend** proxies `/api/web/*` to web-traversal via Next.js rewrites. Uses xterm.js for terminal emulation, Socket.io for real-time shell I/O. Styled with Tailwind CSS.
- **Gateway** (`gateway/server.js`) bridges browser↔container shell sessions using `dockerode` to exec into shell-backend. Handles JWT creation (`alg: none` — intentional vulnerability), flag validation, and session tracking via an in-memory `activeSessions` Map.
- **Web-Traversal** (`services/web-traversal/app.py`) is a Flask API with an intentional path traversal vulnerability in `/api/files/read`.
- **Shell-Backend** (`services/shell-backend/restricted_shell.py`) runs an intentional command injection flaw (Stage 2) and a misconfigured sudoers rule for `/usr/bin/find` (Stage 3).

## Key Files

| File | Role |
|------|------|
| `frontend/hooks/useFlagJWT.ts` | Central state: flag validation, credentials, baby shell progress, cookie polling |
| `frontend/app/page.tsx` | Main UI container with tab routing |
| `frontend/config/babyShellSteps.ts` | 10-step Stage 0 tutorial configuration |
| `gateway/server.js` | Express + Socket.io server, JWT utils, Docker integration, flag validation |
| `services/web-traversal/app.py` | Stage 1 Flask API |
| `services/shell-backend/restricted_shell.py` | Stages 2 & 3 restricted shell |
| `flags.json` | Single source of truth for all flag values (mounted read-only into containers) |
| `docker-compose.yml` | Service orchestration, networking, volume mounts |

## Important Patterns

- **Flags flow**: `flags.json` → mounted into gateway and web-traversal at `/app/flags.json`. Shell-backend receives flags via environment variables (`FLAG_STAGE2`, `FLAG_STAGE3`).
- **JWT**: Gateway issues unsigned JWTs (`alg: none`). Frontend stores them in a `ctf_session` cookie and polls every 2 seconds for manual modifications. This is an intentional vulnerability.
- **Credentials**: Hardcoded `ctf_user` / `r3str1ct3d_2026` for shell access (revealed via Stage 1 exploitation).
- **Frontend state**: The `useFlagJWT` hook manages all CTF progress. No database — everything is client-side cookies + in-memory gateway sessions.
- **Docker socket**: Gateway requires `/var/run/docker.sock` mount to exec into shell-backend.

## Vulnerabilities Are Intentional

The following are by design for educational purposes — do not "fix" them:
1. Path traversal in `app.py` (`os.path.join` without sanitization)
2. Command injection in `restricted_shell.py` (`shell=True` with first-word-only whitelist)
3. Privilege escalation via `/usr/bin/find` in sudoers (GTFOBin)
4. JWT `alg: none` in gateway

### Stage 1 `cd`/`ls` Behavior (WebExplorer.tsx)

The simulated shell treats **all** paths as relative to the current directory. These rules must be preserved:
- **Absolute paths fail naturally**: `cd /data/secrets` is treated as relative → resolves to `/mnt/shell/data/secrets` → not found. Do NOT add explicit permission-denied blocks.
- **Relative traversal succeeds**: `cd ../../data/secrets` works, `pwd` shows `/mnt/shell/../../data/secrets`.
- **`ls` works at `/data/secrets`**: Shows `credentials.txt` from `VIRTUAL_FILES`. No permission-denied blocks on `ls` either.
- **`/data` stays empty**: `/data`'s `VIRTUAL_FILES` array is `[]` — `secrets` is NOT listed, keeping the directory undiscoverable.
- **The intended exploit** is `cat ../../data/secrets/credentials.txt` (sent raw to the API, bypassing the virtual filesystem).

Run `node frontend/tests/path-resolution.test.mjs` to verify these invariants.

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
