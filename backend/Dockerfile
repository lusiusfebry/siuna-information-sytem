# ---- Build stage ----
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
# Reproducible install from the lockfile (fails if lock is out of sync).
RUN npm ci
COPY . .
RUN npm run build

# ---- Production stage ----
FROM node:18-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
# Only production dependencies in the final image.
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# Uploads dir owned by the non-root runtime user.
RUN mkdir -p uploads && chown -R node:node /app
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"
CMD ["node", "dist/index.js"]
