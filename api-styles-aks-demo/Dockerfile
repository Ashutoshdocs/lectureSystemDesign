# Multi-protocol demo image: REST/GraphQL/WS/SOAP/Webhooks on 3000, gRPC on 50051
FROM node:20-alpine

WORKDIR /app

# Install deps first for better layer caching
COPY app/package*.json ./
RUN npm install --omit=dev

# App source (includes proto/ and public/)
COPY app/ ./

EXPOSE 3000 50051

# Drop root
USER node

CMD ["node", "server.js"]
