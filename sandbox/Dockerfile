FROM python:3.12-slim
WORKDIR /sandbox

# Abhängigkeiten installieren
RUN pip install --no-cache-dir flask

# Mountpoint für persistente Jobs
VOLUME ["/sandboxRun"]

# Sandbox API kopieren
COPY sandbox_api.py /sandbox/sandbox_api.py

# Container beim Starten die API ausführen lassen
CMD ["python3", "/sandbox/sandbox_api.py"]
