#!/bin/sh
# Create flag files using environment variables

# Create flag2.txt (command injection flag)
echo "${FLAG_STAGE2:-ASG{missing_flag_stage2}}" > /home/ctf_user/flag2.txt
chown ctf_user:ctf_user /home/ctf_user/flag2.txt
chmod 644 /home/ctf_user/flag2.txt

# Create root_flag.txt (privilege escalation flag)
echo "${FLAG_STAGE3:-ASG{missing_flag_stage3}}" > /root/root_flag.txt
chmod 600 /root/root_flag.txt

echo "Flag files created with environment-based flags"
