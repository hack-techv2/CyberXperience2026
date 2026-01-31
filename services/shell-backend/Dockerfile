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

# Create flag files
RUN echo "FLAG{c0mm4nd_1nj3ct10n_p1p3_dr34m}" > /home/ctf_user/flag2.txt && \
    chown ctf_user:ctf_user /home/ctf_user/flag2.txt && \
    chmod 644 /home/ctf_user/flag2.txt

RUN echo "FLAG{gtf0_f1nd_r00t_4ccess_2026}" > /root/root_flag.txt && \
    chmod 600 /root/root_flag.txt

# Setup the restricted shell
COPY restricted_shell.py /home/ctf_user/restricted_shell.py
RUN chmod +x /home/ctf_user/restricted_shell.py

# Create a welcome message
RUN echo "Welcome to Shell Backend Service" > /etc/motd

WORKDIR /home/ctf_user

# The container will be accessed via the gateway
CMD ["tail", "-f", "/dev/null"]
