# Mini ERP AI Service

Standalone Python FastAPI service that provides AI capabilities to the Mini ERP project.

## Overview

This service serves as the AI foundation for Mini ERP. Future integration with Grok API will be implemented in a later phase.

## Requirements

- Python 3.11+
- Pip / Virtual environment

## Setup & Local Development

1. Create a virtual environment:
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   # Edit .env and fill in configuration values if needed
   ```

4. Run the service locally:
   ```bash
   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Endpoints

- `GET /` - Root status check.
- `GET /health` - Health check endpoint.
- `/docs` - Interactive Swagger documentation.

## Grok Integration

Grok API and AI chat capabilities will be implemented in a later phase.
