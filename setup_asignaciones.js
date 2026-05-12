const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend-sierralta');
const svcPath = path.join(backendDir, 'src', 'usuarios', 'usuarios.service.ts');
const ctrlPath = path.join(backendDir, 'src', 'usuarios', 'usuarios.controller.ts');

let svcContent = fs.readFileSync(svcPath, 'utf8');

if (!svcContent.includes('saveAsignaciones')) {
  // Append new methods inside the class
  svcContent = svcContent.replace(/}\s*$/, `
  async getAsignaciones() {
    const users = await this.prisma.usuario.findMany({
      include: { asignaciones: { include: { producto: true } } }
    });
    const result = {};
    for (const u of users) {
      result[u.nombre] = u.asignaciones.map(a => a.producto.nombre);
    }
    return result;
  }

  async saveAsignaciones(asignacionesDict: Record<string, string[]>) {
    for (const [workerName, products] of Object.entries(asignacionesDict)) {
      const user = await this.prisma.usuario.findUnique({ where: { nombre: workerName } });
      if (!user) continue;

      // Delete old assignments
      await this.prisma.asignacionTrabajador.deleteMany({
        where: { trabajador_id: user.id }
      });

      // Create new ones
      for (const prodName of products) {
        const prodUpper = prodName.toUpperCase();
        const producto = await this.prisma.producto.upsert({
          where: { nombre: prodUpper },
          update: {},
          create: { id: \`prod-\${Date.now()}-\${Math.floor(Math.random()*1000)}\`, nombre: prodUpper }
        });
        
        await this.prisma.asignacionTrabajador.create({
          data: {
            trabajador_id: user.id,
            producto_id: producto.id
          }
        });
      }
    }
    return { success: true };
  }
}
`);
  fs.writeFileSync(svcPath, svcContent);
}

let ctrlContent = fs.readFileSync(ctrlPath, 'utf8');
if (!ctrlContent.includes('getAsignaciones')) {
  ctrlContent = ctrlContent.replace(/}\s*$/, `
  @Get('asignaciones')
  getAsignaciones() {
    return this.usuariosService.getAsignaciones();
  }

  @Post('asignaciones')
  saveAsignaciones(@Body() body: Record<string, string[]>) {
    return this.usuariosService.saveAsignaciones(body);
  }
}
`);
  fs.writeFileSync(ctrlPath, ctrlContent);
}

console.log('Asignaciones backend endpoints added.');
