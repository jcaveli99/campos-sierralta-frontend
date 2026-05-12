const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend-sierralta');

// --- USUARIOS ---
const usuariosService = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  async login(nombre: string, pass: string) {
    const user = await this.prisma.usuario.findUnique({
      where: { nombre },
    });
    if (user && user.password === pass) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async findAll() {
    return this.prisma.usuario.findMany({
      select: { id: true, nombre: true, rol: true, prorroga_hasta: true }
    });
  }

  async grantProrroga(id: number, minutos: number) {
    const prorroga = new Date(Date.now() + minutos * 60000);
    return this.prisma.usuario.update({
      where: { id },
      data: { prorroga_hasta: prorroga }
    });
  }
}
`;

const usuariosController = `import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { UsuariosService } from './usuarios.service';

@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @Post('login')
  async login(@Body() body: { nombre: string; pass: string }) {
    const user = await this.usuariosService.login(body.nombre, body.pass);
    if (!user) return { success: false };
    return { success: true, user };
  }

  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }

  @Patch(':id/prorroga')
  grantProrroga(@Param('id') id: string, @Body() body: { minutos: number }) {
    return this.usuariosService.grantProrroga(+id, body.minutos);
  }
}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'usuarios', 'usuarios.service.ts'), usuariosService);
fs.writeFileSync(path.join(backendDir, 'src', 'usuarios', 'usuarios.controller.ts'), usuariosController);

// --- COMPRAS ---
const comprasService = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ComprasService {
  constructor(private prisma: PrismaService) {}

  async findByFecha(fecha: string) {
    return this.prisma.compraDiaria.findMany({
      where: { fecha: new Date(fecha) },
      include: { trabajador: true }
    });
  }

  async syncBatch(compras: any[]) {
    const results = [];
    for (const data of compras) {
      if (!data.trabajador_id || !data.producto_id) continue;
      
      const res = await this.prisma.compraDiaria.upsert({
        where: { id: data.id },
        update: {
          cantidad_comprada: data.cantidad_comprada,
          costo_unitario: data.costo_unitario,
          monto_total: data.monto_total,
          proveedor_id: data.proveedor_id,
          es_adicional: data.es_adicional,
          no_se_compro: data.no_se_compro,
        },
        create: {
          id: data.id,
          fecha: new Date(data.fecha),
          trabajador_id: data.trabajador_id,
          producto_id: data.producto_id,
          cantidad_solicitada: data.cantidad_solicitada,
          unidad_venta: data.unidad_venta,
          unidad_compra: data.unidad_compra,
          cantidad_comprada: data.cantidad_comprada,
          costo_unitario: data.costo_unitario,
          monto_total: data.monto_total,
          proveedor_id: data.proveedor_id,
          es_adicional: data.es_adicional,
          no_se_compro: data.no_se_compro,
        },
      });
      results.push(res);
    }
    return results;
  }
}
`;

const comprasController = `import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ComprasService } from './compras.service';

@Controller('compras')
export class ComprasController {
  constructor(private readonly comprasService: ComprasService) {}

  @Get()
  findByFecha(@Query('fecha') fecha: string) {
    return this.comprasService.findByFecha(fecha);
  }

  @Post('sync')
  syncBatch(@Body() compras: any[]) {
    return this.comprasService.syncBatch(compras);
  }
}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'compras', 'compras.service.ts'), comprasService);
fs.writeFileSync(path.join(backendDir, 'src', 'compras', 'compras.controller.ts'), comprasController);

// --- INVENTARIO ---
const inventarioService = `import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventarioService {
  constructor(private prisma: PrismaService) {}

  async findByFecha(fecha: string) {
    return this.prisma.inventarioDiario.findMany({
      where: { fecha: new Date(fecha) },
      include: { trabajador: true }
    });
  }

  async syncBatch(inventarios: any[]) {
    const results = [];
    for (const data of inventarios) {
      if (!data.trabajador_id || !data.producto_id) continue;
      
      const res = await this.prisma.inventarioDiario.upsert({
        where: { fecha_trabajador_id_producto_id: { fecha: new Date(data.fecha), trabajador_id: data.trabajador_id, producto_id: data.producto_id } },
        update: {
          stock_guardado: data.stock_guardado,
          unidad: data.unidad,
          merma: data.merma,
          motivo_merma: data.motivo_merma,
          detalle_otro: data.detalle_otro,
          no_hubo_sobrante: data.no_hubo_sobrante,
          no_hubo_merma: data.no_hubo_merma,
        },
        create: {
          fecha: new Date(data.fecha),
          trabajador_id: data.trabajador_id,
          producto_id: data.producto_id,
          stock_guardado: data.stock_guardado,
          unidad: data.unidad,
          merma: data.merma,
          motivo_merma: data.motivo_merma,
          detalle_otro: data.detalle_otro,
          no_hubo_sobrante: data.no_hubo_sobrante,
          no_hubo_merma: data.no_hubo_merma,
        },
      });
      results.push(res);
    }
    return results;
  }
}
`;

const inventarioController = `import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { InventarioService } from './inventario.service';

@Controller('inventario')
export class InventarioController {
  constructor(private readonly inventarioService: InventarioService) {}

  @Get()
  findByFecha(@Query('fecha') fecha: string) {
    return this.inventarioService.findByFecha(fecha);
  }

  @Post('sync')
  syncBatch(@Body() inventarios: any[]) {
    return this.inventarioService.syncBatch(inventarios);
  }
}
`;

fs.writeFileSync(path.join(backendDir, 'src', 'inventario', 'inventario.service.ts'), inventarioService);
fs.writeFileSync(path.join(backendDir, 'src', 'inventario', 'inventario.controller.ts'), inventarioController);

console.log("Backend endpoints setup completed.");
