FROM python:3.13-slim

WORKDIR /app

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# LightGBM OpenMP runtime
RUN apt-get update \
    && apt-get install -y --no-install-recommends libgomp1 \
    && rm -rf /var/lib/apt/lists/*

COPY pipeline/requirements.txt ./pipeline/requirements.txt
RUN pip install --no-cache-dir \
        -r pipeline/requirements.txt \
        "psycopg[binary]>=3.2,<4" \
        "python-dotenv>=1,<2"

COPY pipeline ./pipeline
COPY metadata ./metadata
COPY pipeline_container ./pipeline_container
COPY samples ./samples

CMD ["python", "pipeline_container/watch_pipeline.py"]
