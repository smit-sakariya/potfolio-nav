FROM node:20-alpine

WORKDIR /app

# Install dependencies first for better layer caching
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Expose API port
EXPOSE 3000

# Start NestJS production build
CMD ["npm", "run", "start:prod"]
