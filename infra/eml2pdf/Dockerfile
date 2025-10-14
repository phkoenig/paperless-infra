# syntax=docker/dockerfile:1
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_INSTALL_DIR=/root/.local/bin

RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh
ENV PATH="${UV_INSTALL_DIR}:$PATH"

WORKDIR /app

# Install runtime deps with uv (system site-packages)
RUN uv pip install --system requests watchdog

COPY app.py /app/app.py

CMD ["python", "/app/app.py"]
