#!/usr/bin/env python3
"""
CyberXperience 2026 - Stage 2 & 3: Restricted Shell
A "secure" shell that only allows specific commands.

VULNERABILITY: Uses shell=True with unsanitized input, allowing
command injection via pipe (|) and other shell metacharacters.
"""

import subprocess
import sys
import os

# Ensure unbuffered output for PTY
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

# Allowed commands whitelist
ALLOWED_COMMANDS = ['ls', 'pwd', 'whoami', 'id', 'help', 'date', 'echo', 'clear', 'exit']

BANNER = """
╔═══════════════════════════════════════════════════════════════════╗
║           CyberXperience 2026 - Restricted Shell v1.0             ║
║═══════════════════════════════════════════════════════════════════║
║  Welcome to the secure shell environment.                         ║
║  Only authorized commands are permitted for your safety.          ║
║                                                                   ║
║  Type 'help' to see available commands.                           ║
╚═══════════════════════════════════════════════════════════════════╝
"""

HELP_TEXT = """
Available Commands:
  ls       - List directory contents
  pwd      - Print working directory
  whoami   - Display current user
  id       - Display user identity
  date     - Show current date/time
  echo     - Print text
  clear    - Clear the screen
  help     - Show this help message
  exit     - Exit the shell

Note: For security, only these commands are permitted.
"""

def get_base_command(cmd_input):
    """Extract the base command (first word) from input"""
    return cmd_input.strip().split()[0] if cmd_input.strip() else ""

def is_command_allowed(cmd_input):
    """
    Check if the command is in our whitelist.
    VULNERABILITY: Only checks the first word, ignoring pipes and other operators.
    """
    base_cmd = get_base_command(cmd_input)
    return base_cmd.lower() in ALLOWED_COMMANDS

def execute_command(cmd_input):
    """
    Execute the command if it passes the whitelist check.
    VULNERABILITY: Uses shell=True, allowing shell metacharacters to be interpreted.
    """
    if not cmd_input.strip():
        return

    base_cmd = get_base_command(cmd_input)

    if base_cmd.lower() == 'exit':
        print("Goodbye!", flush=True)
        sys.exit(0)

    if base_cmd.lower() == 'help':
        print(HELP_TEXT, flush=True)
        return

    if base_cmd.lower() == 'clear':
        # Use ANSI escape codes instead of os.system for better PTY compatibility
        print('\033[2J\033[H', end='', flush=True)
        return

    if not is_command_allowed(cmd_input):
        print(f"Error: Command '{base_cmd}' is not permitted.", flush=True)
        print("Type 'help' to see available commands.", flush=True)
        return

    try:
        # VULNERABLE: shell=True allows command injection via | ; && etc.
        result = subprocess.run(
            cmd_input,
            shell=True,
            capture_output=True,
            text=True,
            timeout=10
        )
        if result.stdout:
            print(result.stdout, end='', flush=True)
        if result.stderr:
            print(result.stderr, end='', flush=True, file=sys.stderr)
    except subprocess.TimeoutExpired:
        print("Error: Command timed out.", flush=True)
    except Exception as e:
        print(f"Error executing command: {e}", flush=True)

def main():
    print(BANNER, flush=True)

    while True:
        try:
            # Get user input
            sys.stdout.write("rshell> ")
            sys.stdout.flush()
            cmd_input = sys.stdin.readline()

            if not cmd_input:  # EOF
                print("\nGoodbye!", flush=True)
                break

            cmd_input = cmd_input.strip()
            execute_command(cmd_input)

        except KeyboardInterrupt:
            print("\nUse 'exit' to quit.", flush=True)
        except Exception as e:
            print(f"Shell error: {e}", flush=True)

if __name__ == "__main__":
    main()
