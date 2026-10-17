-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: db_ecom
-- ------------------------------------------------------
-- Server version	8.0.46

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
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categorias` (
  `codCategoria` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`codCategoria`),
  UNIQUE KEY `nome` (`nome`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (2,'SUV','Veículos utilitários esportivos'),(3,'Sedan','Veículos de três volumes'),(4,'Hatch','Veículos compactos com porta traseira'),(5,'Picape','Veículos com caçamba para carga'),(6,'Utilitário','Veículos voltados ao transporte e trabalho'),(7,'Esportivo','Veículos de alto desempenho'),(8,'Luxo','Veículos de luxo');
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `entregas`
--

DROP TABLE IF EXISTS `entregas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entregas` (
  `codEntrega` int NOT NULL AUTO_INCREMENT,
  `idPedido` int NOT NULL,
  `tipo` enum('ENTREGA','RETIRADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ENTREGA',
  `endereco` text COLLATE utf8mb4_unicode_ci,
  `cep` varchar(9) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `logradouro` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `complemento` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bairro` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localidade` varchar(70) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uf` varchar(2) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `numero` varchar(12) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dataEstimada` date DEFAULT NULL,
  `codigoRastreio` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statusEntrega` enum('AGUARDANDO','EM_TRANSITO','SAIU_PARA_ENTREGA','ENTREGUE','EXTRAVIADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AGUARDANDO',
  PRIMARY KEY (`codEntrega`),
  UNIQUE KEY `idPedido` (`idPedido`),
  UNIQUE KEY `codigoRastreio` (`codigoRastreio`),
  CONSTRAINT `entregas_ibfk_1` FOREIGN KEY (`idPedido`) REFERENCES `pedidos` (`codPedido`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `entregas`
--

LOCK TABLES `entregas` WRITE;
/*!40000 ALTER TABLE `entregas` DISABLE KEYS */;
INSERT INTO `entregas` VALUES (3,3,'ENTREGA','Arvelino F dell\'antonio, 200, Cobre, Canelinha - SC','88230-000','Arvelino F dell\'antonio','Casa','Cobre','Canelinha','SC','200',NULL,NULL,'AGUARDANDO');
/*!40000 ALTER TABLE `entregas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `estoques`
--

DROP TABLE IF EXISTS `estoques`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `estoques` (
  `codEstoque` int NOT NULL AUTO_INCREMENT,
  `idProduto` int NOT NULL,
  `quantidade_atual` int NOT NULL DEFAULT '0',
  `quantidade_minima` int DEFAULT '0',
  PRIMARY KEY (`codEstoque`),
  UNIQUE KEY `idProduto` (`idProduto`),
  CONSTRAINT `estoques_ibfk_1` FOREIGN KEY (`idProduto`) REFERENCES `produtos` (`codProduto`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `estoques`
--

LOCK TABLES `estoques` WRITE;
/*!40000 ALTER TABLE `estoques` DISABLE KEYS */;
INSERT INTO `estoques` VALUES (2,2,5,0),(3,3,5,0),(4,4,3,0),(5,5,3,0),(6,6,10,0),(7,7,2,0),(8,8,3,0);
/*!40000 ALTER TABLE `estoques` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `itens_pedidos`
--

DROP TABLE IF EXISTS `itens_pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `itens_pedidos` (
  `codItemPedido` int NOT NULL AUTO_INCREMENT,
  `idPedido` int NOT NULL,
  `idProduto` int NOT NULL,
  `quantidade` int NOT NULL DEFAULT '1',
  `precoUnitario` decimal(10,2) NOT NULL,
  `valorTotalItem` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`codItemPedido`),
  KEY `idPedido` (`idPedido`),
  KEY `idProduto` (`idProduto`),
  CONSTRAINT `itens_pedidos_ibfk_1` FOREIGN KEY (`idPedido`) REFERENCES `pedidos` (`codPedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `itens_pedidos_ibfk_2` FOREIGN KEY (`idProduto`) REFERENCES `produtos` (`codProduto`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `itens_pedidos`
--

LOCK TABLES `itens_pedidos` WRITE;
/*!40000 ALTER TABLE `itens_pedidos` DISABLE KEYS */;
INSERT INTO `itens_pedidos` VALUES (4,3,5,1,139900.00,139900.00);
/*!40000 ALTER TABLE `itens_pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pedidos`
--

DROP TABLE IF EXISTS `pedidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pedidos` (
  `codPedido` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int NOT NULL,
  `dataPedido` datetime NOT NULL,
  `status` enum('PENDENTE_PAGAMENTO','PAGO','ENVIADO','ENTREGUE','CANCELADO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDENTE_PAGAMENTO',
  `valorSubtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valorFrete` decimal(10,2) NOT NULL DEFAULT '0.00',
  `desconto` decimal(10,2) NOT NULL DEFAULT '0.00',
  `valorTotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`codPedido`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `pedidos_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`codUsuario`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pedidos`
--

LOCK TABLES `pedidos` WRITE;
/*!40000 ALTER TABLE `pedidos` DISABLE KEYS */;
INSERT INTO `pedidos` VALUES (3,2,'2026-09-09 01:01:32','PENDENTE_PAGAMENTO',139900.00,0.00,0.00,139900.00);
/*!40000 ALTER TABLE `pedidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `produtos`
--

DROP TABLE IF EXISTS `produtos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `produtos` (
  `codProduto` int NOT NULL AUTO_INCREMENT,
  `idCategoria` int NOT NULL,
  `nome` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `marca` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `modelo` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `versao` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ano` int NOT NULL,
  `quilometragem` int NOT NULL DEFAULT '0',
  `combustivel` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cambio` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cor` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descricao` text COLLATE utf8mb4_unicode_ci,
  `preco` decimal(10,2) NOT NULL,
  `imagem_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ativo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`codProduto`),
  KEY `idCategoria` (`idCategoria`),
  CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`idCategoria`) REFERENCES `categorias` (`codCategoria`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `produtos`
--

LOCK TABLES `produtos` WRITE;
/*!40000 ALTER TABLE `produtos` DISABLE KEYS */;
INSERT INTO `produtos` VALUES (2,2,'Jeep Compass Longitude T270 1.3 Turbo 2022','Jeep','Compass','Longitude T270 1.3 Turbo AT6',2022,58000,'Flex','Automático','Preto','Jeep Compass Longitude T270 2022, equipado com motor 1.3 Turbo Flex e câmbio automático de 6 marchas. SUV espaçoso, confortável e completo, ideal para cidade e viagens.',124900.00,'https://www.autocerto.com/fotos/1571/4594679/1_101231.jpg',1),(3,2,'Volkswagen T-Cross Comfortline 200 TSI 2023','Volkswagen','T-Cross','Comfortline 200 TSI 1.0 Turbo AT',2023,28,'Flex','Automático','Branco','Volkswagen T-Cross Comfortline 2023, equipado com motor 1.0 Turbo Flex e câmbio automático. SUV moderno, confortável e com ótimo espaço interno.',112900.00,'https://http2.mlstatic.com/D_NQ_NP_829361-MLB112810086583_062026-O.webp',1),(4,4,'Volkswagen Polo Highline 1.0 TSI 2024','Volkswagen','Polo','Highline 1.0 TSI',2024,21000,'Flex','Automático','Prata','Volkswagen Polo Highline 2024, equipado com motor 1.0 TSI Turbo Flex e câmbio automático. Hatch moderno, econômico e completo, com excelente desempenho urbano e ótimo pacote de tecnologia.',109900.00,'https://commons.wikimedia.org/wiki/Special:Redirect/file/2024_Volkswagen_Polo_1.6_MSi_Highline_AT_(Brazil).jpg',1),(5,3,'Toyota Corolla XEi 2.0 2023','Toyota','Corolla','XEi 2.0',2023,30000,'Flex','Automático','Branco','Toyota Corolla XEi 2.0 2023, sedã reconhecido pelo conforto, confiabilidade e excelente acabamento. Conta com câmbio automático CVT e amplo espaço interno, sendo uma ótima opção para cidade e estrada.',139900.00,'https://images.usadosbr.com/media/gallery/1c/48/27/toyota-corolla-2-0-xei-2023-sao-paulo-sp-0faf63b6-tL.webp',1),(6,5,'Fiat Strada Volcano 1.3 2024','Fiat','Strada','Volcano 1.3',2024,6000,'Flex','Manual','Branco','Fiat Strada Volcano 2024, equipada com motor 1.3 Flex e câmbio automático. Picape versátil que combina conforto para o uso diário com praticidade e capacidade para o trabalho.',119900.00,'https://commons.wikimedia.org/wiki/Special:Redirect/file/Fiat_Strada_Mk6_Volcano_in_Uruguay_-_front.jpg',1),(7,7,'Ford Mustang GT 5.0 V8 2020','Ford','Mustang','GT 5.0 V8',2020,400,'Gasolina','Automático','Branco','Ford Mustang GT 2020, equipado com o icônico motor 5.0 V8. Um esportivo de alto desempenho que combina potência, design marcante e a tradição de um dos modelos mais conhecidos da Ford.',419900.00,'https://images.dealersync.com/2078/Photos/965603/20230404020239610_IMG_4881.jpg?_=a24c3d7a95996143f76b3450e2db233e558a2aba',1),(8,8,'Mercedes-Benz C 200 AMG Line','Mercedes-Benz','C 200','AMG Line',2022,4000,'Gasolina','Automático','Preto','Mercedes-Benz C 200 AMG Line, sedã premium que combina acabamento sofisticado, conforto e tecnologia. O pacote AMG Line acrescenta um visual mais esportivo e exclusivo ao modelo.',319900.00,'https://www.khulekanionwheels.com/wp-content/uploads/2022/09/Mercedes-Benz-C200-Front.jfif_.jpg',1);
/*!40000 ALTER TABLE `produtos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `codUsuario` int NOT NULL AUTO_INCREMENT,
  `nome` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `senha` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telefone` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cpf` varchar(14) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cep` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL,
  `rua` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `numero` varchar(12) COLLATE utf8mb4_unicode_ci NOT NULL,
  `bairro` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cidade` varchar(70) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uf` varchar(2) COLLATE utf8mb4_unicode_ci NOT NULL,
  `identidade` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo_usuario` enum('CLIENTE','ADMIN') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'CLIENTE',
  PRIMARY KEY (`codUsuario`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `cpf` (`cpf`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador AutoShopping','admin@autoshopping.com','$2b$10$VRv5BmrQSAhcQ.IGxUNH4ujKUz4MWBecpddqHIMS0k/Bnf0SlmS6S','11999999999','000.000.000-00','00000-000','Administracao','0','Centro','Sao Paulo','SP',NULL,'ADMIN'),(2,'Matheus Orsi Reis','matheusorsireis540@gmail.com','$2b$10$1Sa.WI0MePyylAiQQwcnCOzcTSlSuHZtIH3lXfy6MN1pQLgEsWg4u','48996783626','222222222222','88230000','Avenida Bayer Filho','200','Centro','Tijucas','SC',NULL,'CLIENTE'),(3,'Vanderlei Reis','vanderlei@gmail.com','$2b$10$CNvSewb8XXYM2v1dnG51KOPT77F1uE1KqagvkhdUcxTzo6FQapOOy','(48) 32631042','111111111','88230-000','Rua','123','123','Canelinha','SC',NULL,'CLIENTE');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-08 22:02:19
