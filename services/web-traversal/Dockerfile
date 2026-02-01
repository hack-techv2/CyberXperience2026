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

# Copy the startup script that creates secrets with environment variables
COPY create_secrets.sh /app/create_secrets.sh
# Fix Windows line endings and make executable
RUN sed -i 's/\r$//' /app/create_secrets.sh && chmod +x /app/create_secrets.sh

# Copy application
COPY app.py .

EXPOSE 5000

# Use startup script that injects environment variable into secrets file
CMD ["/bin/sh", "-c", "/app/create_secrets.sh && gunicorn --bind 0.0.0.0:5000 app:app"]
