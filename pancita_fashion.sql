-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Servidor: 127.0.0.1
-- Tiempo de generación: 14-11-2026 a las 20:14:05
-- Versión del servidor: 10.4.32-MariaDB
-- Versión de PHP: 8.2.12

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `pancita_fashion`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categorias`
--

CREATE TABLE `categorias` (
  `id_categoria` varchar(40) NOT NULL,
  `nombre` varchar(80) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `categorias`
--

INSERT INTO `categorias` (`id_categoria`, `nombre`) VALUES
('blusas', 'Blusas'),
('lactancia', 'Lactancia'),
('pantalones', 'Pantalones'),
('ropa-descanso', 'Ropa de descanso'),
('vestidos', 'Vestidos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_pedido`
--

CREATE TABLE `detalle_pedido` (
  `id_detalle` bigint(20) UNSIGNED NOT NULL,
  `id_pedido` bigint(20) UNSIGNED NOT NULL,
  `id_producto` varchar(60) DEFAULT NULL,
  `nombre_producto` varchar(160) NOT NULL,
  `talla` varchar(20) DEFAULT NULL,
  `color` varchar(60) DEFAULT NULL,
  `cantidad` int(10) UNSIGNED NOT NULL,
  `precio_unitario` decimal(10,2) NOT NULL,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `pedidos`
--

CREATE TABLE `pedidos` (
  `id_pedido` bigint(20) UNSIGNED NOT NULL,
  `nombre_cliente` varchar(120) DEFAULT NULL,
  `nota_cliente` varchar(500) DEFAULT NULL,
  `estado` varchar(20) NOT NULL DEFAULT 'pendiente',
  `entrega` varchar(30) NOT NULL DEFAULT 'recojo_en_tienda',
  `pago_confirmado` tinyint(1) NOT NULL DEFAULT 0,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `productos`
--

CREATE TABLE `productos` (
  `id_producto` varchar(60) NOT NULL,
  `nombre` varchar(160) NOT NULL,
  `descripcion` text NOT NULL,
  `precio` decimal(10,2) NOT NULL,
  `moneda` char(3) NOT NULL DEFAULT 'PEN',
  `imagen_url` varchar(255) NOT NULL,
  `imagen_descripcion` varchar(255) NOT NULL,
  `activo` tinyint(1) NOT NULL DEFAULT 1,
  `creado_en` timestamp NOT NULL DEFAULT current_timestamp(),
  `actualizado_en` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp()
) ;

--
-- Volcado de datos para la tabla `productos`
--

INSERT INTO `productos` (`id_producto`, `nombre`, `descripcion`, `precio`, `moneda`, `imagen_url`, `imagen_descripcion`, `activo`, `creado_en`, `actualizado_en`) VALUES
('blusa-alma', 'Blusa lactancia Alma', 'Blusa de lactancia. Consulta la disponibilidad de tallas y colores en la tienda.', 69.00, 'PEN', '/images/blusa-alma.jpg', 'Blusa de lactancia Alma en tono rosa', 1, '2026-11-14 16:49:57', '2026-11-14 16:49:57'),
('conjunto-luna', 'Conjunto descanso Luna', 'Conjunto de descanso. Consulta la disponibilidad de tallas y colores en la tienda.', 99.00, 'PEN', '/images/conjunto-luna.jpg', 'Conjunto de descanso Luna en tono claro', 1, '2026-11-14 16:49:57', '2026-11-14 16:49:57'),
('pantalon-nube', 'Pantalón materno Nube', 'Pantalón materno. Consulta la disponibilidad de tallas y colores en la tienda.', 79.00, 'PEN', '/images/pantalon-nube.jpg', 'Pantalón materno Nube en color claro', 1, '2026-11-14 16:49:57', '2026-11-14 16:49:57'),
('vestido-aurora', 'Vestido materno Aurora', 'Ligero y suave, con espacio para tu pancita. Su corte fluido y cintura alta te acompañan con comodidad.', 89.00, 'PEN', '/images/vestido-aurora.jpg', 'Vestido materno Aurora en color arena', 1, '2026-11-14 16:49:57', '2026-11-14 16:49:57');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_categorias`
--

CREATE TABLE `producto_categorias` (
  `id_producto` varchar(60) NOT NULL,
  `id_categoria` varchar(40) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `producto_categorias`
--

INSERT INTO `producto_categorias` (`id_producto`, `id_categoria`) VALUES
('blusa-alma', 'blusas'),
('blusa-alma', 'lactancia'),
('conjunto-luna', 'ropa-descanso'),
('pantalon-nube', 'pantalones'),
('vestido-aurora', 'vestidos');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_colores`
--

CREATE TABLE `producto_colores` (
  `id_producto` varchar(60) NOT NULL,
  `color` varchar(60) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `producto_colores`
--

INSERT INTO `producto_colores` (`id_producto`, `color`) VALUES
('vestido-aurora', 'Arena'),
('vestido-aurora', 'Negro');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto_tallas`
--

CREATE TABLE `producto_tallas` (
  `id_producto` varchar(60) NOT NULL,
  `talla` varchar(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Volcado de datos para la tabla `producto_tallas`
--

INSERT INTO `producto_tallas` (`id_producto`, `talla`) VALUES
('blusa-alma', 'L'),
('blusa-alma', 'M'),
('blusa-alma', 'S'),
('blusa-alma', 'XL'),
('conjunto-luna', 'L'),
('conjunto-luna', 'M'),
('conjunto-luna', 'XL'),
('pantalon-nube', 'L'),
('pantalon-nube', 'M'),
('pantalon-nube', 'S'),
('vestido-aurora', 'L'),
('vestido-aurora', 'M'),
('vestido-aurora', 'S');

-- --------------------------------------------------------

--
-- Estructura Stand-in para la vista `vista_pedidos_resumen`
-- (Véase abajo para la vista actual)
--
CREATE TABLE `vista_pedidos_resumen` (
`id_pedido` bigint(20) unsigned
,`nombre_cliente` varchar(120)
,`estado` varchar(20)
,`entrega` varchar(30)
,`pago_confirmado` tinyint(1)
,`creado_en` timestamp
,`cantidad_prendas` decimal(32,0)
,`total` decimal(42,2)
);

-- --------------------------------------------------------

--
-- Estructura para la vista `vista_pedidos_resumen`
--
DROP TABLE IF EXISTS `vista_pedidos_resumen`;

CREATE ALGORITHM=UNDEFINED DEFINER=`root`@`localhost` SQL SECURITY DEFINER VIEW `vista_pedidos_resumen`  AS SELECT `p`.`id_pedido` AS `id_pedido`, `p`.`nombre_cliente` AS `nombre_cliente`, `p`.`estado` AS `estado`, `p`.`entrega` AS `entrega`, `p`.`pago_confirmado` AS `pago_confirmado`, `p`.`creado_en` AS `creado_en`, coalesce(sum(`d`.`cantidad`),0) AS `cantidad_prendas`, coalesce(sum(`d`.`cantidad` * `d`.`precio_unitario`),0.00) AS `total` FROM (`pedidos` `p` left join `detalle_pedido` `d` on(`d`.`id_pedido` = `p`.`id_pedido`)) GROUP BY `p`.`id_pedido`, `p`.`nombre_cliente`, `p`.`estado`, `p`.`entrega`, `p`.`pago_confirmado`, `p`.`creado_en` ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `categorias`
--
ALTER TABLE `categorias`
  ADD PRIMARY KEY (`id_categoria`),
  ADD UNIQUE KEY `uq_categorias_nombre` (`nombre`);

--
-- Indices de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD PRIMARY KEY (`id_detalle`),
  ADD KEY `idx_detalle_pedido` (`id_pedido`),
  ADD KEY `idx_detalle_producto` (`id_producto`);

--
-- Indices de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  ADD PRIMARY KEY (`id_pedido`),
  ADD KEY `idx_pedidos_estado_fecha` (`estado`,`creado_en`);

--
-- Indices de la tabla `productos`
--
ALTER TABLE `productos`
  ADD PRIMARY KEY (`id_producto`),
  ADD KEY `idx_productos_activo_nombre` (`activo`,`nombre`);

--
-- Indices de la tabla `producto_categorias`
--
ALTER TABLE `producto_categorias`
  ADD PRIMARY KEY (`id_producto`,`id_categoria`),
  ADD KEY `idx_producto_categorias_categoria` (`id_categoria`);

--
-- Indices de la tabla `producto_colores`
--
ALTER TABLE `producto_colores`
  ADD PRIMARY KEY (`id_producto`,`color`);

--
-- Indices de la tabla `producto_tallas`
--
ALTER TABLE `producto_tallas`
  ADD PRIMARY KEY (`id_producto`,`talla`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  MODIFY `id_detalle` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `pedidos`
--
ALTER TABLE `pedidos`
  MODIFY `id_pedido` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `detalle_pedido`
--
ALTER TABLE `detalle_pedido`
  ADD CONSTRAINT `fk_detalle_pedido_pedido` FOREIGN KEY (`id_pedido`) REFERENCES `pedidos` (`id_pedido`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_pedido_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE SET NULL ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto_categorias`
--
ALTER TABLE `producto_categorias`
  ADD CONSTRAINT `fk_producto_categorias_categoria` FOREIGN KEY (`id_categoria`) REFERENCES `categorias` (`id_categoria`) ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_producto_categorias_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto_colores`
--
ALTER TABLE `producto_colores`
  ADD CONSTRAINT `fk_producto_colores_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto_tallas`
--
ALTER TABLE `producto_tallas`
  ADD CONSTRAINT `fk_producto_tallas_producto` FOREIGN KEY (`id_producto`) REFERENCES `productos` (`id_producto`) ON DELETE CASCADE ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
