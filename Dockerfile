# Use the official Bun image as a base
FROM oven/bun:1

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy package.json, bun.lockb, and tsconfig.json
COPY package.json bun.lockb tsconfig.json ./

# Install dependencies
RUN bun install --frozen-lockfile

# Copy the rest of the application source code
COPY . .

# Expose the port the app runs on
EXPOSE 3000

# Define the command to run the application
CMD ["bun", "run", "src/index.ts"]