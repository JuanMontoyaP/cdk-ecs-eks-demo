# ----------------------------
# Builder stage
# ----------------------------
FROM python:3.14-slim-trixie AS builder

# Copy uv binaries
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /usr/local/bin/

# Environment settings
ENV UV_PROJECT_ENVIRONMENT=/opt/venv \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

# Workdir inside the container for the Python app
WORKDIR /app

# Copy only Python app dependency files (better layer caching)
# Assuming repo structure:
#   /app/pyproject.toml
#   /app/uv.lock
COPY app/pyproject.toml app/uv.lock ./

# Create venv and install dependencies
RUN uv sync --frozen --no-cache

# Copy Python application source
# Assuming repo structure:
#   /app/src/...
COPY app/src ./src

# ----------------------------
# Runtime stage
# ----------------------------
FROM python:3.14-slim-trixie

# Security & performance
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

WORKDIR /app

# Copy virtualenv and app from builder
COPY --from=builder /opt/venv /opt/venv
COPY --from=builder /app /app

EXPOSE 80

# Adjust the entrypoint to your actual module path
# If your FastAPI app is in app/src/app/main.py (Python module: app.main),
# you probably want:
CMD ["fastapi", "run", "src/main.py", "--host", "0.0.0.0", "--port", "80"]
