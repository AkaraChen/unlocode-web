FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY packages/backend/package.json ./package.json
RUN npm install

COPY tsconfig.base.json /tsconfig.base.json
COPY packages/backend/tsconfig.json ./tsconfig.json
COPY packages/backend/src ./src
COPY packages/backend/data ./data

RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["node", "dist/server.js"]
