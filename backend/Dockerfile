FROM node:20-slim AS base

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

FROM base AS dev

EXPOSE 3000

CMD ["npm", "run", "dev"]

FROM base AS prod

EXPOSE 3000

CMD ["npm", "start"]
