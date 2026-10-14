# Build the React app using Node
FROM node:22-alpine AS build

WORKDIR /app

# Copy dependency files first so Docker can reuse the npm install layer
COPY package.json package-lock.json ./
RUN npm ci

# Copy the application source and create the production build
COPY . .
ENV VITE_API_BASE_URL=/api
RUN npm run build

# Serve the built React files using Nginx instead of the Vite dev server
FROM nginx:alpine

# Use our Nginx configuration for serving React and routing API requests
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy the production React build into Nginx's web root
COPY --from=build /app/dist/ /usr/share/nginx/html/

EXPOSE 80