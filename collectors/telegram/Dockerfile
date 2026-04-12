FROM python:3.9-slim

WORKDIR /app

RUN pip install --no-cache-dir telethon requests

COPY telegram_collector.py .

CMD ["python", "telegram_collector.py"]
