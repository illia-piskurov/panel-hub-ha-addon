FROM oven/bun:1.1-alpine AS builder

WORKDIR /build

COPY frontend/package.json frontend/bun.lock* ./

RUN bun install

COPY frontend ./

RUN bun run build

FROM oven/bun:1.1-alpine

# Install bash for potential scripting needs
RUN apk add --no-cache bash curl jq

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install

# Copy source code
COPY src ./src
COPY tsconfig.json ./

COPY --from=builder /build/dist ./dist

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]
