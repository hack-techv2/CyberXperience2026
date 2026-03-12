#!/usr/bin/env python3
"""Stage 3 tests: Privilege escalation config validation."""

import io
import os
import sys

# Force UTF-8 output on Windows
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

# Resolve paths relative to this script's directory
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
REPO_ROOT = os.path.join(SCRIPT_DIR, '..')
SHELL_BACKEND = os.path.join(REPO_ROOT, 'services', 'shell-backend')

# --- Replicate Stage 2 whitelist for cross-stage validation ---
ALLOWED_COMMANDS = ['ls', 'pwd', 'whoami', 'id', 'help', 'date', 'echo', 'clear', 'exit']

def get_base_command(cmd_input):
    return cmd_input.strip().split()[0] if cmd_input.strip() else ""

def is_command_allowed(cmd_input):
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

def read_file(relative_path):
    path = os.path.join(SHELL_BACKEND, relative_path)
    with open(path, 'r') as f:
        return f.read()

def read_dockerfile():
    with open(os.path.join(SHELL_BACKEND, 'Dockerfile'), 'r') as f:
        return f.read()

# ========== Sudoers file ==========
print("\nsudoers file (ctf_user_sudoers)")

sudoers_path = os.path.join(SHELL_BACKEND, 'ctf_user_sudoers')

test("file exists",
     lambda: assert_true(os.path.isfile(sudoers_path), f"Not found: {sudoers_path}"))

def check_sudoers_rule():
    content = read_file('ctf_user_sudoers')
    assert 'ctf_user ALL=(ALL) NOPASSWD: /usr/bin/find' in content

test("contains correct sudo rule", check_sudoers_rule)

def check_single_rule():
    content = read_file('ctf_user_sudoers')
    rules = [l.strip() for l in content.splitlines()
             if l.strip() and not l.strip().startswith('#')]
    assert len(rules) == 1, f"Expected 1 rule, found {len(rules)}: {rules}"

test("only one non-comment rule exists", check_single_rule)

def check_full_path():
    content = read_file('ctf_user_sudoers')
    assert '/usr/bin/find' in content, "Must use full path /usr/bin/find"

test("command uses full path /usr/bin/find", check_full_path)

def check_no_wildcard():
    content = read_file('ctf_user_sudoers')
    rules = [l.strip() for l in content.splitlines()
             if l.strip() and not l.strip().startswith('#')]
    for rule in rules:
        parts = rule.split('NOPASSWD:')
        if len(parts) > 1:
            assert parts[1].strip() != 'ALL', "Must not have wildcard ALL command"

test("no wildcard ALL command entries", check_no_wildcard)

# ========== setup_flags.sh ==========
print("\nsetup_flags.sh")

setup_path = os.path.join(SHELL_BACKEND, 'setup_flags.sh')

test("file exists",
     lambda: assert_true(os.path.isfile(setup_path), f"Not found: {setup_path}"))

test("stage 2 flag written to /home/ctf_user/flag2.txt",
     lambda: assert_true('/home/ctf_user/flag2.txt' in read_file('setup_flags.sh')))

test("stage 2 flag file has chmod 644",
     lambda: assert_true('chmod 644 /home/ctf_user/flag2.txt' in read_file('setup_flags.sh')))

test("stage 2 flag file chown ctf_user:ctf_user",
     lambda: assert_true('chown ctf_user:ctf_user /home/ctf_user/flag2.txt' in read_file('setup_flags.sh')))

test("stage 3 flag written to /root/root_flag.txt",
     lambda: assert_true('/root/root_flag.txt' in read_file('setup_flags.sh')))

test("stage 3 flag file has chmod 600",
     lambda: assert_true('chmod 600 /root/root_flag.txt' in read_file('setup_flags.sh')))

def check_no_chown_root_flag():
    content = read_file('setup_flags.sh')
    for line in content.splitlines():
        if 'chown' in line and 'root_flag' in line:
            assert False, f"Found chown on root_flag.txt: {line.strip()}"

test("no chown on root_flag.txt (stays root-owned)", check_no_chown_root_flag)

# ========== Dockerfile ==========
print("\nDockerfile")

test("file exists",
     lambda: assert_true(os.path.isfile(os.path.join(SHELL_BACKEND, 'Dockerfile'))))

test("ctf_user created with useradd",
     lambda: assert_true('useradd' in read_dockerfile()))

test("sudo package installed",
     lambda: assert_true('sudo' in read_dockerfile()))

test("findutils package installed",
     lambda: assert_true('findutils' in read_dockerfile()))

test("sudoers file copied to /etc/sudoers.d/ctf_user",
     lambda: assert_true('/etc/sudoers.d/ctf_user' in read_dockerfile()))

test("sudoers permissions 440",
     lambda: assert_true('chmod 440 /etc/sudoers.d/ctf_user' in read_dockerfile()))

# ========== GTFOBin exploit validation ==========
print("\nGTFOBin exploit validation")

test("'sudo' is NOT in ALLOWED_COMMANDS",
     lambda: assert_false('sudo' in ALLOWED_COMMANDS))

def check_combined_payload():
    payload = 'echo x | sudo find /root -name root_flag.txt -exec cat {} \\;'
    assert is_command_allowed(payload), "Combined payload should pass whitelist"

test("combined payload passes is_command_allowed()", check_combined_payload)

test("direct 'sudo find ...' is blocked",
     lambda: assert_false(is_command_allowed('sudo find /root -name root_flag.txt')))

# ========== Summary ==========
print(f"\n{passed} passed, {failed} failed\n")
sys.exit(1 if failed > 0 else 0)
