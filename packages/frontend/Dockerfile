FROM node:20-bookworm-slim AS builder

WORKDIR /app

COPY packages/frontend/package.json ./package.json
RUN npm install

COPY tsconfig.base.json /tsconfig.base.json
COPY packages/frontend/tsconfig.json ./tsconfig.json
COPY packages/frontend/vite.config.ts ./vite.config.ts
COPY packages/frontend/react-router.config.ts ./react-router.config.ts
COPY packages/frontend/components.json ./components.json
COPY packages/frontend/app ./app
COPY packages/frontend/public ./public

RUN npm run build
RUN npm prune --omit=dev

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/build ./build

EXPOSE 4173
CMD ["npm", "run", "start"]
