# Sử dụng Node.js LTS làm base image
FROM node:18-alpine AS build

# Tạo thư mục làm việc
WORKDIR /app

# Sao chép file cấu hình package trước (tối ưu cache)
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Sao chép toàn bộ mã nguồn
COPY . .

# Build ứng dụng (sẽ tạo ra thư mục dist)
RUN npm run build

# Giai đoạn chạy app - dùng image nhẹ nginx
FROM nginx:1.27-alpine

# Xóa file cấu hình mặc định của Nginx
RUN rm -rf /usr/share/nginx/html/*

# Sao chép build output từ stage trước
COPY --from=build /app/dist /usr/share/nginx/html

# Expose cổng 80
EXPOSE 80

# Chạy nginx foreground
CMD ["nginx", "-g", "daemon off;"]
