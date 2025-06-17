# Use Node.js 22 LTS with Alpine Linux for smaller image
FROM node:22-alpine

# Install Python and build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    gcc \
    libc-dev

# Set working directory
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Set environment variables for build
ENV NODE_ENV=production

# Install dependencies
RUN pnpm install --frozen-lockfile

# Approve build scripts for packages that need them
RUN pnpm approve-builds

# Copy source code
COPY . .

# Build the application
RUN pnpm run build

# Expose port
EXPOSE 3000

# Start the application (NO pnpm zero here!)
CMD ["pnpm", "start"]