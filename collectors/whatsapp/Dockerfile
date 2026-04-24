FROM node:20-slim

WORKDIR /app

RUN apt-get update && apt-get install -y     ca-certificates     wget     git     && rm -rf /var/lib/apt/lists/*

RUN npm install @whiskeysockets/baileys pino axios qrcode-terminal

COPY whatsapp_collector.js .

CMD ["node", "whatsapp_collector.js"]
