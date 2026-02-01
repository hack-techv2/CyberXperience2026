#!/bin/sh
# Create the secret credentials file using environment variables

cat > /data/secrets/credentials.txt << EOF
=== SYSTEM CREDENTIALS ===

FLAG1: ${FLAG_STAGE1:-FLAG{missing_flag_stage1}}

Shell Access Credentials:
Username: ctf_user
Password: r3str1ct3d_2026
EOF

echo "Secrets file created with environment-based flag"
