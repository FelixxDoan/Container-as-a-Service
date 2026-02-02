FROM micro-node-base:local AS builder

COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm --filter user-api build

FROM micro-node-base:local AS runner
WORKDIR /app

COPY --from=builder /app/package.json .
COPY --from=builder /app/pnpm-lock.yaml .
COPY --from=builder /app/pnpm-workspace.yaml .

# Copy workspace packages
COPY --from=builder /app/packages ./packages

# Copy service
COPY --from=builder /app/apps/user-api ./apps/user-api

# Install prod dependencies
RUN pnpm install --prod --frozen-lockfile

WORKDIR /app/apps/user-api
CMD ["npm", "start"]
