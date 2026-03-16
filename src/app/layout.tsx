import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CAMPOS SIERRALTA - Gestión de Compras",
  description: "Sistema de control de compras, inventario y merma para frutas y verduras seleccionadas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
