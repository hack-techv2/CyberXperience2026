#!/bin/sh
# Create the secret credentials file using flags.json as single source of truth

# Read flag from flags.json (mounted at /app/flags.json)
FLAG_VALUE=$(cat /app/flags.json 2>/dev/null | grep -o '"value": "ASG{[^"]*"' | head -1 | sed 's/"value": "//' | tr -d '"')

# Fallback if flags.json isn't available
if [ -z "$FLAG_VALUE" ]; then
    FLAG_VALUE="ASG{missing_flag}"
fi

cat > /data/secrets/credentials.txt << EOF
=== SYSTEM CREDENTIALS ===

FLAG1: ${FLAG_VALUE}

Shell Access Credentials:
Username: ctf_user
Password: r3str1ct3d_2026
EOF

echo "Secrets file created from flags.json"
