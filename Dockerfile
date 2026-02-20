FROM node:20-alpine

WORKDIR /app

COPY package.json ./
RUN npm install

COPY server.js ./

ENV PORT=3000
ENV MCP_MODE=http

EXPOSE 3000

CMD ["node", "server.js"]
