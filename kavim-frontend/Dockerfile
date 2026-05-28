# Stage 1: build React app with /api as the API base URL
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json pnpm-lock.yaml* ./
RUN apk add --no-cache git && npm install --legacy-peer-deps && npm install ajv@^8 --legacy-peer-deps
COPY . .
ENV REACT_APP_API_URL=/api
RUN npm run build

# Stage 2: serve with nginx
FROM nginx:alpine
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout /etc/nginx/ssl/key.pem -out /etc/nginx/ssl/cert.pem -subj "/CN=kavim-frontend.eastus.azurecontainer.io"
COPY --from=build /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80 443
