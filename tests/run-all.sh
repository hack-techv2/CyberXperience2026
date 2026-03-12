#!/usr/bin/env bash
# Run all CTF challenge test stages

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
failures=0

echo "=== CyberXperience 2026 - Challenge Tests ==="

echo ""
echo "--- Stage 1: Path Traversal (frontend logic) ---"
if node "$SCRIPT_DIR/stage1.test.mjs"; then
  echo "Stage 1: PASS"
else
  echo "Stage 1: FAIL"
  ((failures++))
fi

echo ""
echo "--- Stage 2: Command Injection (restricted shell) ---"
if python3 "$SCRIPT_DIR/stage2.test.py"; then
  echo "Stage 2: PASS"
else
  echo "Stage 2: FAIL"
  ((failures++))
fi

echo ""
echo "--- Stage 3: Privilege Escalation (config validation) ---"
if python3 "$SCRIPT_DIR/stage3.test.py"; then
  echo "Stage 3: PASS"
else
  echo "Stage 3: FAIL"
  ((failures++))
fi

echo ""
echo "--- Stage 4: Victory Button (JWT verification) ---"
if node "$SCRIPT_DIR/stage4.test.mjs"; then
  echo "Stage 4: PASS"
else
  echo "Stage 4: FAIL"
  ((failures++))
fi

echo ""
echo "=== Results: $((4 - failures))/4 stages passed ==="

exit $failures
