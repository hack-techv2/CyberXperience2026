FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Create directory structure
RUN mkdir -p /app/public /data/secrets

# Create public files (decoys)
RUN echo "Welcome to the Document Retrieval System v1.0" > /app/public/readme.txt && \
    echo "Contact: admin@cyberxperience.local" > /app/public/contact.txt && \
    echo "Terms of Service - Standard usage policy applies." > /app/public/terms.txt

# Create the secret credentials file (FLAG 1)
RUN echo "=== SYSTEM CREDENTIALS ===" > /data/secrets/credentials.txt && \
    echo "" >> /data/secrets/credentials.txt && \
    echo "FLAG1: FLAG{p4th_tr4v3rs4l_0pen_d00r}" >> /data/secrets/credentials.txt && \
    echo "" >> /data/secrets/credentials.txt && \
    echo "Shell Access Credentials:" >> /data/secrets/credentials.txt && \
    echo "Username: ctf_user" >> /data/secrets/credentials.txt && \
    echo "Password: r3str1ct3d_2026" >> /data/secrets/credentials.txt

# Copy application
COPY app.py .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
