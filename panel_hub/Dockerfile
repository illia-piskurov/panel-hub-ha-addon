FROM oven/bun:1-alpine

# Install bash for potential scripting needs
RUN apk add --no-cache bash curl jq

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]
