# FE tĩnh, serve bằng Nginx
FROM nginx:alpine

# Copy cấu hình proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy static files
COPY site/ /usr/share/nginx/html/

# Nên bật gzip (đã cấu hình trong nginx.conf)
