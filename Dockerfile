FROM node:20-alpine

# Use an Alpine image and install required packages
RUN apk add --no-cache libc6-compat openssl ca-certificates
RUN npm install -g pnpm@9.0.0

WORKDIR /app

# Copy the entire monorepo structure
COPY . .

# Install dependencies
RUN pnpm install --no-frozen-lockfile

# Force Prisma to generate the client specifically for Alpine
RUN cd packages/database && npx prisma generate

# Generate Prisma client and build all packages/apps (Turbo build)
RUN pnpm turbo run build

# We will override this command in docker-compose up
CMD ["pnpm", "dev"]
