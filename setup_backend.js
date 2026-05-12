const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const backendDir = path.join(__dirname, '..', 'backend-sierralta');

// Create directories if they don't exist
const dirs = [
  path.join(backendDir, 'prisma'),
  path.join(backendDir, 'src', 'prisma'),
  path.join(backendDir, 'src', 'usuarios'),
  path.join(backendDir, 'src', 'compras'),
  path.join(backendDir, 'src', 'inventario'),
  path.join(backendDir, 'src', 'ordenes'),
  path.join(backendDir, 'src', 'proveedores'),
  path.join(backendDir, 'src', 'productos'),
];

dirs.forEach(d => {
  if (!fs.existsSync(d)) {
    fs.mkdirSync(d, { recursive: true });
  }
});

const schemaContent = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Usuario {
  id             Int       @id @default(autoincrement())
  nombre         String    @unique
  rol            String
  prorroga_hasta DateTime?

  asignaciones   AsignacionTrabajador[]
  inventarios    InventarioDiario[]
  compras        CompraDiaria[]
  ordenesCreadas OrdenConsolidacion[]

  @@map("usuarios")
}

model Proveedor {
  id      String @id
  nombre  String

  compras CompraDiaria[]

  @@map("proveedores")
}

model Producto {
  id                    String @id
  nombre                String @unique
  unidad_medida_default String @default("Kg")

  asignaciones AsignacionTrabajador[]
  inventarios  InventarioDiario[]
  compras      CompraDiaria[]
  ordenes      OrdenDetalle[]

  @@map("productos")
}

model AsignacionTrabajador {
  trabajador_id Int
  producto_id   String

  trabajador Usuario  @relation(fields: [trabajador_id], references: [id], onDelete: Cascade)
  producto   Producto @relation(fields: [producto_id], references: [id], onDelete: Cascade)

  @@id([trabajador_id, producto_id])
  @@map("asignaciones_trabajador")
}

model InventarioDiario {
  id             Int      @id @default(autoincrement())
  fecha          DateTime @db.Date
  trabajador_id  Int
  producto_id    String
  stock_guardado Decimal  @default(0) @db.Decimal(10, 2)
  unidad         String?
  merma          Decimal  @default(0) @db.Decimal(10, 2)
  motivo_merma   String?
  detalle_otro   String?
  stock_actual   Decimal  @default(0) @db.Decimal(10, 2)
  no_hubo_sobrante Boolean @default(false)
  no_hubo_merma  Boolean  @default(false)

  trabajador Usuario  @relation(fields: [trabajador_id], references: [id])
  producto   Producto @relation(fields: [producto_id], references: [id])

  @@unique([fecha, trabajador_id, producto_id])
  @@map("inventario_diario")
}

model CompraDiaria {
  id                 String   @id
  fecha              DateTime @db.Date
  trabajador_id      Int
  producto_id        String
  cantidad_solicitada Decimal  @default(0) @db.Decimal(10, 2)
  unidad_venta       String?
  unidad_compra      String?
  cantidad_comprada  Decimal  @default(0) @db.Decimal(10, 2)
  costo_unitario     Decimal  @default(0) @db.Decimal(10, 2)
  monto_total        Decimal  @default(0) @db.Decimal(10, 2)
  proveedor_id       String?
  es_adicional       Boolean  @default(false)
  no_se_compro       Boolean  @default(false)

  trabajador Usuario    @relation(fields: [trabajador_id], references: [id])
  producto   Producto   @relation(fields: [producto_id], references: [id])
  proveedor  Proveedor? @relation(fields: [proveedor_id], references: [id])
  fotos      FotoCompra[]

  @@unique([fecha, trabajador_id, producto_id, id])
  @@map("compras_diarias")
}

model FotoCompra {
  id        Int          @id @default(autoincrement())
  compra_id String
  url_foto  String
  compra    CompraDiaria @relation(fields: [compra_id], references: [id], onDelete: Cascade)

  @@map("fotos_compras")
}

model OrdenConsolidacion {
  id             String   @id
  fecha_creacion DateTime @default(now())
  creado_por_id  Int
  items_count    Int      @default(0)
  total_unidades Decimal  @default(0) @db.Decimal(10, 2)
  estado         String   @default("EN_MERCADO")

  creador Usuario @relation(fields: [creado_por_id], references: [id])
  archivos OrdenArchivoFuente[]
  detalles OrdenDetalle[]

  @@map("ordenes_consolidacion")
}

model OrdenArchivoFuente {
  id             Int                @id @default(autoincrement())
  orden_id       String
  nombre_archivo String
  orden          OrdenConsolidacion @relation(fields: [orden_id], references: [id], onDelete: Cascade)

  @@map("ordenes_archivos_fuente")
}

model OrdenDetalle {
  id                  Int                @id @default(autoincrement())
  orden_id            String
  producto_id         String
  cantidad_solicitada Decimal?           @db.Decimal(10, 2)
  stock_tienda        Decimal?           @db.Decimal(10, 2)
  compra_real         Decimal?           @db.Decimal(10, 2)
  unidad_venta        String?

  orden    OrdenConsolidacion @relation(fields: [orden_id], references: [id], onDelete: Cascade)
  producto Producto           @relation(fields: [producto_id], references: [id])

  @@map("ordenes_detalle")
}
`;

fs.writeFileSync(path.join(backendDir, 'prisma', 'schema.prisma'), schemaContent);

const envContent = `DATABASE_URL="postgresql://admin:password123@localhost:5432/campos_sierralta_db?schema=public"
`;

fs.writeFileSync(path.join(backendDir, '.env'), envContent);

const prismaService = `import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'prisma', 'prisma.service.ts'), prismaService);

const prismaModule = `import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'prisma', 'prisma.module.ts'), prismaModule);

const appModule = `import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
// Modules will be imported here automatically when generating via Nest CLI, or we add them

@Module({
  imports: [PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'app.module.ts'), appModule);

const mainTs = `import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Permite conectar el frontend con el backend
  await app.listen(4000);
}
bootstrap();
`;

fs.writeFileSync(path.join(backendDir, 'src', 'main.ts'), mainTs);

console.log("Files written successfully in backend-sierralta");
