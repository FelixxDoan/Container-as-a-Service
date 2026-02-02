# Build stage
FROM node:18-alpine AS build
WORKDIR /app

# Copy package config first for caching
COPY apps/portal-ui/package.json ./
RUN npm install

# Copy source code
COPY apps/portal-ui ./

# Build
RUN npm run build

# Run stage
FROM nginx:1.27-alpine

# Clean default nginx files
RUN rm -rf /usr/share/nginx/html/*

# Copy build output
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
