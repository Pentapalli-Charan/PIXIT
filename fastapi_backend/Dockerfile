# --- Build Stage ---
FROM python:3.11-slim AS builder

WORKDIR /app

# Prevent Python from writing .pyc files and buffer outputs
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Setup virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# --- Runtime Stage ---
FROM python:3.11-slim AS runner

WORKDIR /app

# Ensure we use the virtualenv binaries
ENV PATH="/opt/venv/bin:$PATH"
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Copy the virtual environment compiled in build stage
COPY --from=builder /opt/venv /opt/venv

# Copy code
COPY . .

# Expose FastAPI default port
EXPOSE 8000

# Run Uvicorn production server
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
