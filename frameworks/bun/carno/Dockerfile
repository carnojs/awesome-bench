FROM oven/bun:1-alpine

WORKDIR /app

COPY package.json tsconfig.json ./
RUN bun install

COPY src ./src

ENV NODE_ENV=production
EXPOSE 8080

CMD ["bun", "src/index.ts"]
