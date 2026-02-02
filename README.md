# Micro Repo (Node.js, JS) — Microservices Architecture

This project demonstrates a production-ready **Microservices Architecture** utilizing **Docker**, **Monorepo (pnpm workspaces)**, and **Multi-stage Builds**.

## 🏗️ Architecture Highlights
-   **Monorepo Structure**: Managed via `pnpm workspaces` for efficient dependency sharing between `apps` and `packages`.
-   **Containerization**:
    -   **Development**: Optimized for DX (Developer Experience) with hot-reloading and shared volume mounts.
    -   **Production**: Fully isolated, immutable Docker images for each service (located in `docker/`).
-   **Services**:
    -   `auth-api`: Authentication & Identity service.
    -   `user-api`: User management.
    -   `class-api`: Core business logic.
    -   `gateway`: API Gateway using Traefik.

## 🚀 Getting Started (Development)
To run this project locally with hot-reloading:

```bash
# 1. Prepare environment
corepack enable || true
pnpm --version

# 2. Setup (Copy .env files)
# Run this so you don't have to config anything!
cp packages/envs/.env.example packages/envs/.env.shared
cp packages/envs/.env.admin.example packages/envs/.env.admin
cp packages/envs/.env.auth.example packages/envs/.env.auth
cp packages/envs/.env.user.example packages/envs/.env.user
cp packages/envs/.env.class-api.example packages/envs/.env.class-api
cp packages/envs/.env.gateway.example packages/envs/.env.gateway
cp apps/portal-ui/.env.example apps/portal-ui/.env

# 3. Build the shared base image
pnpm build:base

# 4. Start the entire stack
pnpm dev
```
**Access Points:**
-   **Auth API**: http://localhost:4000/healthz
-   **User API**: http://localhost:3000/healthz

## 🌱 Seeding Data
To populate the database with test data (Users, Teachers, Students, Classes):
```bash
# Ensure MongoDB is running (pnpm dev)
pnpm --filter @micro/db seed
```
**Default Credentials:**
-   **Admin**: `admin@example.com` / `password123`
-   **Teacher**: `teacher1@example.com` / `password123`
-   **Student**: `student1@example.com` / `password123`

## 📦 Building for Production
This project allows building independent, lightweight images for each microservice using multi-stage Docker builds.

**Example: Building the Auth Service**
```bash
docker build -t auth-api:prod -f docker/auth-api.Dockerfile .
```
*Note: These Dockerfiles use multi-stage builds to ensure minimal image size.*
