FROM node:20-alpine

WORKDIR /app

COPY src/package.json .

RUN npm install --production

COPY src/index.js .

EXPOSE 8080

CMD ["node", "index.js"]