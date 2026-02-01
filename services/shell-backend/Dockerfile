FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

# Install necessary packages
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    sudo \
    openssh-server \
    findutils \
    && rm -rf /var/lib/apt/lists/*

# Create ctf_user
RUN useradd -m -s /bin/bash ctf_user && \
    echo "ctf_user:r3str1ct3d_2026" | chpasswd

# Setup sudo permissions (VULNERABLE)
COPY ctf_user_sudoers /etc/sudoers.d/ctf_user
RUN chmod 440 /etc/sudoers.d/ctf_user

# Setup the restricted shell
COPY restricted_shell.py /home/ctf_user/restricted_shell.py
RUN chmod +x /home/ctf_user/restricted_shell.py

# Create /app directory and copy the startup script
RUN mkdir -p /app
COPY setup_flags.sh /app/setup_flags.sh
# Fix Windows line endings and make executable
RUN sed -i 's/\r$//' /app/setup_flags.sh && chmod +x /app/setup_flags.sh

# Create a welcome message
RUN echo "Welcome to Shell Backend Service" > /etc/motd

WORKDIR /home/ctf_user

# Use startup script that injects environment variables into flag files
CMD ["/bin/sh", "-c", "/app/setup_flags.sh && tail -f /dev/null"]
