FROM node:18-alpine AS builder

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build-time argument for Next.js API endpoint
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the Next.js application
RUN npm run build

# Production runner stage
FROM node:18-alpine AS runner

WORKDIR /app

# Copy necessary files from the builder
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules

# Expose Next.js port
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
