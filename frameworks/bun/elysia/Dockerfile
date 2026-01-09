FROM oven/bun:1-alpine

WORKDIR /app

COPY src/package.json .

RUN bun install --production

COPY src/index.ts .

EXPOSE 8080
CMD ["bun", "run", "index.ts"]