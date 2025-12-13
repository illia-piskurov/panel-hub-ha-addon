ARG BUILD_FROM
FROM $BUILD_FROM

# Install Bun
RUN apk add --no-cache curl unzip \
    && curl -fsSL https://bun.sh/install | bash \
    && ln -s /root/.bun/bin/bun /usr/local/bin/bun

# Set working directory
WORKDIR /app

# Copy package files first (for better caching)
COPY package.json bun.lock* ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Expose port
EXPOSE 8000

# Start the application
CMD ["bun", "run", "src/index.ts"]
