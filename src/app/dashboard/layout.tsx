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
  ChevronDown,
  BarChart3,
  ClipboardList,
  Wallet,
  Menu,
  X
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserName(localStorage.getItem("user_name"));
  }, []);

  // Cerrar menú móvil automáticamente al navegar
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  // Definición de ítems de navegación según el ROL
  const allNavItems = [
    { name: "Resumen", icon: LayoutDashboard, path: "/dashboard", roles: ["admin", "supervisor", "encargado", "trabajador"] },
    { name: "Órdenes de Compra", icon: ShoppingCart, path: "/dashboard/ordenes", roles: ["admin", "supervisor"] },
    { name: "Historial de Órdenes", icon: FileText, path: "/dashboard/ordenes/confirmadas", roles: ["admin", "supervisor", "encargado"] },
    { name: "Registro de Mercado", icon: Camera, path: "/dashboard/compras", roles: ["admin", "supervisor", "trabajador"] },
    { name: "Inventario / Stock", icon: Package, path: "/dashboard/inventario", roles: ["admin", "supervisor", "encargado", "trabajador"] },
    { name: "Reporte General", icon: BarChart3, path: "/dashboard/reportes", roles: ["admin", "encargado"] },
    { name: "Reporte x Proveedor", icon: ClipboardList, path: "/dashboard/reportes/proveedor", roles: ["admin", "encargado"] },
    { name: "Vista Pagos", icon: Wallet, path: "/dashboard/pagos", roles: ["admin"] },
  ];

  const visibleNavItems = allNavItems.filter(item => role && item.roles.includes(role));

  return (
    <div className="dashboard-layout" style={{ display: "flex", height: "100vh", backgroundColor: "var(--background)", flexDirection: "column" }}>
      
      {/* 📱 MOBILE HEADER (Extra Navbar solo en celular) */}
      <div className="mobile-header" style={{ display: "none", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border)", backgroundColor: "white", zIndex: 1000, boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <h3 style={{ margin: 0, fontSize: "var(--font-base)", color: "var(--primary)", letterSpacing: "1px" }}>CAMPOS SIERRALTA</h3>
          <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>{role || "Gestión"}</p>
        </Link>
        <button onClick={() => setIsMobileMenuOpen(true)} style={{ background: "none", border: "none", color: "var(--foreground)", padding: "4px" }}>
          <Menu size={24} />
        </button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        
        {/* Overlay oscuro móvil cuando el Drawer está abierto */}
        <div 
          className={`mobile-overlay ${isMobileMenuOpen ? 'open' : ''}`}
          onClick={() => setIsMobileMenuOpen(false)}
          style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 9998, display: "none" }}
        />

        {/* 💻 DESKTOP SIDEBAR + 📱 MOBILE DRAWER */}
        <aside className={`sidebar ${isMobileMenuOpen ? 'open' : ''}`} style={{ 
          width: "220px", 
          borderRight: "1px solid var(--border)", 
          display: "flex", 
          flexDirection: "column",
          padding: "var(--spacing-md)",
          flexShrink: 0
        }}>
          
          <div className="mobile-only" style={{ display: "none", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)", paddingBottom: "var(--spacing-sm)", borderBottom: "1px solid var(--border)" }}>
            <h3 style={{ margin: 0, fontSize: "var(--font-lg)", color: "var(--primary)" }}>Menú</h3>
            <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "none", border: "none" }}><X size={24} /></button>
          </div>

          <Link href="/dashboard" className="sidebar-header desktop-only" style={{ marginBottom: "var(--spacing-xl)", textDecoration: "none", display: "block" }}>
            <h3 style={{ color: "var(--primary)", fontSize: "var(--font-base)", letterSpacing: "1px", margin: 0 }}>
              CAMPOS SIERRALTA
            </h3>
            <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: 0 }}>Gestión Fullstack</p>
          </Link>

        {/* Perfil de Usuario en Sidebar */}
        <div className="sidebar-profile" style={{ 
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

        <nav className="sidebar-nav" style={{ flex: 1, display: "flex", flexDirection: "column", gap: "var(--spacing-xs)" }}>
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

        <main className="main-content" style={{ flex: 1, overflowY: "auto", padding: "var(--spacing-lg)", minWidth: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
}
