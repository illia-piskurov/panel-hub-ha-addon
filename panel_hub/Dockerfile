ARG BUILD_FROM
FROM $BUILD_FROM as base

# Multi-stage build: First stage with Bun
FROM oven/bun:1-alpine as bun-stage

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lock* ./
RUN bun install --frozen-lockfile

# Copy source code
COPY src ./src
COPY tsconfig.json ./

# Second stage: Copy Bun and app to Home Assistant base
FROM base

# Install bash for bashio
RUN apk add --no-cache bash

WORKDIR /app

# Copy Bun binary from bun-stage
COPY --from=bun-stage /usr/local/bin/bun /usr/local/bin/bun

# Copy installed dependencies and source code
COPY --from=bun-stage /app /app

# Copy run script
COPY run.sh /
RUN chmod a+x /run.sh

EXPOSE 8000

CMD ["/run.sh"]
