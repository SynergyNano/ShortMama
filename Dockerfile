# Next.js 앱 (Railway "app" 서비스 등)
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache python3 make g++ curl

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
