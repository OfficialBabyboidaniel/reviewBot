FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Create directory for database
RUN mkdir -p /app/data

# Expose port (not really needed for Discord bot, but good practice)
EXPOSE 3000

# Run the bot
CMD ["npm", "start"]