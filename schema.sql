-- ==========================================
-- 1. CATÁLOGOS Y ENTIDADES PRINCIPALES
-- ==========================================

-- Tabla de Usuarios y Roles
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    rol VARCHAR(50) NOT NULL, -- Ej: 'admin', 'dueño', 'trabajador', 'supervisor', 'encargado'
    prorroga_hasta TIMESTAMP WITH TIME ZONE -- Reemplaza el objeto "workers_extra_time"
);

-- Tabla de Proveedores
CREATE TABLE proveedores (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL
);

-- Tabla Maestra de Productos
CREATE TABLE productos (
    id VARCHAR(100) PRIMARY KEY, 
    nombre VARCHAR(150) NOT NULL UNIQUE,
    unidad_medida_default VARCHAR(50) DEFAULT 'Kg'
);

-- ==========================================
-- 2. ASIGNACIONES (Relación Trabajador <-> Producto)
-- ==========================================
-- Reemplaza el objeto "workers_assignments"
CREATE TABLE asignaciones_trabajador (
    trabajador_id INT REFERENCES usuarios(id) ON DELETE CASCADE,
    producto_id VARCHAR(100) REFERENCES productos(id) ON DELETE CASCADE,
    PRIMARY KEY (trabajador_id, producto_id)
);

-- ==========================================
-- 3. MÓDULO DE INVENTARIO DIARIO
-- ==========================================
-- Reemplaza los arrays "inventario_dia_YYYY-MM-DD_Nombre"
CREATE TABLE inventario_diario (
    id SERIAL PRIMARY KEY,
    fecha DATE NOT NULL,
    trabajador_id INT REFERENCES usuarios(id),
    producto_id VARCHAR(100) REFERENCES productos(id),
    
    stock_guardado NUMERIC(10, 2) DEFAULT 0, -- En el front es stockAnterior
    unidad VARCHAR(50),
    merma NUMERIC(10, 2) DEFAULT 0,
    motivo_merma VARCHAR(100),
    detalle_otro TEXT,
    
    -- PostgreSQL calculará automáticamente el Stock Actual
    stock_actual NUMERIC(10, 2) GENERATED ALWAYS AS (GREATEST(0, stock_guardado - merma)) STORED,
    
    no_hubo_sobrante BOOLEAN DEFAULT FALSE,
    no_hubo_merma BOOLEAN DEFAULT FALSE,
    
    -- Evita que un trabajador registre el mismo producto dos veces el mismo día
    UNIQUE (fecha, trabajador_id, producto_id) 
);

-- ==========================================
-- 4. MÓDULO DE COMPRAS DIARIAS
-- ==========================================
-- Reemplaza los arrays "orden_compra_actual_YYYY-MM-DD_Nombre"
CREATE TABLE compras_diarias (
    id VARCHAR(100) PRIMARY KEY, -- Puedes usar gen_random_uuid() si prefieres UUID real
    fecha DATE NOT NULL,
    trabajador_id INT REFERENCES usuarios(id),
    producto_id VARCHAR(100) REFERENCES productos(id),
    
    cantidad_solicitada NUMERIC(10, 2) DEFAULT 0,
    unidad_venta VARCHAR(50),
    unidad_compra VARCHAR(50),
    
    cantidad_comprada NUMERIC(10, 2) DEFAULT 0,
    costo_unitario NUMERIC(10, 2) DEFAULT 0,
    monto_total NUMERIC(10, 2) DEFAULT 0, 
    
    proveedor_id VARCHAR(50) REFERENCES proveedores(id),
    
    es_adicional BOOLEAN DEFAULT FALSE,
    no_se_compro BOOLEAN DEFAULT FALSE,
    
    UNIQUE (fecha, trabajador_id, producto_id, id)
);

-- Relación 1 a Muchos para las fotos de las boletas (soporta múltiples blob urls / S3 links)
CREATE TABLE fotos_compras (
    id SERIAL PRIMARY KEY,
    compra_id VARCHAR(100) REFERENCES compras_diarias(id) ON DELETE CASCADE,
    url_foto TEXT NOT NULL
);

-- ==========================================
-- 5. MÓDULO DE ÓRDENES DE COMPRA (CONSOLIDACIÓN DE EXCELS)
-- ==========================================
-- Reemplaza "orden_compra_historial"
CREATE TABLE ordenes_consolidacion (
    id VARCHAR(50) PRIMARY KEY, -- Ej: 'OC-202605071815'
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    creado_por_id INT REFERENCES usuarios(id),
    items_count INT DEFAULT 0,
    total_unidades NUMERIC(10, 2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'EN_MERCADO'
);

-- Guarda qué archivos Excel se usaron para generar la orden
CREATE TABLE ordenes_archivos_fuente (
    id SERIAL PRIMARY KEY,
    orden_id VARCHAR(50) REFERENCES ordenes_consolidacion(id) ON DELETE CASCADE,
    nombre_archivo VARCHAR(255) NOT NULL
);

-- El detalle de la orden cruzada con el inventario
CREATE TABLE ordenes_detalle (
    id SERIAL PRIMARY KEY,
    orden_id VARCHAR(50) REFERENCES ordenes_consolidacion(id) ON DELETE CASCADE,
    producto_id VARCHAR(100) REFERENCES productos(id),
    
    cantidad_solicitada NUMERIC(10, 2), -- Lo que pedía el excel
    stock_tienda NUMERIC(10, 2),        -- Lo que había en inventario_diario
    compra_real NUMERIC(10, 2),         -- Lo que realmente se mandó a comprar
    unidad_venta VARCHAR(50)
);
