# Use Node.js base image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Use nginx to serve the static files
FROM nginx:alpine

# Create a non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy build output to nginx
COPY --from=builder /app/dist /usr/share/nginx/html

# Set ownership and permissions
RUN chown -R appuser:appgroup /usr/share/nginx/html
RUN chmod -R 755 /usr/share/nginx/html

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]