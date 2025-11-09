# Sử dụng image Nginx chính thức
FROM nginx:alpine

# Xóa file cấu hình mặc định nếu muốn tự tùy chỉnh
# RUN rm /etc/nginx/conf.d/default.conf

# Copy toàn bộ mã nguồn vào thư mục web root của Nginx
COPY . /usr/share/nginx/html

# Mở port 80
EXPOSE 80

# Khởi động Nginx
CMD ["nginx", "-g", "daemon off;"]
