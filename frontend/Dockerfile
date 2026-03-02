# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# # Build args - truyền vào khi build
# ARG API_BASE_URL=https://chatapp-backend-70q4.onrender.com/api
# ARG SOCKET_URL=https://chatapp-backend-70q4.onrender.com

# Set env cho Parcel build
ENV NODE_ENV=production
ENV API_BASE_URL=$API_BASE_URL
ENV SOCKET_URL=$SOCKET_URL

RUN npm run build

# Production stage - dùng serve để serve static files
FROM node:18-alpine AS production

WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

EXPOSE 80

# Serve static files on port 80
CMD ["serve", "-s", "dist", "-l", "80"]