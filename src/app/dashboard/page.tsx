"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  AlertCircle, 
  ShoppingBag, 
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  BarChart3,
  Wallet,
  Camera,
  Package,
  Download,
  FileText,
  PackageCheck,
  PackageMinus,
  AlertTriangle,
  Info,
  X,
  Zap,
  Pointer
} from "lucide-react";

const ROLE_CONTENT: Record<string, any> = {
  admin: {
    title: "Administrador / Dueño",
    shortcuts: [
      { label: "Cargar Excel de Rappi", icon: FileSpreadsheet, path: "/dashboard/ordenes", color: "#f97316", bg: "rgba(249, 115, 22, 0.1)" },
      { label: "Registro de Mercado", icon: ShoppingBag, path: "/dashboard/compras", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
      { label: "Reporte General", icon: BarChart3, path: "/dashboard/reportes", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" },
      { label: "Historial de Pagos", icon: Wallet, path: "/dashboard/pagos", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
    ],
    reminders: [
      { id: 1, type: "warning", title: "Pagos Pendientes a Proveedores", desc: "Existen pagos recientes que aún figuran como PENDIENTES. Visita la vista de Pagos para cuadrar cajas.", time: "Atención Requerida", icon: AlertTriangle, color: "#f59e0b" },
      { id: 2, type: "success", title: "Órdenes Semanales Completadas", desc: "Se ha registrado un incremento del 15% en efectividad de compras esta semana.", time: "Ayer", icon: CheckCircle2, color: "#10b981" },
    ],
    welcomeMessage: "Como administrador principal, tienes acceso irrestricto a los módulos de finanzas, auditorías y cargas de pedidos."
  },
  supervisor: {
    title: "Supervisor de Operaciones",
    shortcuts: [
      { label: "Supervisar Mercado", icon: Camera, path: "/dashboard/compras", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
      { label: "Control de Inventario", icon: Package, path: "/dashboard/inventario", color: "#8b5cf6", bg: "rgba(139, 92, 246, 0.1)" },
      { label: "Descargar Órdenes Listas", icon: Download, path: "/dashboard/ordenes/confirmadas", color: "#0ea5e9", bg: "rgba(14, 165, 233, 0.1)" },
    ],
    reminders: [
      { id: 1, type: "warning", title: "Monitoreo de Mermas Físicas", desc: "Asegúrate de revisar el stock sobrante de ayer de Fresa antes de los nuevos envíos a tiendas.", time: "Hace 1 hora", icon: AlertTriangle, color: "#f59e0b" },
      { id: 2, type: "info", title: "Orden OC-20260310 Autorizada", desc: "La orden generada por el dueño se encuentra lista para su descarga e impresión.", time: "Hace 2 horas", icon: Info, color: "#3b82f6" },
    ],
    welcomeMessage: "Como supervisor, tu rol es asegurar que tanto los compradores de mercado como los encargados de tienda operen en perfecta sincronización."
  },
  encargado: {
    title: "Encargado de Tienda",
    shortcuts: [
      { label: "Descargar PDF para Armado", icon: FileText, path: "/dashboard/ordenes/confirmadas", color: "#ef4444", bg: "rgba(239, 68, 68, 0.1)" },
      { label: "Stock Final Consolidado", icon: PackageCheck, path: "/dashboard/inventario", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
    ],
    reminders: [
      { id: 1, type: "warning", title: "Armado Diario de Pedidos", desc: "No olvides descargar el PDF Vertical Culinario de la orden de hoy para iniciar tu turno sin retrasos.", time: "Hoy, 6:00 AM", icon: Clock, color: "#ef4444" },
      { id: 2, type: "info", title: "Reporte de Sobrantes", desc: "Verifica el estado de maduración de Brócoli y Papayas en el inventario al cierre del día.", time: "Recordatorio Diario", icon: Info, color: "#3b82f6" },
    ],
    welcomeMessage: "Como encargado, tu prioridad es la recepción y armado de los pedidos diarios solicitados para tu local."
  },
  trabajador: {
    title: "Personal de Mercado (Compras)",
    shortcuts: [
      { label: "Entrar Urgente a Mercado", icon: Camera, path: "/dashboard/compras", color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" },
      { label: "Ver Reportes de Merma", icon: PackageMinus, path: "/dashboard/inventario", color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" },
    ],
    reminders: [
      { id: 1, type: "warning", title: "Auditoría Fotográfica Obligatoria", desc: "Asegúrate de tomar fotos impecables y legibles de las boletas físicas en el mercado para auditoría administrativa.", time: "Regla Permanente", icon: Camera, color: "#f59e0b" },
      { id: 2, type: "info", title: "Ingreso Manual Numérico", desc: "Tip: Verifica que el precio de compra sea exactamente por KG según la balanza antes de finalizar el registro.", time: "Recordatorio", icon: AlertCircle, color: "#3b82f6" },
    ],
    welcomeMessage: "Como personal de compras, eres fundamental para el abastecimiento temprano. Asegúrate de cotizar y subir las evidencias."
  }
};

export default function Dashboard() {
  const router = useRouter();
  const [role, setRole] = useState<string>("trabajador");
  const [userName, setUserName] = useState<string>("Usuario");
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const storedRole = localStorage.getItem("user_role") || "trabajador";
    const storedName = localStorage.getItem("user_name") || "Usuario";
    setRole(storedRole);
    setUserName(storedName);

    // Lógica del modal una vez por sesión
    if (!sessionStorage.getItem("welcome_shown")) {
      setShowWelcomeModal(true);
      sessionStorage.setItem("welcome_shown", "true");
    }
  }, []);

  if (!mounted) return null;

  const currentData = ROLE_CONTENT[role] || ROLE_CONTENT["trabajador"];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", width: "100%", paddingBottom: "100px" }}>
      
      {/* ── MODAL DE BIENVENIDA MÁGICO ── */}
      {showWelcomeModal && (
        <div style={{ position: "fixed", inset: 0, zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(5px)" }}>
          <div className="card" style={{ width: "90%", maxWidth: "420px", padding: "0", overflow: "hidden", animation: "slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
            <div style={{ backgroundColor: "var(--primary)", padding: "var(--spacing-xl)", color: "white", textAlign: "center", position: "relative" }}>
               <button onClick={() => setShowWelcomeModal(false)} style={{ position: "absolute", top: "12px", right: "12px", background: "rgba(255,255,255,0.2)", border: "none", color: "white", borderRadius: "50%", width: "28px", height: "28px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><X size={16} /></button>
               <div style={{ width: "64px", height: "64px", backgroundColor: "white", borderRadius: "50%", margin: "0 auto var(--spacing-md)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                 <ShieldCheck size={32} color="var(--primary)" />
               </div>
               <h2 style={{ margin: 0, fontSize: "var(--font-xl)", fontWeight: 800 }}>¡Hola, {userName}!</h2>
               <p style={{ margin: "4px 0 0", fontSize: "var(--font-xs)", opacity: 0.9 }}>Has ingresado como <strong>{currentData.title}</strong></p>
            </div>
            <div style={{ padding: "var(--spacing-xl)", textAlign: "center" }}>
               <p style={{ color: "var(--text-main)", fontSize: "var(--font-sm)", lineHeight: 1.6, margin: "0 0 var(--spacing-xl) 0" }}>
                 {currentData.welcomeMessage}
               </p>
               <button 
                 onClick={() => setShowWelcomeModal(false)}
                 className="btn-primary" 
                 style={{ width: "100%", padding: "14px", fontSize: "var(--font-sm)", fontWeight: 800, borderRadius: "var(--radius-md)" }}
               >
                 ¡COMENZAR MI TURNO!
               </button>
            </div>
          </div>
        </div>
      )}

      {/* ── ENCABEZADO SUPERIOR ── */}
      <header style={{ marginBottom: "var(--spacing-lg)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-sm)" }}>
           <ShieldCheck size={20} color="var(--primary)" />
           <span style={{ fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>Panel Especializado</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800 }}>Bienvenido, {userName}</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", 
          padding: "6px 14px", backgroundColor: "var(--secondary)", display: "inline-block", borderRadius: "20px", border: "1px solid var(--border)", fontWeight: 600
        }}>
          Rol Actual: <span style={{ color: "var(--primary)" }}>{currentData.title}</span>
        </p>
      </header>

      {/* Tip Info Verde Universal */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> Tu panel de inicio está diseñado exclusivamente para ti. Usa los Accesos Rápidos para saltar instantáneamente a tus tareas de hoy.
        </p>
      </div>

      {/* ── BLOQUE 1: ACCESOS RÁPIDOS (TOP) ── */}
      <h3 style={{ fontSize: "var(--font-base)", marginBottom: "var(--spacing-md)", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
        <Zap size={18} color="var(--primary)" /> Accesos Rápidos
      </h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "var(--spacing-xl)" }}>
        {currentData.shortcuts.map((shortcut: any, i: number) => {
          const Icon = shortcut.icon;
          return (
            <button 
              key={i}
              onClick={() => router.push(shortcut.path)}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "8px 12px", backgroundColor: "white", border: "1px solid var(--border)",
                borderRadius: "var(--radius-md)", cursor: "pointer", textAlign: "left",
                boxShadow: "0 1px 3px rgba(0,0,0,0.02)", transition: "all 0.2s",
                position: "relative", overflow: "hidden", minHeight: "52px"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.borderColor = shortcut.color; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 1px 3px rgba(0,0,0,0.02)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div style={{ width: "4px", backgroundColor: shortcut.color, position: "absolute", left: 0, top: 0, bottom: 0 }} />
              <div style={{ width: "32px", height: "32px", borderRadius: "6px", backgroundColor: shortcut.bg, color: shortcut.color, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginLeft: "4px" }}>
                <Icon size={18} />
              </div>
              <span style={{ fontSize: "var(--font-xs)", fontWeight: 800, color: "var(--text-main)", lineHeight: 1.2, flex: 1 }}>{shortcut.label}</span>
              <Pointer size={14} color="var(--text-muted)" style={{ opacity: 0.6 }} />
            </button>
          );
        })}
      </div>

      {/* ── BLOQUE 2: MENSAJES Y RECORDATORIOS ── */}
      <div className="card" style={{ padding: "var(--spacing-lg)", borderTop: "4px solid #374151" }}>
        <h3 style={{ fontSize: "var(--font-base)", marginBottom: "var(--spacing-lg)", fontWeight: 800, display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} color="#374151" /> Mensajes y Recordatorios Activos
        </h3>
        
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          {currentData.reminders.map((rem: any, i: number) => {
             const IconRem = rem.icon;
             return (
               <div key={rem.id} style={{ display: "flex", gap: "var(--spacing-md)", padding: "var(--spacing-md)", backgroundColor: "var(--secondary)", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", position: "relative" }}>
                 <div style={{ color: rem.color, marginTop: "2px" }}>
                   <IconRem size={20} />
                 </div>
                 <div style={{ flex: 1 }}>
                   <p style={{ margin: "0 0 4px 0", fontSize: "var(--font-sm)", fontWeight: 800, color: "var(--text-main)" }}>{rem.title}</p>
                   <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--text-muted)", lineHeight: 1.4 }}>{rem.desc}</p>
                 </div>
                 <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", position: "absolute", top: "12px", right: "12px", backgroundColor: "white", padding: "2px 8px", borderRadius: "10px", border: "1px solid var(--border)" }}>
                   {rem.time}
                 </div>
               </div>
             )
          })}
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          0% { transform: translateY(-30px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
