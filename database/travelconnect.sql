-- MySQL dump 10.13  Distrib 8.0.38, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: travelconnect
-- ------------------------------------------------------
-- Server version	9.3.0

CREATE DATABASE IF NOT EXISTS `travelconnect`
/*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */;
USE `travelconnect`;

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bai_viet`
--

DROP TABLE IF EXISTS `bai_viet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bai_viet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` int DEFAULT NULL,
  `id_nhom` int DEFAULT NULL,
  `tieu_de` varchar(255) DEFAULT NULL,
  `noi_dung` text,
  `hinh_anh_json` json DEFAULT NULL,
  `loai_bai_viet` enum('chia_se','quang_cao','lich_trinh') DEFAULT 'chia_se',
  `id_chuyen_di_lien_ket` int DEFAULT NULL,
  `luot_thich` int DEFAULT '0',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `id_kdl_gan_the` int DEFAULT NULL,
  `ten_kdl_gan_the` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  KEY `id_nhom` (`id_nhom`),
  KEY `fk_bai_viet_kdl` (`id_kdl_gan_the`),
  CONSTRAINT `bai_viet_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bai_viet_ibfk_2` FOREIGN KEY (`id_nhom`) REFERENCES `nhom_cong_dong` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_bai_viet_kdl` FOREIGN KEY (`id_kdl_gan_the`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bai_viet`
--

LOCK TABLES `bai_viet` WRITE;
/*!40000 ALTER TABLE `bai_viet` DISABLE KEYS */;
INSERT INTO `bai_viet` VALUES (1,1,NULL,'Review chuyến đi Đà Lạt tự túc','Đà Lạt mùa này săn mây rất đẹp, mọi người nên thử ghé đồi Đa Phú nhé!','[\"https://example.com/anh1.jpg\", \"https://example.com/anh2.jpg\"]','chia_se',NULL,0,'2026-03-20 05:10:46',NULL,NULL),(2,2,NULL,'Review chuyến đi Đà Lạt tự túc','Đà Lạt mùa này săn mây rất đẹp, mọi người nên thử ghé đồi Đa Phú nhé!','[\"https://example.com/anh1.jpg\", \"https://example.com/anh2.jpg\"]','chia_se',NULL,0,'2026-03-20 07:23:58',NULL,NULL),(3,1,NULL,'Khám phá','eeeeeeee','[]','chia_se',NULL,0,'2026-03-25 10:29:00',NULL,NULL),(4,1,NULL,'Khám phá','thật tuyệt vời','[\"1774507516040.jpg\", \"1774507516041.jpg\", \"1774507516042.jpg\"]','chia_se',NULL,0,'2026-03-26 06:45:16',NULL,NULL),(5,1,NULL,'Khám phá','Thật tuyệt vời','[\"1774507539840.jpg\", \"1774507539840.jpg\", \"1774507539841.jpg\"]','chia_se',NULL,0,'2026-03-26 06:45:39',NULL,NULL),(6,1,NULL,'Khám phá','Tuyệt vời','[\"1774507635543.jpg\", \"1774507635543.jpg\", \"1774507635545.jpg\"]','chia_se',NULL,0,'2026-03-26 06:47:15',NULL,NULL),(7,1,NULL,'Khám phá','thật là tuyệt vời','[]','chia_se',NULL,0,'2026-03-26 17:15:01',3,'Đà Lạt Wonder Resort'),(10,1,NULL,'Khám phá','tete','[\"1775707292841.jpg\", \"1775707292841.jpg\", \"1775707292842.jpg\"]','chia_se',NULL,0,'2026-04-09 04:01:32',3,'Đà Lạt Wonder Resort'),(11,2,NULL,'Còn gì Ngon hơn','hôm nay chúng tôi bắt đầu sự kiện đặc biệt nhất khi mọi người trông thấy','[\"1776024002722-69152083.png\"]','chia_se',NULL,0,'2026-04-12 20:00:02',NULL,NULL),(12,2,NULL,'sss','ssss','[\"1776024014371-299165384.png\"]','chia_se',NULL,0,'2026-04-12 20:00:14',NULL,NULL),(13,2,NULL,'aa','aa','[\"1776024179131-114945291.png\"]','chia_se',NULL,0,'2026-04-12 20:02:59',NULL,NULL),(15,2,NULL,'Khám phá','dđ','[]','chia_se',NULL,0,'2026-04-17 08:26:40',NULL,NULL);
/*!40000 ALTER TABLE `bai_viet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bai_viet_da_luu`
--

DROP TABLE IF EXISTS `bai_viet_da_luu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bai_viet_da_luu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` int NOT NULL,
  `id_bai_viet` int NOT NULL,
  `ngay_luu` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `duy_nhat_luu` (`id_nguoi_dung`,`id_bai_viet`),
  KEY `id_bai_viet` (`id_bai_viet`),
  CONSTRAINT `bai_viet_da_luu_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `bai_viet_da_luu_ibfk_2` FOREIGN KEY (`id_bai_viet`) REFERENCES `bai_viet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bai_viet_da_luu`
--

LOCK TABLES `bai_viet_da_luu` WRITE;
/*!40000 ALTER TABLE `bai_viet_da_luu` DISABLE KEYS */;
INSERT INTO `bai_viet_da_luu` VALUES (11,1,5,'2026-04-10 08:33:27'),(13,2,3,'2026-04-12 19:41:58');
/*!40000 ALTER TABLE `bai_viet_da_luu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ban_be`
--

DROP TABLE IF EXISTS `ban_be`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ban_be` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_gui` int DEFAULT NULL,
  `id_nguoi_nhan` int DEFAULT NULL,
  `trang_thai` enum('cho_xac_nhan','da_ket_ban','da_chan') DEFAULT 'cho_xac_nhan',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `duy_nhat_ban_be` (`id_nguoi_gui`,`id_nguoi_nhan`),
  KEY `id_nguoi_nhan` (`id_nguoi_nhan`),
  CONSTRAINT `ban_be_ibfk_1` FOREIGN KEY (`id_nguoi_gui`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ban_be_ibfk_2` FOREIGN KEY (`id_nguoi_nhan`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ban_be`
--

LOCK TABLES `ban_be` WRITE;
/*!40000 ALTER TABLE `ban_be` DISABLE KEYS */;
INSERT INTO `ban_be` VALUES (1,1,2,'da_ket_ban','2026-03-26 04:14:42'),(2,1,3,'cho_xac_nhan','2026-03-27 06:20:53'),(3,1,4,'cho_xac_nhan','2026-04-03 07:06:22');
/*!40000 ALTER TABLE `ban_be` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `binh_luan`
--

DROP TABLE IF EXISTS `binh_luan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `binh_luan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_bai_viet` int DEFAULT NULL,
  `id_nguoi_dung` int DEFAULT NULL,
  `id_cha` int DEFAULT NULL,
  `noi_dung` text,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_bai_viet` (`id_bai_viet`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `binh_luan_ibfk_1` FOREIGN KEY (`id_bai_viet`) REFERENCES `bai_viet` (`id`) ON DELETE CASCADE,
  CONSTRAINT `binh_luan_ibfk_2` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `binh_luan`
--

LOCK TABLES `binh_luan` WRITE;
/*!40000 ALTER TABLE `binh_luan` DISABLE KEYS */;
INSERT INTO `binh_luan` VALUES (1,1,1,NULL,'Bài viết hay quá, cảm ơn bạn đã chia sẻ!','2026-03-20 05:28:57'),(2,1,1,NULL,'gghh','2026-03-25 09:13:20'),(3,2,1,NULL,'1111','2026-03-25 10:20:40'),(4,3,1,NULL,'eeeeeee','2026-03-25 10:29:08'),(5,5,2,NULL,'eee','2026-03-26 07:04:42'),(6,6,1,NULL,'ssss','2026-03-26 07:22:16'),(7,6,1,NULL,'ssss','2026-03-26 07:22:16'),(8,6,1,NULL,'ssss','2026-03-26 07:22:16'),(9,4,1,NULL,'aaaaa','2026-03-26 08:36:33'),(10,7,1,NULL,'xxxxx','2026-04-03 06:19:45'),(14,10,1,NULL,'ddd','2026-04-09 04:02:32'),(15,10,1,NULL,'ssss','2026-04-13 07:49:33'),(16,10,1,NULL,'q','2026-04-13 07:59:31');
/*!40000 ALTER TABLE `binh_luan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chi_tiet_dat_ve`
--

DROP TABLE IF EXISTS `chi_tiet_dat_ve`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chi_tiet_dat_ve` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_dat_ve` int NOT NULL,
  `ten_dich_vu` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gia_dich_vu` decimal(15,2) DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  PRIMARY KEY (`id`),
  KEY `idx_dat_ve` (`id_dat_ve`),
  CONSTRAINT `chi_tiet_dat_ve_ibfk_1` FOREIGN KEY (`id_dat_ve`) REFERENCES `dat_ve` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chi_tiet_dat_ve`
--

LOCK TABLES `chi_tiet_dat_ve` WRITE;
/*!40000 ALTER TABLE `chi_tiet_dat_ve` DISABLE KEYS */;
/*!40000 ALTER TABLE `chi_tiet_dat_ve` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `chuyen_di`
--

DROP TABLE IF EXISTS `chuyen_di`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `chuyen_di` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` int DEFAULT NULL,
  `ten_chuyen_di` varchar(255) DEFAULT NULL,
  `ngay_bat_dau` date DEFAULT NULL,
  `ngay_ket_thuc` date DEFAULT NULL,
  `che_do` enum('public','private') DEFAULT 'public',
  PRIMARY KEY (`id`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `chuyen_di_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `chuyen_di`
--

LOCK TABLES `chuyen_di` WRITE;
/*!40000 ALTER TABLE `chuyen_di` DISABLE KEYS */;
INSERT INTO `chuyen_di` VALUES (1,1,'Hành trình Đà Lạt 2026','2026-05-01','2026-05-05','public'),(3,1,'Hành trình Đà Lạt mộng mơ','2026-05-01','2026-05-05','public');
/*!40000 ALTER TABLE `chuyen_di` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `danh_gia_kdl`
--

DROP TABLE IF EXISTS `danh_gia_kdl`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `danh_gia_kdl` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kdl` int NOT NULL,
  `id_nguoi_dung` int NOT NULL,
  `id_bai_viet` int DEFAULT NULL,
  `so_sao` tinyint DEFAULT NULL,
  `noi_dung` text,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_kdl` (`id_kdl`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `danh_gia_kdl_ibfk_1` FOREIGN KEY (`id_kdl`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `danh_gia_kdl_ibfk_2` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `danh_gia_kdl_chk_1` CHECK ((`so_sao` between 1 and 5))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `danh_gia_kdl`
--

LOCK TABLES `danh_gia_kdl` WRITE;
/*!40000 ALTER TABLE `danh_gia_kdl` DISABLE KEYS */;
INSERT INTO `danh_gia_kdl` VALUES (6,2,1,13,5,'rất ổn','2026-04-17 06:48:29'),(7,2,1,13,3,'hay lắm\n','2026-04-17 06:48:38'),(8,2,2,13,5,'s','2026-04-17 07:24:32'),(9,2,2,NULL,5,'ss','2026-04-17 08:18:04'),(10,2,1,NULL,3,'www','2026-04-24 06:31:57');
/*!40000 ALTER TABLE `danh_gia_kdl` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dat_ve`
--

DROP TABLE IF EXISTS `dat_ve`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dat_ve` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_kdl` int NOT NULL,
  `id_khach` int NOT NULL,
  `ngay_den` datetime NOT NULL,
  `so_ngay` int DEFAULT '1',
  `so_nguoi` int DEFAULT '1',
  `loai_ve` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'standard',
  `ten_khach` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tong_tien` decimal(15,2) DEFAULT '0.00',
  `trang_thai` enum('pending','confirmed','completed','cancelled') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `ghi_chu` text COLLATE utf8mb4_unicode_ci,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `ngay_cap_nhat` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_kdl` (`id_kdl`),
  KEY `idx_khach` (`id_khach`),
  KEY `idx_trang_thai` (`trang_thai`),
  KEY `idx_ngay_den` (`ngay_den`),
  CONSTRAINT `dat_ve_ibfk_1` FOREIGN KEY (`id_kdl`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `dat_ve_ibfk_2` FOREIGN KEY (`id_khach`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dat_ve`
--

LOCK TABLES `dat_ve` WRITE;
/*!40000 ALTER TABLE `dat_ve` DISABLE KEYS */;
INSERT INTO `dat_ve` VALUES (1,3,1,'2026-04-27 02:15:54',1,1,'wallet','hoàng',200000.00,'pending',NULL,'2026-04-26 19:15:54','2026-04-26 19:15:54'),(2,3,1,'2026-04-27 02:17:52',1,1,'wallet','hoàng',1250000.00,'pending',NULL,'2026-04-26 19:17:51','2026-04-26 19:17:51');
/*!40000 ALTER TABLE `dat_ve` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dich_vu`
--

DROP TABLE IF EXISTS `dich_vu`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `dich_vu` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_khu_du_lich` int DEFAULT NULL,
  `ten_dich_vu` varchar(255) DEFAULT NULL,
  `gia_tien` decimal(15,0) DEFAULT NULL,
  `mo_ta` text,
  PRIMARY KEY (`id`),
  KEY `id_khu_du_lich` (`id_khu_du_lich`),
  CONSTRAINT `dich_vu_ibfk_1` FOREIGN KEY (`id_khu_du_lich`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dich_vu`
--

LOCK TABLES `dich_vu` WRITE;
/*!40000 ALTER TABLE `dich_vu` DISABLE KEYS */;
/*!40000 ALTER TABLE `dich_vu` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `giao_dich`
--

DROP TABLE IF EXISTS `giao_dich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `giao_dich` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_khach_hang` int DEFAULT NULL,
  `id_dich_vu` int DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  `tong_tien` decimal(15,0) DEFAULT NULL,
  `phuong_thuc` enum('vnpay','momo','vi_he_thong') DEFAULT NULL,
  `trang_thai` enum('processing','success','failed','refunded') DEFAULT 'processing',
  `ma_giao_dich_ext` varchar(100) DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_khach_hang` (`id_khach_hang`),
  KEY `id_dich_vu` (`id_dich_vu`),
  CONSTRAINT `giao_dich_ibfk_1` FOREIGN KEY (`id_khach_hang`) REFERENCES `nguoi_dung` (`id`),
  CONSTRAINT `giao_dich_ibfk_2` FOREIGN KEY (`id_dich_vu`) REFERENCES `dich_vu` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `giao_dich`
--

LOCK TABLES `giao_dich` WRITE;
/*!40000 ALTER TABLE `giao_dich` DISABLE KEYS */;
/*!40000 ALTER TABLE `giao_dich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ho_so_khu_du_lich`
--

DROP TABLE IF EXISTS `ho_so_khu_du_lich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ho_so_khu_du_lich` (
  `id_nguoi_dung` int NOT NULL,
  `ten_khu_du_lich` varchar(255) NOT NULL,
  `giay_phep_kinh_doanh` varchar(255) DEFAULT NULL,
  `dia_chi_chi_tiet` text,
  `tinh_thanh` varchar(100) DEFAULT NULL,
  `mo_ta_tong_quan` text,
  `vi_do` float DEFAULT NULL,
  `kinh_do` float DEFAULT NULL,
  `trang_thai_duyet` enum('pending','verified','rejected') DEFAULT 'pending',
  `hinh_anh_bia` varchar(255) DEFAULT NULL,
  `ghi_chu_duyet` text,
  `ngay_duyet` datetime DEFAULT NULL,
  PRIMARY KEY (`id_nguoi_dung`),
  CONSTRAINT `ho_so_khu_du_lich_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ho_so_khu_du_lich`
--

LOCK TABLES `ho_so_khu_du_lich` WRITE;
/*!40000 ALTER TABLE `ho_so_khu_du_lich` DISABLE KEYS */;
INSERT INTO `ho_so_khu_du_lich` VALUES (1,'hoàng',NULL,NULL,'Bình Dương','',NULL,NULL,'verified',NULL,NULL,NULL),(2,'meo emo',NULL,NULL,'Lào Cai','Chinh phục nóc nhà Đông Dương với cáp treo kỷ lục.',11.9854,108.431,'verified',NULL,NULL,NULL),(3,'Đà Lạt Wonder Resort',NULL,NULL,'Lâm Đồng','Khu nghỉ dưỡng phong cách Châu Âu bên hồ Tuyền Lâm',11.8954,108.431,'verified',NULL,NULL,NULL);
/*!40000 ALTER TABLE `ho_so_khu_du_lich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_su_diem_tin_cay`
--

DROP TABLE IF EXISTS `lich_su_diem_tin_cay`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_su_diem_tin_cay` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` int DEFAULT NULL,
  `so_diem_thay_doi` int DEFAULT NULL,
  `ly_do` varchar(255) DEFAULT NULL,
  `thoi_gian` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `lich_su_diem_tin_cay_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_su_diem_tin_cay`
--

LOCK TABLES `lich_su_diem_tin_cay` WRITE;
/*!40000 ALTER TABLE `lich_su_diem_tin_cay` DISABLE KEYS */;
/*!40000 ALTER TABLE `lich_su_diem_tin_cay` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `lich_trinh_chi_tiet`
--

DROP TABLE IF EXISTS `lich_trinh_chi_tiet`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lich_trinh_chi_tiet` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_chuyen_di` int DEFAULT NULL,
  `ngay_thu` int DEFAULT NULL,
  `thoi_gian` time DEFAULT NULL,
  `hoat_dong` varchar(255) DEFAULT NULL,
  `id_khu_du_lich_lien_ket` int DEFAULT NULL,
  `ghi_chu` text,
  `chi_phi_du_kien` decimal(15,0) DEFAULT '0',
  `vi_do` float DEFAULT NULL,
  `kinh_do` float DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_lich_trinh_chuyen_di` (`id_chuyen_di`),
  CONSTRAINT `fk_lich_trinh_chuyen_di` FOREIGN KEY (`id_chuyen_di`) REFERENCES `chuyen_di` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `lich_trinh_chi_tiet`
--

LOCK TABLES `lich_trinh_chi_tiet` WRITE;
/*!40000 ALTER TABLE `lich_trinh_chi_tiet` DISABLE KEYS */;
INSERT INTO `lich_trinh_chi_tiet` VALUES (2,1,1,'08:00:00','Check-in Chợ Đà Lạt',NULL,NULL,0,11.9427,108.437),(3,1,1,'14:00:00','Ghé thăm Hồ Tuyền Lâm',NULL,NULL,0,11.8954,108.431);
/*!40000 ALTER TABLE `lich_trinh_chi_tiet` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `luot_thich`
--

DROP TABLE IF EXISTS `luot_thich`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `luot_thich` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_dung` int NOT NULL,
  `id_bai_viet` int NOT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `duy_nhat_like` (`id_nguoi_dung`,`id_bai_viet`),
  KEY `id_bai_viet` (`id_bai_viet`),
  CONSTRAINT `luot_thich_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `luot_thich_ibfk_2` FOREIGN KEY (`id_bai_viet`) REFERENCES `bai_viet` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `luot_thich`
--

LOCK TABLES `luot_thich` WRITE;
/*!40000 ALTER TABLE `luot_thich` DISABLE KEYS */;
INSERT INTO `luot_thich` VALUES (1,1,2,'2026-03-25 09:57:24'),(2,1,1,'2026-03-25 10:04:51'),(4,1,3,'2026-03-26 03:50:10'),(6,2,5,'2026-03-26 07:04:44'),(8,2,6,'2026-03-26 07:24:56'),(10,1,4,'2026-03-26 08:36:29'),(11,1,5,'2026-03-26 15:16:50'),(17,2,2,'2026-04-03 06:21:55'),(22,2,10,'2026-04-09 04:12:26'),(30,1,10,'2026-04-26 18:11:42');
/*!40000 ALTER TABLE `luot_thich` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nguoi_dung`
--

DROP TABLE IF EXISTS `nguoi_dung`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nguoi_dung` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten` varchar(100) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mat_khau` varchar(255) NOT NULL,
  `anh_dai_dien` varchar(255) DEFAULT NULL,
  `vai_tro` enum('khach_du_lich','khu_du_lich','admin') DEFAULT 'khach_du_lich',
  `diem_tin_cay` int DEFAULT '50',
  `da_xac_thuc_otp` tinyint(1) DEFAULT '0',
  `ma_gioi_thieu` varchar(20) DEFAULT NULL,
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `so_du` decimal(15,0) DEFAULT '0',
  `tinh_thanh` varchar(100) DEFAULT 'Việt Nam',
  `dia_chi` text,
  `trang_thai_tai_khoan` enum('active','suspended') DEFAULT 'active',
  `ly_do_khoa` text,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `ma_gioi_thieu` (`ma_gioi_thieu`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nguoi_dung`
--

LOCK TABLES `nguoi_dung` WRITE;
/*!40000 ALTER TABLE `nguoi_dung` DISABLE KEYS */;
INSERT INTO `nguoi_dung` VALUES (1,'hoàng','anhlalyn14.03@gmail.com','$2b$10$EUisHNRUxubkzynd7dfTCeh0WsoVagUmsO10dVr3JgQNJWQcoiuWO','1776408101420.jpg','khach_du_lich',80,2,NULL,'2026-03-19 17:50:50',2091110,'Việt Nam',NULL,'active',NULL),(2,'Phan Dinh Luyen','dinhluyenvipro@gmail.com','$2b$10$sI3IhJWMAbCr6D3P4cx.YObzZbz9W8c3mZ87jmFTj3560DxDSYb7a','1774508435852.jpg','khu_du_lich',55,1,NULL,'2026-03-20 07:22:37',0,'Việt Nam',NULL,'active',NULL),(3,'Đà Lạt Wonder Resort','dalatwonder@gmail.com','$2b$10$YourHashedPasswordHere',NULL,'khu_du_lich',50,1,NULL,'2026-03-26 05:12:56',0,'Việt Nam','Số 19 Hoa Hồng, Hồ Tuyền Lâm, Phường 4, Đà Lạt, Lâm Đồng','active',NULL),(4,'Sun World Fansipan','fansipan@gmail.com','$2b$10$YourHashedPasswordHere',NULL,'khu_du_lich',50,1,NULL,'2026-03-26 05:12:56',0,'Việt Nam',NULL,'active',NULL),(5,'Quản trị TravelConnect','admin@travelconnect.vn','$2b$10$BV79GnKSmDRmC60NyahAAe06NqDLCDzO9O2bcMrgPjPv6r38QJ7WO',NULL,'admin',100,1,NULL,'2026-04-26 17:59:37',0,'Việt Nam',NULL,'active',NULL);
/*!40000 ALTER TABLE `nguoi_dung` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `nhom_cong_dong`
--

DROP TABLE IF EXISTS `nhom_cong_dong`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `nhom_cong_dong` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_nhom` varchar(255) NOT NULL,
  `mo_ta` text,
  `anh_bia` varchar(255) DEFAULT NULL,
  `id_admin` int DEFAULT NULL,
  `loai_nhom` enum('cong_khai','rieng_tu') DEFAULT 'cong_khai',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_admin` (`id_admin`),
  CONSTRAINT `nhom_cong_dong_ibfk_1` FOREIGN KEY (`id_admin`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `nhom_cong_dong`
--

LOCK TABLES `nhom_cong_dong` WRITE;
/*!40000 ALTER TABLE `nhom_cong_dong` DISABLE KEYS */;
/*!40000 ALTER TABLE `nhom_cong_dong` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_xac_thuc`
--

DROP TABLE IF EXISTS `otp_xac_thuc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_xac_thuc` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) DEFAULT NULL,
  `ma_otp` varchar(6) DEFAULT NULL,
  `loai` enum('register','forgot_password') DEFAULT NULL,
  `het_han` datetime DEFAULT NULL,
  `da_su_dung` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_xac_thuc`
--

LOCK TABLES `otp_xac_thuc` WRITE;
/*!40000 ALTER TABLE `otp_xac_thuc` DISABLE KEYS */;
INSERT INTO `otp_xac_thuc` VALUES (1,'anhlalyn14.03@gmail.com','426573','register','2026-03-20 01:00:50',1),(2,'anhlalyn14.03@gmail.com','560304','forgot_password','2026-03-20 01:01:51',1),(3,'anhlalyn14.03@gmail.com','591402','forgot_password','2026-03-20 14:29:33',0),(4,'anhlalyn14.03@gmail.com','878413','forgot_password','2026-03-20 14:30:46',0),(5,'dinhluyenvipro@gmail.com','213277','register','2026-03-20 14:32:37',1),(6,'dinhluyenvipro@gmail.com','998600','forgot_password','2026-03-25 17:46:36',0),(7,'dinhluyenvipro@gmail.com','122581','forgot_password','2026-03-25 17:46:39',0),(8,'dinhluyenvipro@gmail.com','819402','forgot_password','2026-03-25 17:46:39',0),(9,'dinhluyenvipro@gmail.com','873836','forgot_password','2026-03-25 17:46:39',0),(10,'dinhluyenvipro@gmail.com','579140','forgot_password','2026-03-25 17:46:39',0),(11,'dinhluyenvipro@gmail.com','171363','forgot_password','2026-03-25 17:46:39',0),(12,'dinhluyenvipro@gmail.com','778669','forgot_password','2026-03-25 17:46:44',0),(13,'dinhluyenvipro@gmail.com','626526','forgot_password','2026-03-25 17:46:47',0),(14,'dinhluyenvipro@gmail.com','604289','forgot_password','2026-03-25 17:46:48',0),(15,'dinhluyenvipro@gmail.com','577134','forgot_password','2026-03-25 17:46:50',0),(16,'dinhluyenvipro@gmail.com','644934','forgot_password','2026-03-25 17:46:50',0),(17,'dinhluyenvipro@gmail.com','798793','forgot_password','2026-03-25 17:46:51',0),(18,'dinhluyenvipro@gmail.com','715476','forgot_password','2026-03-25 17:46:53',0),(19,'dinhluyenvipro@gmail.com','611655','forgot_password','2026-03-25 17:46:54',0),(20,'dinhluyenvipro@gmail.com','556316','forgot_password','2026-03-25 17:46:56',0),(21,'dinhluyenvipro@gmail.com','354982','forgot_password','2026-03-25 17:46:58',0),(22,'dinhluyenvipro@gmail.com','676047','forgot_password','2026-03-25 17:46:58',0),(23,'dinhluyenvipro@gmail.com','740469','forgot_password','2026-03-25 17:47:02',0),(24,'dinhluyenvipro@gmail.com','300212','forgot_password','2026-03-25 17:47:04',0),(25,'dinhluyenvipro@gmail.com','749694','forgot_password','2026-03-25 17:47:07',0),(26,'dinhluyenvipro@gmail.com','173318','forgot_password','2026-03-25 17:47:08',0),(27,'dinhluyenvipro@gmail.com','829543','forgot_password','2026-03-25 17:47:11',0),(28,'dinhluyenvipro@gmail.com','610230','forgot_password','2026-03-25 17:47:11',0),(29,'dinhluyenvipro@gmail.com','588787','forgot_password','2026-03-25 17:47:12',0),(30,'dinhluyenvipro@gmail.com','697759','forgot_password','2026-03-25 17:47:14',0),(31,'dinhluyenvipro@gmail.com','287498','forgot_password','2026-03-25 17:47:15',0),(32,'dinhluyenvipro@gmail.com','177804','forgot_password','2026-03-25 17:47:16',0),(33,'dinhluyenvipro@gmail.com','970096','forgot_password','2026-03-25 17:47:17',0),(34,'dinhluyenvipro@gmail.com','101528','forgot_password','2026-03-25 17:47:17',0),(35,'dinhluyenvipro@gmail.com','459764','forgot_password','2026-03-25 17:47:18',0),(36,'dinhluyenvipro@gmail.com','698000','forgot_password','2026-03-25 17:47:19',0),(37,'dinhluyenvipro@gmail.com','449872','forgot_password','2026-03-25 17:47:20',0),(38,'dinhluyenvipro@gmail.com','340699','forgot_password','2026-03-25 17:47:21',0),(39,'dinhluyenvipro@gmail.com','721424','forgot_password','2026-03-25 17:47:22',0),(40,'dinhluyenvipro@gmail.com','390690','forgot_password','2026-03-25 17:47:23',0),(41,'dinhluyenvipro@gmail.com','384614','forgot_password','2026-03-25 17:47:25',0),(42,'dinhluyenvipro@gmail.com','637531','forgot_password','2026-03-25 17:47:25',0),(43,'dinhluyenvipro@gmail.com','578812','forgot_password','2026-03-25 17:47:27',0),(44,'dinhluyenvipro@gmail.com','558641','forgot_password','2026-03-25 17:47:28',0),(45,'anhlalyn14.03@gmail.com','296709','forgot_password','2026-03-27 10:28:31',0),(46,'anhlalyn14.03@gmail.com','520359','forgot_password','2026-03-27 10:32:06',0),(47,'anhlalyn14.03@gmail.com','693457','forgot_password','2026-03-27 10:36:47',1);
/*!40000 ALTER TABLE `otp_xac_thuc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `phong_chat`
--

DROP TABLE IF EXISTS `phong_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `phong_chat` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ten_nhom_chat` varchar(255) DEFAULT NULL,
  `loai_phong` enum('ca_nhan','nhom') DEFAULT 'ca_nhan',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `phong_chat`
--

LOCK TABLES `phong_chat` WRITE;
/*!40000 ALTER TABLE `phong_chat` DISABLE KEYS */;
INSERT INTO `phong_chat` VALUES (1,NULL,'ca_nhan','2026-03-26 04:46:34'),(2,NULL,'ca_nhan','2026-03-26 04:46:36');
/*!40000 ALTER TABLE `phong_chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thanh_toan`
--

DROP TABLE IF EXISTS `thanh_toan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thanh_toan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ma_tra_cuu` varchar(20) DEFAULT NULL,
  `id_nguoi_dung` int NOT NULL COMMENT 'Người phải trả tiền',
  `id_kdl` int DEFAULT NULL COMMENT 'ID của khu du lịch nhận tiền',
  `ten_kdl` varchar(255) DEFAULT NULL COMMENT 'Tên khu du lịch hiển thị trên hóa đơn',
  `ngay_den` date DEFAULT NULL,
  `so_luong` int DEFAULT '1',
  `tong_tien` decimal(15,0) NOT NULL DEFAULT '0',
  `trang_thai` enum('pending','completed','cancelled') DEFAULT 'pending',
  `phuong_thuc` varchar(50) DEFAULT 'wallet',
  `id_nguoi_gioi_thieu` int DEFAULT NULL COMMENT 'ID user review được nhận hoa hồng',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ma_tra_cuu` (`ma_tra_cuu`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  KEY `id_nguoi_gioi_thieu` (`id_nguoi_gioi_thieu`),
  KEY `fk_thanh_toan_kdl` (`id_kdl`),
  CONSTRAINT `fk_thanh_toan_kdl` FOREIGN KEY (`id_kdl`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL,
  CONSTRAINT `thanh_toan_ibfk_1` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `thanh_toan_ibfk_2` FOREIGN KEY (`id_nguoi_gioi_thieu`) REFERENCES `nguoi_dung` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thanh_toan`
--

LOCK TABLES `thanh_toan` WRITE;
/*!40000 ALTER TABLE `thanh_toan` DISABLE KEYS */;
INSERT INTO `thanh_toan` VALUES (2,NULL,1,3,'Đà Lạt Wonder Resort',NULL,1,1500000,'pending','wallet',NULL,'2026-03-27 05:28:54'),(4,NULL,1,3,'Đà Lạt Wonder Resort',NULL,1,2500000,'pending','wallet',1,'2026-04-03 06:23:43'),(5,NULL,2,3,'Đà Lạt Wonder Resort',NULL,1,250000,'pending','wallet',1,'2026-04-03 07:07:15'),(6,'578EF5',1,3,'Đà Lạt Wonder Resort',NULL,1,1250000,'completed','wallet',1,'2026-04-09 04:01:56'),(7,'7E617C',1,3,'Đà Lạt Wonder Resort',NULL,1,200000,'completed','wallet',1,'2026-04-10 08:06:19'),(8,'TC-998877',1,3,'Đà Lạt Wonder Resort','2026-05-20',2,500000,'completed','wallet',NULL,'2026-04-10 08:09:21');
/*!40000 ALTER TABLE `thanh_toan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thanh_vien_nhom`
--

DROP TABLE IF EXISTS `thanh_vien_nhom`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thanh_vien_nhom` (
  `id_nhom` int NOT NULL,
  `id_nguoi_dung` int NOT NULL,
  `vai_tro` enum('admin','moderator','thanh_vien') DEFAULT 'thanh_vien',
  `ngay_gia_nhap` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_nhom`,`id_nguoi_dung`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `thanh_vien_nhom_ibfk_1` FOREIGN KEY (`id_nhom`) REFERENCES `nhom_cong_dong` (`id`) ON DELETE CASCADE,
  CONSTRAINT `thanh_vien_nhom_ibfk_2` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thanh_vien_nhom`
--

LOCK TABLES `thanh_vien_nhom` WRITE;
/*!40000 ALTER TABLE `thanh_vien_nhom` DISABLE KEYS */;
/*!40000 ALTER TABLE `thanh_vien_nhom` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thanh_vien_phong_chat`
--

DROP TABLE IF EXISTS `thanh_vien_phong_chat`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thanh_vien_phong_chat` (
  `id_phong` int NOT NULL,
  `id_nguoi_dung` int NOT NULL,
  PRIMARY KEY (`id_phong`,`id_nguoi_dung`),
  KEY `id_nguoi_dung` (`id_nguoi_dung`),
  CONSTRAINT `thanh_vien_phong_chat_ibfk_1` FOREIGN KEY (`id_phong`) REFERENCES `phong_chat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `thanh_vien_phong_chat_ibfk_2` FOREIGN KEY (`id_nguoi_dung`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thanh_vien_phong_chat`
--

LOCK TABLES `thanh_vien_phong_chat` WRITE;
/*!40000 ALTER TABLE `thanh_vien_phong_chat` DISABLE KEYS */;
INSERT INTO `thanh_vien_phong_chat` VALUES (2,1),(2,2);
/*!40000 ALTER TABLE `thanh_vien_phong_chat` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `thong_bao`
--

DROP TABLE IF EXISTS `thong_bao`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `thong_bao` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_nguoi_nhan` int NOT NULL,
  `id_nguoi_gui` int NOT NULL,
  `noi_dung` text NOT NULL,
  `loai_thong_bao` enum('thich','binh_luan','ket_ban','he_thong','dat_ve') NOT NULL,
  `id_lien_ket` int DEFAULT NULL,
  `da_xem` tinyint(1) DEFAULT '0',
  `ngay_tao` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_nguoi_gui` (`id_nguoi_gui`),
  KEY `fk_thong_bao_nguoi_nhan` (`id_nguoi_nhan`),
  CONSTRAINT `fk_thong_bao_nguoi_nhan` FOREIGN KEY (`id_nguoi_nhan`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE,
  CONSTRAINT `thong_bao_ibfk_2` FOREIGN KEY (`id_nguoi_gui`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `thong_bao`
--

LOCK TABLES `thong_bao` WRITE;
/*!40000 ALTER TABLE `thong_bao` DISABLE KEYS */;
INSERT INTO `thong_bao` VALUES (1,1,2,'đã thích bài viết của bạn','thich',6,1,'2026-03-26 07:24:56'),(2,3,1,'đã gửi cho bạn một lời mời kết bạn','ket_ban',1,0,'2026-03-27 06:20:53'),(3,1,2,'đã thích bài viết của bạn','thich',8,1,'2026-04-03 06:22:01'),(4,1,2,'đã bình luận bài viết của bạn','binh_luan',8,1,'2026-04-03 06:22:05'),(5,4,1,'đã gửi cho bạn một lời mời kết bạn','ket_ban',1,0,'2026-04-03 07:06:22'),(6,1,2,'đã thích bài viết của bạn','thich',9,1,'2026-04-03 07:07:02'),(7,1,2,'đã bình luận bài viết của bạn','binh_luan',9,1,'2026-04-03 07:07:06'),(8,1,2,'đã thích bài viết của bạn','thich',10,1,'2026-04-09 04:12:26'),(9,3,1,'Bạn có đơn đặt vé mới từ hoàng.','dat_ve',NULL,0,'2026-04-26 19:15:54'),(10,3,1,'Bạn có đơn đặt vé mới từ hoàng.','dat_ve',NULL,0,'2026-04-26 19:17:51');
/*!40000 ALTER TABLE `thong_bao` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tin_nhan`
--

DROP TABLE IF EXISTS `tin_nhan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tin_nhan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `id_phong` int DEFAULT NULL,
  `id_nguoi_gui` int DEFAULT NULL,
  `noi_dung` text,
  `loai_tin_nhan` enum('text','image','audio','video_call_log') DEFAULT 'text',
  `thoi_gian_gui` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_phong` (`id_phong`),
  KEY `id_nguoi_gui` (`id_nguoi_gui`),
  CONSTRAINT `tin_nhan_ibfk_1` FOREIGN KEY (`id_phong`) REFERENCES `phong_chat` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tin_nhan_ibfk_2` FOREIGN KEY (`id_nguoi_gui`) REFERENCES `nguoi_dung` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tin_nhan`
--

LOCK TABLES `tin_nhan` WRITE;
/*!40000 ALTER TABLE `tin_nhan` DISABLE KEYS */;
INSERT INTO `tin_nhan` VALUES (1,2,1,'ê','text','2026-03-26 04:46:42'),(2,2,1,'sao','text','2026-03-26 04:47:13'),(3,2,2,'sao thế','text','2026-03-26 04:48:04'),(4,2,1,'fhfhfhfhfhffffffff','text','2026-03-26 08:36:49'),(5,2,1,'rffff','text','2026-03-27 06:21:03'),(6,2,2,'đmmm','text','2026-03-27 06:22:11'),(7,2,1,'fffff','text','2026-03-27 06:23:20'),(8,2,2,'eeeee','text','2026-04-03 06:22:13'),(9,2,1,'quý hông','text','2026-04-03 07:06:38'),(10,2,2,'ê hoàng','text','2026-04-09 04:04:02'),(11,2,2,'đ','text','2026-04-13 09:02:34'),(12,2,1,'đ','text','2026-04-24 08:04:02'),(13,2,1,'message-1777018417482-394737484.webm','audio','2026-04-24 08:13:37'),(14,2,1,'message-1777019249801-254572688.webm','audio','2026-04-24 08:27:29'),(15,2,2,'message-1777019492873-437478220.png','image','2026-04-24 08:31:32'),(16,2,1,'message-1777019844089-727175663.webm','audio','2026-04-24 08:37:24');
/*!40000 ALTER TABLE `tin_nhan` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- ============================================
-- Extra schema from repo migrations
-- Source: backend/migrations/2026-04-24_explore_profile_extensions.sql
-- ============================================

ALTER TABLE `nguoi_dung`
ADD COLUMN IF NOT EXISTS `so_thich_json` JSON NULL;

ALTER TABLE `bai_viet`
ADD COLUMN IF NOT EXISTS `danh_muc` VARCHAR(100) NULL DEFAULT 'Tổng hợp';

-- Dump completed on 2026-05-01 16:33:34
