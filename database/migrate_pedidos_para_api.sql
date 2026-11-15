USE pancita_fashion;

ALTER TABLE pedidos
  MODIFY COLUMN estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
  MODIFY COLUMN entrega VARCHAR(30) NOT NULL DEFAULT 'recojo_en_tienda';
