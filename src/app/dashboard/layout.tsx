"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  LogOut,
  Camera,
  FileText,
  User as UserIcon,
  ChevronDown
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserName(localStorage.getItem("user_name"));
  }, []);

  // Definición de ítems de navegación según el ROL
  const allNavItems = [
    { name: "Resumen", icon: LayoutDashboard, path: "/dashboard", roles: ["admin", "supervisor", "encargado", "trabajador"] },
    { name: "Órdenes de Compra", icon: ShoppingCart, path: "/dashboard/ordenes", roles: ["admin", "supervisor"] },
    { name: "Historial de Órdenes", icon: FileText, path: "/dashboard/ordenes/confirmadas", roles: ["admin", "supervisor", "encargado"] },
    { name: "Registro de Mercado", icon: Camera, path: "/dashboard/compras", roles: ["admin", "supervisor", "trabajador"] },
    { name: "Inventario / Stock", icon: Package, path: "/dashboard/inventario", roles: ["admin", "supervisor", "encargado", "trabajador"] },
  ];

  const visibleNavItems = allNavItems.filter(item => role && item.roles.includes(role));

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "var(--background)" }}>
      {/* Sidebar Compacto */}
      <aside style={{ 
        width: "220px", 
        borderRight: "1px solid var(--border)", 
        display: "flex", 
        flexDirection: "column",
        padding: "var(--spacing-md)"
      }}>
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <h3 style={{ color: "var(--primary)", fontSize: "var(--font-base)", letterSpacing: "1px", margin: 0 }}>
            CAMPOS SIERRALTA
          </h3>
          <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>Gestión Fullstack</p>
        </div>

        {/* Perfil de Usuario en Sidebar */}
        <div style={{ 
          marginBottom: "var(--spacing-xl)", 
          padding: "var(--spacing-sm)", 
          backgroundColor: "#fafafa", 
          borderRadius: "var(--radius-sm)",
          display: "flex",
          alignItems: "center",
          gap: "var(--spacing-sm)",
          border: "1px solid var(--border)"
        }}>
          <div style={{ width: "30px", height: "30px", backgroundColor: "var(--primary)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "white" }}>
            <UserIcon size={16} />
          </div>
          <div style={{ overflow: "hidden" }}>
             <p style={{ fontSize: "10px", fontWeight: 700, margin: 0, whiteSpace: "nowrap", textOverflow: "ellipsis" }}>{userName || "Usuario"}</p>
             <p style={{ fontSize: "9px", color: "var(--primary)", margin: 0, textTransform: "uppercase" }}>{role || "Invitado"}</p>
          </div>
        </div>

        <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            return (
              <Link 
                key={item.path} 
                href={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--spacing-sm)",
                  padding: "var(--spacing-sm) var(--spacing-md)",
                  borderRadius: "var(--radius-sm)",
                  fontSize: "var(--font-xs)",
                  color: isActive ? "white" : "var(--foreground)",
                  backgroundColor: isActive ? "var(--primary)" : "transparent",
                  fontWeight: isActive ? 600 : 400,
                  transition: "all 0.2s"
                }}
              >
                <Icon size={16} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <button 
          onClick={() => {
            localStorage.clear();
            window.location.href = "/";
          }}
          style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "var(--spacing-sm)", 
            padding: "var(--spacing-sm) var(--spacing-md)",
            marginTop: "auto",
            fontSize: "var(--font-xs)",
            color: "var(--error)",
            background: "transparent",
            cursor: "pointer"
          }}
        >
          <LogOut size={16} />
          Cerrar Sesión
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, overflowY: "auto", padding: "var(--spacing-lg)" }}>
        {children}
      </main>
    </div>
  );
}
