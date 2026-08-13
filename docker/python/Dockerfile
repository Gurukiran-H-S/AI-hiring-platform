FROM python:3.10-slim

# Create a non-root sandbox user
RUN useradd -m -s /bin/bash sandbox

# Set up working directory
WORKDIR /app
RUN chown -R sandbox:sandbox /app

# Switch to non-root user
USER sandbox
