FROM node:18-alpine

# Cài pnpm và các tool build native (nếu cần cho bcrypt/redis)
RUN npm install -g pnpm && \
    apk add --no-cache python3 make g++

WORKDIR /app
