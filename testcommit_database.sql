-- Sistema de Gestión de Ventas - Modelo de Base de Datos MySQL

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS gestion_ventas DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE gestion_ventas;

-- Tabla de Usuarios
CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(10) NOT NULL UNIQUE,
    nombre VARCHAR(100) NOT NULL,
    rol ENUM('admin', 'empleado') NOT NULL,
    password VARCHAR(255) NOT NULL,
    terminal_id VARCHAR(50),
    ultimo_login DATETIME,
    estado BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Productos
CREATE TABLE productos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    codigo_barras VARCHAR(50) UNIQUE,
    nombre VARCHAR(255) NOT NULL,
    categoria VARCHAR(50) NOT NULL,
    descripcion TEXT,
    precio_venta DECIMAL(10,2) NOT NULL,
    precio_costo DECIMAL(10,2) NOT NULL,
    stock INT NOT NULL DEFAULT 0,
    unidad_medida ENUM('UNIDAD', 'GRAMO', 'KILO', 'LITRO', 'MILILITRO') NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de Ventas
CREATE TABLE ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    numero_ticket VARCHAR(20) NOT NULL UNIQUE,
    usuario_id INT NOT NULL,
    total_venta DECIMAL(10,2) NOT NULL,
    total_impuesto DECIMAL(10,2) NOT NULL,
    tipo_pago ENUM('EFECTIVO', 'TARJETA', 'TRANSFERENCIA') NOT NULL,
    estado ENUM('PENDIENTE', 'COMPLETADA', 'ANULADA') DEFAULT 'PENDIENTE',
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de Detalle de Ventas
CREATE TABLE detalle_ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    producto_id INT NOT NULL,
    cantidad INT NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);

-- Tabla de Devoluciones
CREATE TABLE devoluciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    venta_id INT NOT NULL,
    numero_ticket VARCHAR(20) NOT NULL,
    usuario_id INT NOT NULL,
    razon_devolucion TEXT NOT NULL,
    total_devolucion DECIMAL(10,2) NOT NULL,
    estado ENUM('PENDIENTE', 'COMPLETADA') DEFAULT 'PENDIENTE',
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de Ofertas
CREATE TABLE ofertas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo ENUM('NXM', 'N+M') NOT NULL,
    producto_principal_id INT NOT NULL,
    cantidad_requerida INT NOT NULL,
    producto_gratis_id INT,
    cantidad_gratis INT,
    descuento DECIMAL(10,2),
    precio_oferta DECIMAL(10,2),
    fecha_inicio DATETIME NOT NULL,
    fecha_fin DATETIME NOT NULL,
    estado BOOLEAN DEFAULT TRUE,
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (producto_principal_id) REFERENCES productos(id),
    FOREIGN KEY (producto_gratis_id) REFERENCES productos(id)
);

-- Tabla de Reportes de Ventas
CREATE TABLE reportes_ventas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fecha DATE NOT NULL,
    total_ventas DECIMAL(10,2) NOT NULL,
    total_productos INT NOT NULL,
    total_impuestos DECIMAL(10,2) NOT NULL,
    creado_el TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insertar datos iniciales
INSERT INTO usuarios (codigo, nombre, rol, password) VALUES
('1001', 'Juan Pérez', 'empleado', '$2y$10$123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'),
('2001', 'María García', 'empleado', '$2y$10$123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890'),
('9999', 'Carlos Admin', 'admin', '$2y$10$123456789012345678901234567890123456789012345678901234567890123456789012345678901234567890');

INSERT INTO productos (codigo, codigo_barras, nombre, categoria, descripcion, precio_venta, precio_costo, stock, unidad_medida) VALUES
('P001', '780000000001', 'Pan Integral 500g', 'Panadería', 'Pan integral de trigo', 5.50, 3.50, 100, 'KILO'),
('P002', '780000000002', 'Leche Entera 1L', 'Lácteos', 'Leche entera pasteurizada', 4.50, 2.80, 150, 'LITRO'),
('P003', '780000000003', 'Coca-Cola 2L', 'Bebidas', 'Refresco de cola', 6.50, 3.20, 200, 'LITRO'),
('P004', '780000000004', 'Pasta Dental Colgate', 'Cuidado Personal', 'Pasta dental regular', 7.50, 4.50, 80, 'UNIDAD'),
('P005', '780000000005', 'Arroz Extra 1kg', 'Abarrotes', 'Arroz extra grano largo', 4.20, 2.50, 120, 'KILO');

-- Crear índices para optimizar consultas
CREATE INDEX idx_usuarios_codigo ON usuarios(codigo);
CREATE INDEX idx_productos_codigo ON productos(codigo);
CREATE INDEX idx_productos_categoria ON productos(categoria);
CREATE INDEX idx_ventas_fecha ON ventas(creado_el);
CREATE INDEX idx_detalle_ventas_producto ON detalle_ventas(producto_id);

-- Procedimientos almacenados útiles
DELIMITER //
CREATE PROCEDURE sp_actualizar_stock_producto(
    IN p_producto_id INT,
    IN p_cantidad INT
)
BEGIN
    UPDATE productos 
    SET stock = stock + p_cantidad,
        actualizado_el = CURRENT_TIMESTAMP
    WHERE id = p_producto_id;
END //
DELIMITER ;

DELIMITER //
CREATE PROCEDURE sp_generar_reporte_ventas(
    IN p_fecha DATE
)
BEGIN
    INSERT INTO reportes_ventas (fecha, total_ventas, total_productos, total_impuestos)
    SELECT 
        p_fecha,
        SUM(v.total_venta),
        SUM(dv.cantidad),
        SUM(v.total_impuesto)
    FROM ventas v
    JOIN detalle_ventas dv ON v.id = dv.venta_id
    WHERE DATE(v.creado_el) = p_fecha
    AND v.estado = 'COMPLETADA';
END //
DELIMITER ;
