FROM node:20-alpine AS base
RUN npm install -g pnpm

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/gemini/package.json ./apps/gemini/
RUN pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY --from=deps /app/apps/gemini/node_modules ./apps/gemini/node_modules
COPY packages/shared ./packages/shared
COPY apps/gemini ./apps/gemini
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

# Build shared package first
WORKDIR /app/packages/shared
RUN pnpm build

# Build Gemini service
WORKDIR /app/apps/gemini
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy package files and install production deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/gemini/package.json ./apps/gemini/
RUN pnpm install --prod --frozen-lockfile

# Copy built shared package
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Copy built Gemini service files
COPY --from=builder /app/apps/gemini/dist ./apps/gemini/dist

WORKDIR /app/apps/gemini

EXPOSE 3002

CMD ["node", "dist/index.js"]
