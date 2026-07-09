# ---- Build stage ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---- Production stage (static assets served by nginx) ----
FROM nginx:stable-alpine AS production
# SPA routing + API proxy config.
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null http://localhost:80/ || exit 1
CMD ["nginx", "-g", "daemon off;"]
