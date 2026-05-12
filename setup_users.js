const fs = require('fs');
const path = require('path');

const backendDir = path.join(__dirname, '..', 'backend-sierralta');
const schemaPath = path.join(backendDir, 'prisma', 'schema.prisma');

let schema = fs.readFileSync(schemaPath, 'utf8');

if (!schema.includes('password')) {
  schema = schema.replace(
    /model Usuario {[\s\S]*?nombre         String    @unique/m,
    `model Usuario {\n  id             Int       @id @default(autoincrement())\n  nombre         String    @unique\n  password       String?`
  );
  fs.writeFileSync(schemaPath, schema);
  console.log('Schema updated with password field.');
}

const seedScript = `const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = [
    { nombre: 'Edmundo', rol: 'dueño', password: 'admin123' },
    { nombre: 'Angel', rol: 'supervisor', password: 'super123' },
    { nombre: 'Alex', rol: 'encargado', password: 'tienda123' },
    { nombre: 'Fabrizzio', rol: 'trabajador', password: 'fb123' },
    { nombre: 'Daniel', rol: 'trabajador', password: 'da123' },
    { nombre: 'Jesus', rol: 'trabajador', password: 'js123' }
  ];

  for (const user of users) {
    await prisma.usuario.upsert({
      where: { nombre: user.nombre },
      update: { password: user.password, rol: user.rol },
      create: user,
    });
  }
  console.log('Database seeded with users!');
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
`;

fs.writeFileSync(path.join(backendDir, 'seed.js'), seedScript);
