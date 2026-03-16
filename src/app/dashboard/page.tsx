"use client";

import { useState, useEffect } from "react";
import { 
  TrendingUp, 
  AlertCircle, 
  ShoppingBag, 
  Users, 
  ArrowUpRight, 
  CheckCircle2,
  Clock,
  ShieldCheck
} from "lucide-react";

export default function Dashboard() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    setRole(localStorage.getItem("user_role"));
    setUserName(localStorage.getItem("user_name"));
  }, []);

  const stats = [
    { title: "Stock Total Disponible", value: "1,240 unid.", sub: "+12% vs ayer", color: "var(--primary)", icon: ShoppingBag },
    { title: "Mermas Reportadas", value: "S/ 145.20", sub: "3 productos", color: "var(--error)", icon: AlertCircle },
    { title: "Pedidos Rappi Hoy", value: "45", sub: "9 sedes", color: "var(--success)", icon: TrendingUp },
    { title: "Personal Activo", value: "12", sub: "4 roles", color: "#333", icon: Users },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "var(--spacing-xl)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-sm)" }}>
           <ShieldCheck size={20} color="var(--primary)" />
           <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Panel de Control Seguro</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800 }}>Bienvenido, {userName || "Usuario"}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>
          {role === "admin" && "Tienes acceso total al sistema de Campos Sierralta."}
          {role === "supervisor" && "Supervisando operaciones de mercado y stock acumulado."}
          {role === "encargado" && "Gestionando órdenes confirmadas y stock de tienda."}
          {role === "trabajador" && "Registrando compras de mercado y control de mermas."}
        </p>
      </header>

      {/* Grid de Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)" }}>
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="card" style={{ padding: "var(--spacing-lg)", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-md)" }}>
                 <div style={{ width: "40px", height: "40px", backgroundColor: `${stat.color}10`, borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: stat.color }}>
                    <Icon size={20} />
                 </div>
                 <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--success)", display: "flex", alignItems: "center" }}>
                    {stat.sub} <ArrowUpRight size={10} />
                 </span>
              </div>
              <h4 style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--text-muted)", fontWeight: 600 }}>{stat.title}</h4>
              <p style={{ margin: "4px 0 0 0", fontSize: "var(--font-lg)", fontWeight: 800, color: "#111" }}>{stat.value}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--spacing-lg)" }}>
        {/* Actividad Reciente */}
        <div className="card" style={{ padding: "var(--spacing-lg)" }}>
          <h3 style={{ fontSize: "var(--font-base)", marginBottom: "var(--spacing-lg)", fontWeight: 800 }}>Actividad Crítica Reciente</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
             <div style={{ display: "flex", gap: "var(--spacing-md)", paddingBottom: "var(--spacing-md)", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ color: "var(--error)" }}><AlertCircle size={18} /></div>
                <div>
                   <p style={{ margin: 0, fontSize: "var(--font-xs)", fontWeight: 700 }}>Alerta de Stock: Brócoli Bajo</p>
                   <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>Faltan 5 unidades para cubrir el pedido de San Luis.</p>
                </div>
                <div style={{ marginLeft: "auto", fontSize: "9px", color: "var(--text-muted)" }}>Hace 5 min</div>
             </div>
             <div style={{ display: "flex", gap: "var(--spacing-md)", paddingBottom: "var(--spacing-md)", borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ color: "var(--success)" }}><CheckCircle2 size={18} /></div>
                <div>
                   <p style={{ margin: 0, fontSize: "var(--font-xs)", fontWeight: 700 }}>Orden OC-20260310 Disponible</p>
                   <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>Confirmada por Dueño Principal. Lista para descarga.</p>
                </div>
                <div style={{ marginLeft: "auto", fontSize: "9px", color: "var(--text-muted)" }}>Hace 15 min</div>
             </div>
          </div>
        </div>

        {/* Accesos Rápidos según ROL */}
        <div className="card" style={{ padding: "var(--spacing-lg)", backgroundColor: "var(--secondary)", border: "none" }}>
          <h3 style={{ fontSize: "var(--font-base)", marginBottom: "var(--spacing-lg)", fontWeight: 800 }}>Accesos Rápidos</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {role === "admin" && (
              <button className="btn-primary" style={{ height: "auto", padding: "10px", fontSize: "11px" }} onClick={() => window.location.href='/dashboard/ordenes'}>
                Cargar Nuevo Excel de Rappi
              </button>
            )}
            {(role === "trabajador" || role === "admin") && (
              <button className="btn-primary" style={{ height: "auto", padding: "10px", fontSize: "11px", backgroundColor: "#333" }} onClick={() => window.location.href='/dashboard/compras'}>
                Ir a Registro de Mercado
              </button>
            )}
            {(role === "encargado" || role === "supervisor" || role === "admin") && (
              <button className="btn-primary" style={{ height: "auto", padding: "10px", fontSize: "11px", backgroundColor: "#1d6f42" }} onClick={() => window.location.href='/dashboard/ordenes/confirmadas'}>
                Descargar Órdenes PDF/Excel
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
