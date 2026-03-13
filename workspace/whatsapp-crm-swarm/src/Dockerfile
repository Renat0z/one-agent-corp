FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache python3 make g++
COPY package*.json ./
RUN npm install --production
COPY --from=builder /app/dist ./dist
RUN mkdir -p /app/data
EXPOSE 3000
CMD ["npm", "start"]