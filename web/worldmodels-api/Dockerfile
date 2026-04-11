# Dockerfile Optimizado para Next.js SSR
FROM node:20-alpine

# Instalamos gcompat para compatibilidad con Next.js
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiamos primero las dependencias para mayor velocidad
COPY package*.json ./
RUN npm install

# Copiamos el resto de los archivos
COPY . .

# IMPORTANT: Damos permisos de ejecución a los binarios de Next
RUN chmod -R +x node_modules/.bin

# Construimos la aplicación
RUN npm run build

# Configuramos el puerto
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

# Iniciamos el servidor
CMD ["npm", "start"]
