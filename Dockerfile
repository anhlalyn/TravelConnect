# ==========================================
# Stage 1: Build Frontend (React + Vite)
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Sao chép package.json và cài đặt dependencies
COPY frontend/package*.json ./
RUN npm install

# Sao chép mã nguồn Frontend
COPY frontend/ ./

# Định nghĩa các biến môi trường tại thời điểm build (Vite)
# Sử dụng đường dẫn tương đối (relative path) để tự động tương thích với bất kỳ Domain/Cloud nào
ARG VITE_API_BASE_URL=/api
ARG VITE_APP_BASE_URL=
ARG VITE_SOCKET_URL=

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_APP_BASE_URL=$VITE_APP_BASE_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL

# Build Frontend sang thư mục dist/
RUN npm run build

# ==========================================
# Stage 2: Build & Run Backend (Express)
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Thiết lập biến môi trường production
ENV NODE_ENV=production

# Sao chép package.json của backend và cài đặt production dependencies
COPY backend/package*.json ./
RUN npm install --omit=dev

# Sao chép mã nguồn Backend vào container
COPY backend/ ./

# Sao chép thư mục build của Frontend vào thư mục public của Backend
COPY --from=frontend-builder /app/frontend/dist ./public

# Expose cổng chạy của ứng dụng (Express chạy ở port 3000)
EXPOSE 3000

# Khởi chạy server Node.js trực tiếp
CMD ["node", "server.js"]
