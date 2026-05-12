const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend-sierralta');

// --- COMPRAS SERVICE (Update to handle on-the-fly products/providers) ---
const comprasService = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComprasService {
  constructor(private prisma: PrismaService) {}

  async findByFecha(fecha: string) {
    return this.prisma.compraDiaria.findMany({
      where: { fecha: new Date(fecha) },
      include: { trabajador: true, producto: true, proveedor: true }
    });
  }

  async syncBatch(compras: any[]) {
    const results = [];
    for (const data of compras) {
      if (!data.trabajador_id || !data.producto_nombre) continue;
      
      // Auto-create product
      const productoNombre = data.producto_nombre.toUpperCase();
      const producto = await this.prisma.producto.upsert({
        where: { nombre: productoNombre },
        update: {},
        create: { id: \`prod-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`, nombre: productoNombre }
      });

      // Auto-create provider if provided
      let proveedorId = null;
      if (data.proveedor_nombre && data.proveedor_nombre.trim() !== '') {
        const provNombre = data.proveedor_nombre.toUpperCase();
        const prov = await this.prisma.proveedor.upsert({
          where: { id: provNombre }, // using name as ID for simplicity
          update: {},
          create: { id: provNombre, nombre: provNombre }
        });
        proveedorId = prov.id;
      }
      
      const res = await this.prisma.compraDiaria.upsert({
        where: { id: data.id },
        update: {
          cantidad_comprada: data.cantidad_comprada || 0,
          costo_unitario: data.costo_unitario || 0,
          monto_total: data.monto_total || 0,
          proveedor_id: proveedorId,
          es_adicional: data.es_adicional || false,
          no_se_compro: data.no_se_compro || false,
        },
        create: {
          id: data.id,
          fecha: new Date(data.fecha),
          trabajador_id: data.trabajador_id,
          producto_id: producto.id,
          cantidad_solicitada: data.cantidad_solicitada || 0,
          unidad_venta: data.unidad_venta || 'KG',
          unidad_compra: data.unidad_compra || 'KG',
          cantidad_comprada: data.cantidad_comprada || 0,
          costo_unitario: data.costo_unitario || 0,
          monto_total: data.monto_total || 0,
          proveedor_id: proveedorId,
          es_adicional: data.es_adicional || false,
          no_se_compro: data.no_se_compro || false,
        },
      });
      results.push(res);
    }
    return results;
  }
}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'compras', 'compras.service.ts'), comprasService);

// --- INVENTARIO SERVICE (Update to handle on-the-fly products) ---
const inventarioService = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  async findByFecha(fecha: string) {
    return this.prisma.inventarioDiario.findMany({
      where: { fecha: new Date(fecha) },
      include: { trabajador: true, producto: true }
    });
  }

  async syncBatch(inventarios: any[]) {
    const results = [];
    for (const data of inventarios) {
      if (!data.trabajador_id || !data.producto_nombre) continue;
      
      // Auto-create product
      const productoNombre = data.producto_nombre.toUpperCase();
      const producto = await this.prisma.producto.upsert({
        where: { nombre: productoNombre },
        update: {},
        create: { id: \`prod-\${Date.now()}-\${Math.floor(Math.random() * 1000)}\`, nombre: productoNombre }
      });

      const res = await this.prisma.inventarioDiario.upsert({
        where: { 
          fecha_trabajador_id_producto_id: { 
            fecha: new Date(data.fecha), 
            trabajador_id: data.trabajador_id, 
            producto_id: producto.id 
          } 
        },
        update: {
          stock_guardado: data.stock_guardado || 0,
          unidad: data.unidad || 'Kg',
          merma: data.merma || 0,
          motivo_merma: data.motivo_merma || null,
          detalle_otro: data.detalle_otro || null,
          no_hubo_sobrante: data.no_hubo_sobrante || false,
          no_hubo_merma: data.no_hubo_merma || false,
        },
        create: {
          fecha: new Date(data.fecha),
          trabajador_id: data.trabajador_id,
          producto_id: producto.id,
          stock_guardado: data.stock_guardado || 0,
          unidad: data.unidad || 'Kg',
          merma: data.merma || 0,
          motivo_merma: data.motivo_merma || null,
          detalle_otro: data.detalle_otro || null,
          no_hubo_sobrante: data.no_hubo_sobrante || false,
          no_hubo_merma: data.no_hubo_merma || false,
        },
      });
      results.push(res);
    }
    return results;
  }
}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'inventario', 'inventario.service.ts'), inventarioService);

console.log("Services updated for auto-creation.");
