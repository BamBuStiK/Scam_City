# frontend/Dockerfile
FROM node:20

WORKDIR /app

# Copy only dependency manifests first (for better caching)
COPY package.json package-lock.json* ./

# Install dependencies inside the Linux container
RUN npm install

# Now copy the rest of the source code
COPY . .

EXPOSE 5173

# Expose dev server to host
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]