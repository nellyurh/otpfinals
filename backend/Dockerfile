FROM python:3.11-slim

WORKDIR /app

# Install only required packages
RUN pip install fastapi uvicorn

# Copy application code
COPY . .

# Start command
CMD ["sh", "-c", "python -m uvicorn test_app:app --host 0.0.0.0 --port ${PORT:-8001}"]
