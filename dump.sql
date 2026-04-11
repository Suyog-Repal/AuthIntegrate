-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: authintegrate-db.c9cw2wye62zf.ap-south-1.rds.amazonaws.com    Database: authintegrate
-- ------------------------------------------------------
-- Server version	8.4.8

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '';

--
-- Table structure for table `access_logs`
--

DROP TABLE IF EXISTS `access_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `access_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `result` enum('GRANTED','DENIED','REGISTERED') NOT NULL,
  `note` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_access_user` (`user_id`),
  CONSTRAINT `fk_access_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=40 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `access_logs`
--

LOCK TABLES `access_logs` WRITE;
/*!40000 ALTER TABLE `access_logs` DISABLE KEYS */;
INSERT INTO `access_logs` VALUES (1,2,'REGISTERED','Enrollment Success','2026-04-08 12:17:24'),(2,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 12:19:53'),(3,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 12:43:07'),(4,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 12:49:00'),(5,2,'DENIED','Password does not match database record.','2026-04-08 12:49:46'),(6,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 13:21:20'),(7,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 19:53:19'),(11,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 19:57:27'),(12,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 19:57:48'),(13,3,'REGISTERED','Enrollment Success','2026-04-08 19:58:24'),(14,3,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:00:16'),(15,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:00:28'),(16,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:01:27'),(17,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:01:42'),(18,3,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:01:57'),(19,2,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:02:11'),(20,2,'DENIED','Password does not match database record.','2026-04-08 20:03:40'),(21,2,'DENIED','Password does not match database record.','2026-04-08 20:07:43'),(22,4,'REGISTERED','Enrollment Success','2026-04-08 20:13:35'),(23,4,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:15:31'),(24,4,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:15:45'),(25,4,'GRANTED','Access Granted (2FA Verified)','2026-04-08 20:16:02'),(26,2,'GRANTED','Access Granted (2FA Verified)','2026-04-09 21:48:12'),(27,2,'GRANTED','Access Granted (2FA Verified)','2026-04-09 21:50:27'),(28,2,'GRANTED','Access Granted (2FA Verified)','2026-04-09 23:03:31'),(29,2,'DENIED','Password does not match database record.','2026-04-09 23:04:00'),(30,2,'GRANTED','Access Granted (2FA Verified)','2026-04-09 23:08:46'),(31,2,'DENIED','Password does not match database record.','2026-04-09 23:10:26'),(32,2,'GRANTED','Access Granted (2FA Verified)','2026-04-09 23:10:44'),(33,2,'DENIED','Password does not match database record.','2026-04-09 23:11:55'),(34,5,'REGISTERED','Enrollment Success','2026-04-10 07:41:06'),(35,5,'GRANTED','Access Granted (2FA Verified)','2026-04-10 07:44:22'),(36,5,'GRANTED','Access Granted (2FA Verified)','2026-04-10 07:44:58'),(37,5,'DENIED','Password does not match database record.','2026-04-10 07:46:05'),(38,6,'REGISTERED','Enrollment Success','2026-04-10 09:08:29'),(39,6,'GRANTED','Access Granted (2FA Verified)','2026-04-10 09:12:38');
/*!40000 ALTER TABLE `access_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_profiles`
--

DROP TABLE IF EXISTS `user_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `user_profiles` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `mobile` varchar(20) DEFAULT NULL,
  `password_hash` text NOT NULL,
  `role` enum('admin','user') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  UNIQUE KEY `email` (`email`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_profiles`
--

LOCK TABLES `user_profiles` WRITE;
/*!40000 ALTER TABLE `user_profiles` DISABLE KEYS */;
INSERT INTO `user_profiles` VALUES (1,2,'Suyog Repal','suyog.repal23@spit.ac.in','9146742145','$2b$10$RySUlzWo0G.kRb15TT0MjuWqi7LOEVMgIN8dqCEC1o6gbfO4411LW','admin','2026-04-08 12:17:58'),(3,3,'Sambit Sahoo','sambitsahoo7380@gmail.com','7327807380','$2b$10$aFLvdCuCDuF87GwBsyjcDuJ8z0SGoBnmjQri/w/XLPU1piDEuXVXO','user','2026-04-08 19:59:46'),(4,4,'Keshav Kumar','keshav.kumar23@spit.ac.in','9622101604','$2b$10$8IspTIU481SxbolMyfUtuuKm122i3DaAyTmVtRIbNcpBRcJe8wk6i','user','2026-04-08 20:14:40'),(5,5,'Ansh Sharma','ansh.sharma23@spit.ac.in','9622497097','$2b$10$RRuOJt8yWR4BAbR5/F5H3eQEn5jjXwFaM5Mv/fIqDcVGzhZ3HSY8O','user','2026-04-10 07:42:21'),(6,6,'Rahul Mane','rahul.mane23@spit.ac.in','9321842213','$2b$10$w9Um1OOOpphAuIZUI0que./9bfufAR2PNhaO0gmkKj5SqKPwNi5g6','user','2026-04-10 09:10:03');
/*!40000 ALTER TABLE `user_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL,
  `finger_id` int NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `finger_id` (`finger_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (2,2,'2026-04-08 12:17:24'),(3,3,'2026-04-08 19:58:24'),(4,4,'2026-04-08 20:13:35'),(5,5,'2026-04-10 07:41:05'),(6,6,'2026-04-10 09:08:29');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-04-11  6:39:22
