#!/bin/bash
# ==============================================================================
# Script cài đặt tự động Docker & Docker Compose trên Ubuntu Server
# Dự án: TravelConnect
# ==============================================================================

# Dừng script nếu có lỗi xảy ra
set -e

echo "========================================="
echo "  BẮT ĐẦU CÀI ĐẶT DOCKER & DOCKER COMPOSE"
echo "========================================="

# 1. Cập nhật hệ thống
echo "--> 1. Đang cập nhật danh sách gói..."
sudo apt-get update -y

# 2. Cài đặt các gói phụ trợ cần thiết
echo "--> 2. Cài đặt các gói phụ trợ..."
sudo apt-get install -y \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# 3. Thêm khóa GPG chính thức của Docker
echo "--> 3. Thêm khóa GPG của Docker..."
sudo mkdir -m 0755 -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg --yes

# 4. Thiết lập repository ổn định của Docker
echo "--> 4. Thiết lập Docker repository..."
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 5. Cài đặt Docker Engine & Docker Compose Plugin
echo "--> 5. Cài đặt Docker và Docker Compose..."
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# 6. Kích hoạt và chạy Docker service
echo "--> 6. Kích hoạt Docker service..."
sudo systemctl enable docker
sudo systemctl start docker

# 7. Thêm user hiện tại vào nhóm docker (để chạy docker không cần sudo)
echo "--> 7. Cấu hình phân quyền user..."
sudo usermod -aG docker $USER

echo "========================================="
echo "  CÀI ĐẶT HOÀN TẤT!"
echo "========================================="
echo "Vui lòng thực hiện các bước sau:"
echo "1. Đóng kết nối SSH hiện tại (chạy lệnh: exit)."
echo "2. Kết nối SSH lại vào máy chủ để phân quyền Docker mới có hiệu lực."
echo "3. Kiểm tra cài đặt bằng cách chạy lệnh:"
echo "   docker --version"
echo "   docker compose version"
echo "========================================="
