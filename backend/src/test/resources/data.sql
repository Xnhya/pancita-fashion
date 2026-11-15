INSERT INTO categorias (id_categoria, nombre)
VALUES ('vestidos', 'Vestidos');

INSERT INTO productos (
  id_producto,
  nombre,
  descripcion,
  precio,
  moneda,
  imagen_url,
  imagen_descripcion,
  activo,
  creado_en,
  actualizado_en
) VALUES (
  'vestido-aurora',
  'Vestido materno Aurora',
  'Prenda de ejemplo para pruebas.',
  89.00,
  'PEN',
  '/images/vestido-aurora.jpg',
  'Vestido materno Aurora',
  1,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
);

INSERT INTO producto_categorias (id_producto, id_categoria)
VALUES ('vestido-aurora', 'vestidos');

INSERT INTO producto_tallas (id_producto, talla)
VALUES ('vestido-aurora', 'S'), ('vestido-aurora', 'M'), ('vestido-aurora', 'L');

INSERT INTO producto_colores (id_producto, color)
VALUES ('vestido-aurora', 'Arena'), ('vestido-aurora', 'Negro');
