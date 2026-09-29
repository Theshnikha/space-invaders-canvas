# ==============================================================================
# Space Invaders Canvas Game - Production Dockerfile
# Optimized, lightweight static web server using Nginx Alpine (~40MB)
# ==============================================================================

FROM nginx:1.27-alpine

LABEL maintainer="Antigravity Team" \
      description="Space Invaders Canvas Game - Production Retro Arcade Web Application" \
      version="1.0.0"

# Remove default nginx welcome page
RUN rm -rf /usr/share/nginx/html/*

# Copy custom production nginx configuration with caching and healthcheck
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static game assets into Nginx webroot
COPY index.html /usr/share/nginx/html/
COPY css/ /usr/share/nginx/html/css/
COPY js/ /usr/share/nginx/html/js/
COPY assets/ /usr/share/nginx/html/assets/

# Expose HTTP port 80
EXPOSE 80

# Production container healthcheck strategy
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://127.0.0.1/healthz || exit 1

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
