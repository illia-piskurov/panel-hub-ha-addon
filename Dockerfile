FROM oven/bun:latest

WORKDIR /app

COPY . .

EXPOSE 8000

# RUN bun install
CMD ["bun", "run", "index.ts"]