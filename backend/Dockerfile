FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
# Using tsx in production for simplicity in this project scale
CMD ["npx", "tsx", "src/index.ts"]
