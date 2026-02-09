# Stage 0 & Stage 1 Bug Fixes

## Completed

- [x] **Issue 1: Stage 0 Auto-Redirect When Reviewing**
  - Removed auto-redirect code in `BabyShell.tsx` (lines 281-284)
  - Updated `BabyShellProgress.tsx` to make current step clickable for returning from review
  - Added tooltip text for current step explaining click-to-return functionality

- [x] **Issue 2: Stage 1 Prompt Showing Normalized Path**
  - Reverted `getPrompt()` in `WebExplorer.tsx` to use raw `currentPath`
  - Prompt now shows `/mnt/shell/..` instead of `/mnt` after `cd ..`

- [x] **Issue 3: Centralized Flag Management**
  - Updated `docker-compose.yml` to mount `flags.json` into web-traversal service
  - Removed `FLAG_STAGE1` environment variable from docker-compose.yml
  - Updated `create_secrets.sh` to read flag from `/app/flags.json` instead of env var
  - Added fallback for missing flags.json

## Files Modified

| File | Changes |
|------|---------|
| `frontend/components/BabyShell.tsx` | Removed auto-redirect on command |
| `frontend/components/BabyShellProgress.tsx` | Allow clicking current step to return from review |
| `frontend/components/WebExplorer.tsx` | Reverted getPrompt() to use raw currentPath |
| `services/web-traversal/create_secrets.sh` | Read flag from flags.json instead of env var |
| `docker-compose.yml` | Mount flags.json into web-traversal service |

## Verification Required

1. **Stage 0 review mode:**
   - Complete steps 1-5
   - Click step 2 to review
   - Type `ls` command
   - Verify: still viewing step 2 (not auto-redirected)
   - Click current step dot to return to current progress

2. **Stage 1 prompt path:**
   - Start in ~ (`/mnt/shell`)
   - Run `cd ..`
   - Verify: prompt shows `/mnt/shell/..$` (not `/mnt$`)
   - Run `pwd`
   - Verify: output shows `/mnt/shell/..`

3. **Flag output:**
   - Rebuild Docker containers: `docker-compose up --build`
   - Run `cat ../../data/secrets/credentials.txt`
   - Verify: shows `FLAG{p4th_tr4v3rs4l_0pen_d00r}` (single `}`)
   - Verify: flag validates correctly
