FROM node:20-alpine

WORKDIR /app

# Copy package configuration files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the TypeScript project
RUN npm run build

# Expose the API port
EXPOSE 3001

# Run the production build
CMD ["npm", "start"]
