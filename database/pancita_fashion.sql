CREATE DATABASE IF NOT EXISTS pancita_fashion
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE pancita_fashion;

CREATE TABLE IF NOT EXISTS categorias (
  id_categoria VARCHAR(40) NOT NULL,
  nombre VARCHAR(80) NOT NULL,
  PRIMARY KEY (id_categoria),
  UNIQUE KEY uq_categorias_nombre (nombre)
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS productos (
  id_producto VARCHAR(60) NOT NULL,
  nombre VARCHAR(160) NOT NULL,
  descripcion TEXT NOT NULL,
  precio DECIMAL(10, 2) NOT NULL,
  moneda CHAR(3) NOT NULL DEFAULT 'PEN',
  imagen_url VARCHAR(255) NOT NULL,
  imagen_descripcion VARCHAR(255) NOT NULL,
  activo TINYINT(1) NOT NULL DEFAULT 1,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_producto),
  KEY idx_productos_activo_nombre (activo, nombre),
  CONSTRAINT chk_productos_precio_positivo CHECK (precio > 0),
  CONSTRAINT chk_productos_activo CHECK (activo IN (0, 1))
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS producto_categorias (
  id_producto VARCHAR(60) NOT NULL,
  id_categoria VARCHAR(40) NOT NULL,
  PRIMARY KEY (id_producto, id_categoria),
  KEY idx_producto_categorias_categoria (id_categoria),
  CONSTRAINT fk_producto_categorias_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_producto_categorias_categoria
    FOREIGN KEY (id_categoria) REFERENCES categorias (id_categoria)
    ON UPDATE CASCADE ON DELETE RESTRICT
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS producto_tallas (
  id_producto VARCHAR(60) NOT NULL,
  talla VARCHAR(20) NOT NULL,
  PRIMARY KEY (id_producto, talla),
  CONSTRAINT fk_producto_tallas_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS producto_colores (
  id_producto VARCHAR(60) NOT NULL,
  color VARCHAR(60) NOT NULL,
  PRIMARY KEY (id_producto, color),
  CONSTRAINT fk_producto_colores_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE CASCADE
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS pedidos (
  id_pedido BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nombre_cliente VARCHAR(120) DEFAULT NULL,
  nota_cliente VARCHAR(500) DEFAULT NULL,
  estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  entrega VARCHAR(30) NOT NULL DEFAULT 'recojo_en_tienda',
  pago_confirmado TINYINT(1) NOT NULL DEFAULT 0,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  actualizado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id_pedido),
  KEY idx_pedidos_estado_fecha (estado, creado_en),
  CONSTRAINT chk_pedidos_estado CHECK (
    estado IN ('pendiente', 'confirmado', 'cancelado', 'completado')
  ),
  CONSTRAINT chk_pedidos_entrega CHECK (entrega = 'recojo_en_tienda'),
  CONSTRAINT chk_pedidos_pago_confirmado CHECK (pago_confirmado IN (0, 1))
) ENGINE = InnoDB;

CREATE TABLE IF NOT EXISTS detalle_pedido (
  id_detalle BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  id_pedido BIGINT UNSIGNED NOT NULL,
  id_producto VARCHAR(60) DEFAULT NULL,
  nombre_producto VARCHAR(160) NOT NULL,
  talla VARCHAR(20) DEFAULT NULL,
  color VARCHAR(60) DEFAULT NULL,
  cantidad INT UNSIGNED NOT NULL,
  precio_unitario DECIMAL(10, 2) NOT NULL,
  creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id_detalle),
  KEY idx_detalle_pedido (id_pedido),
  KEY idx_detalle_producto (id_producto),
  CONSTRAINT fk_detalle_pedido_pedido
    FOREIGN KEY (id_pedido) REFERENCES pedidos (id_pedido)
    ON UPDATE CASCADE ON DELETE CASCADE,
  CONSTRAINT fk_detalle_pedido_producto
    FOREIGN KEY (id_producto) REFERENCES productos (id_producto)
    ON UPDATE CASCADE ON DELETE SET NULL,
  CONSTRAINT chk_detalle_cantidad_positiva CHECK (cantidad > 0),
  CONSTRAINT chk_detalle_precio_no_negativo CHECK (precio_unitario >= 0)
) ENGINE = InnoDB;

INSERT INTO categorias (id_categoria, nombre) VALUES
  ('vestidos', 'Vestidos'),
  ('blusas', 'Blusas'),
  ('pantalones', 'Pantalones'),
  ('lactancia', 'Lactancia'),
  ('ropa-descanso', 'Ropa de descanso');

INSERT INTO productos (
  id_producto,
  nombre,
  descripcion,
  precio,
  moneda,
  imagen_url,
  imagen_descripcion
) VALUES
  (
    'vestido-aurora',
    'Vestido materno Aurora',
    'Ligero y suave, con espacio para tu pancita. Su corte fluido y cintura alta te acompañan con comodidad.',
    89.00,
    'PEN',
    '/images/vestido-aurora.jpg',
    'Vestido materno Aurora en color arena'
  ),
  (
    'blusa-alma',
    'Blusa lactancia Alma',
    'Blusa de lactancia. Consulta la disponibilidad de tallas y colores en la tienda.',
    69.00,
    'PEN',
    '/images/blusa-alma.jpg',
    'Blusa de lactancia Alma en tono rosa'
  ),
  (
    'pantalon-nube',
    'Pantalón materno Nube',
    'Pantalón materno. Consulta la disponibilidad de tallas y colores en la tienda.',
    79.00,
    'PEN',
    '/images/pantalon-nube.jpg',
    'Pantalón materno Nube en color claro'
  ),
  (
    'conjunto-luna',
    'Conjunto descanso Luna',
    'Conjunto de descanso. Consulta la disponibilidad de tallas y colores en la tienda.',
    99.00,
    'PEN',
    '/images/conjunto-luna.jpg',
    'Conjunto de descanso Luna en tono claro'
  );

INSERT INTO producto_categorias (id_producto, id_categoria) VALUES
  ('vestido-aurora', 'vestidos'),
  ('blusa-alma', 'blusas'),
  ('blusa-alma', 'lactancia'),
  ('pantalon-nube', 'pantalones'),
  ('conjunto-luna', 'ropa-descanso');

INSERT INTO producto_tallas (id_producto, talla) VALUES
  ('vestido-aurora', 'S'),
  ('vestido-aurora', 'M'),
  ('vestido-aurora', 'L'),
  ('blusa-alma', 'S'),
  ('blusa-alma', 'M'),
  ('blusa-alma', 'L'),
  ('blusa-alma', 'XL'),
  ('pantalon-nube', 'S'),
  ('pantalon-nube', 'M'),
  ('pantalon-nube', 'L'),
  ('conjunto-luna', 'M'),
  ('conjunto-luna', 'L'),
  ('conjunto-luna', 'XL');

INSERT INTO producto_colores (id_producto, color) VALUES
  ('vestido-aurora', 'Arena'),
  ('vestido-aurora', 'Negro');

CREATE OR REPLACE VIEW vista_pedidos_resumen AS
SELECT
  p.id_pedido,
  p.nombre_cliente,
  p.estado,
  p.entrega,
  p.pago_confirmado,
  p.creado_en,
  COALESCE(SUM(d.cantidad), 0) AS cantidad_prendas,
  COALESCE(SUM(d.cantidad * d.precio_unitario), 0.00) AS total
FROM pedidos AS p
LEFT JOIN detalle_pedido AS d
  ON d.id_pedido = p.id_pedido
GROUP BY
  p.id_pedido,
  p.nombre_cliente,
  p.estado,
  p.entrega,
  p.pago_confirmado,
  p.creado_en;
