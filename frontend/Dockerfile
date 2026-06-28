FROM node:20

WORKDIR /app

# Install dependencies.
# --legacy-peer-deps is required because @angular/animations 21.2.x has a strict
# peer dep on @angular/core 21.2.x while other Angular packages are pinned to 21.0.x.
# npm ci is preferred over npm install for reproducible builds from package-lock.json.
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps && npm cache clean --force

# Install Angular CLI globally
RUN npm install -g @angular/cli

# Copy application code
COPY . .

# Expose Angular dev server port
EXPOSE 4200

# Start the development server
CMD ["npm", "start", "--", "--host", "0.0.0.0"]