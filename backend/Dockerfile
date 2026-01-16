FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Railway provides PORT dynamically
ENV PORT=8001

# Start command - uses Railway's PORT variable
CMD uvicorn server:app --host 0.0.0.0 --port $PORT
