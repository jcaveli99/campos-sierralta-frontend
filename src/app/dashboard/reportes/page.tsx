"use client";

import { useState, useMemo, useEffect } from "react";
import {
  BarChart3,
  Calendar,
  DollarSign,
  Package,
  Users,
  TrendingUp,
  Search,
  FileSpreadsheet,
  AlertCircle,
  Hand,
  ArrowRight
} from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backent-sierralta.onrender.com';

interface CompraRegistro {
  id: string;
  fecha: string;
  producto: string;
  proveedor: string;
  proveedorId: string;
  cantidad: number;
  unidad: string;
  costoUnitario: number;
  total: number;
}

const WORKERS = ['Daniel', 'Jesus', 'Alex', 'Yamilet', 'Victor', 'Abraham', 'Fabricio'];
const PROVEEDORES_MAP: Record<string, string> = {
  "prov1": "Proveedor Principal SAC",
  "prov2": "Mercado Central - Puesto 15",
  "prov3": "Agro Sur SRL",
  "prov4": "Distribuidora El Sol",
  "none": "Sin Proveedor"
};

export default function ReporteGeneral() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState(new Date().toISOString().split("T")[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const [comprasReales, setComprasReales] = useState<CompraRegistro[]>([]);

  // Función para agrupar compras de todos los trabajadores desde el Backend
  const fetchAllWorkerPurchases = async () => {
    try {
      const res = await fetch(`${API_URL}/compras?fecha=${fechaSeleccionada}`);
      const serverData = await res.json();
      console.log("Server data received for date", fechaSeleccionada, ":", serverData);
      
      const aggregated: CompraRegistro[] = serverData.map((item: any) => ({
        id: item.id,
        fecha: item.fecha,
        producto: item.producto?.nombre || "DESCONOCIDO",
        proveedor: PROVEEDORES_MAP[item.proveedor_id?.toLowerCase() || ""] || item.proveedor?.nombre || "Sin Proveedor",
        proveedorId: item.proveedor_id || "none",
        cantidad: Number(item.cantidad_comprada) || 0,
        unidad: item.unidad_compra || "KG",
        costoUnitario: Number(item.costo_unitario) || 0,
        total: Number(item.monto_total) || 0
      })).filter((c: CompraRegistro) => c.cantidad > 0);
      
      console.log("Aggregated data:", aggregated);
      setComprasReales(aggregated);
    } catch (error) {
      console.error("Error fetching report data:", error);
    }
  };

  // Sincronización con el servidor al cargar
  useEffect(() => {
    const initSync = async () => {
      try {
        const res = await fetch('/api/sync');
        const serverData = await res.json();
        if (serverData && Object.keys(serverData).length > 0) {
           for (const key of Object.keys(serverData)) {
              localStorage.setItem(key, typeof serverData[key] === 'string' ? serverData[key] : JSON.stringify(serverData[key]));
           }
           fetchAllWorkerPurchases();
        }
      } catch(e) {}
    };
    initSync();
  }, []);

  // Efecto para cargar datos cada vez que cambie la fecha
  useEffect(() => {
    fetchAllWorkerPurchases();
  }, [fechaSeleccionada]);

  // Polling para simular tiempo real
  useEffect(() => {
    const interval = setInterval(fetchAllWorkerPurchases, 5000);
    return () => clearInterval(interval);
  }, [fechaSeleccionada]);

  const comprasDelDia = useMemo(() => {
    return comprasReales
      .filter((c) => c.producto.toLowerCase().includes(searchTerm.toLowerCase()) || c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [comprasReales, searchTerm]);

  const resumenPorProveedor = useMemo(() => {
    const summary: Record<string, { nombre: string, total: number, items: any[] }> = {};
    comprasDelDia.forEach(c => {
      if (!summary[c.proveedor]) {
        summary[c.proveedor] = { nombre: c.proveedor, total: 0, items: [] };
      }
      summary[c.proveedor].total += c.total;
      summary[c.proveedor].items.push(c);
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [comprasDelDia]);

  const totalGastado = comprasDelDia.reduce((sum, c) => sum + c.total, 0);
  const proveedoresUnicos = new Set(comprasDelDia.map((c) => c.proveedorId)).size;
  const productosUnicos = comprasDelDia.length;
  const promedioProducto = productosUnicos > 0 ? totalGastado / productosUnicos : 0;

  const fechaFormateada = new Date(fechaSeleccionada + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      {/* HEADER */}
      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
          <BarChart3 size={14} /> REPORTES <span style={{ color: "var(--foreground)" }}>› VISTA GENERAL POR FECHA</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Reporte General de Compras</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
          Visualiza todas las compras realizadas en una fecha específica, de todos los proveedores.
        </p>
      </header>

      {/* Tip Info Verde */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> Usa el filtro de fecha arriba para consultar rápidamente cuánto dinero se gastó y qué productos entraron al almacén en un día específico.
        </p>
      </div>

      {/* FILTROS */}
      <div style={{ display: "flex", gap: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)", flexWrap: "wrap", alignItems: "flex-end" }}>
        <div>
          <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
            <Calendar size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
            Seleccionar Fecha
          </label>
          <input
            type="date"
            value={fechaSeleccionada}
            onChange={(e) => {
              setFechaSeleccionada(e.target.value);
              // Forzar actualización inmediata al cambiar fecha
              setTimeout(fetchAllWorkerPurchases, 0);
            }}
            style={{ padding: "10px 16px", border: "2px solid var(--primary)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 700, color: "var(--foreground)", cursor: "pointer" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
            <Search size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
            Buscar
          </label>
          <select
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px 16px", width: "260px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", backgroundColor: "white", color: "#333", fontWeight: 600 }}
          >
            <option value="">-- Seleccionar Proveedor --</option>
            {Object.values(PROVEEDORES_MAP).filter(v => v !== "Sin Proveedor").map((provName) => (
              <option key={provName} value={provName}>{provName}</option>
            ))}
          </select>
        </div>
        <div style={{ padding: "10px 20px", backgroundColor: "#f8fafc", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", color: "var(--text-muted)" }}>
          {fechaFormateada}
        </div>
        <button
          onClick={fetchAllWorkerPurchases}
          style={{ padding: "10px 20px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <BarChart3 size={14} /> GENERAR REPORTE GENERAL
        </button>
      </div>

      {/* KPIs */}
      <div className="compact-kpi-row">
        {[
          { title: "Total Gastado", value: `S/ ${totalGastado.toFixed(2)}`, icon: DollarSign, color: "var(--primary)", bg: "rgba(255, 69, 0, 0.08)" },
          { title: "Proveedores", value: proveedoresUnicos.toString(), icon: Users, color: "#4338ca", bg: "rgba(67, 56, 202, 0.08)" },
          { title: "Productos Comprados", value: productosUnicos.toString(), icon: Package, color: "var(--success)", bg: "rgba(22, 163, 74, 0.08)" },
          { title: "Promedio x Producto", value: `S/ ${promedioProducto.toFixed(2)}`, icon: TrendingUp, color: "#b45309", bg: "rgba(180, 83, 9, 0.08)" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="card" style={{ padding: "10px 16px", borderTop: `3px solid ${kpi.color}` }}>
              <div className="kpi-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <div className="kpi-icon-container" style={{ width: "24px", height: "24px", backgroundColor: kpi.bg, borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={14} color={kpi.color} />
                </div>
                <span className="kpi-title" title={kpi.title} style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>{kpi.title}</span>
              </div>
              <p className="kpi-value" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#111" }}>{kpi.value}</p>
            </div>
          );
        })}
      </div>

      {/* RESUMEN POR PROVEEDOR */}
      {resumenPorProveedor.length > 0 && (
        <div style={{ marginBottom: "var(--spacing-xl)" }}>
          <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 800, marginBottom: "var(--spacing-md)", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Resumen por Proveedor
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {resumenPorProveedor.map((p, i) => (
              <div key={i} className="card" style={{ padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", borderLeft: "4px solid var(--primary)" }}>
                <div>
                  <div style={{ fontSize: "var(--font-xs)", fontWeight: 800, color: "var(--text-main)", marginBottom: "4px" }}>{p.nombre}</div>
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>{p.items.length} productos comprados</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "var(--font-sm)", fontWeight: 800, color: "var(--primary)" }}>S/ {p.total.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TABLA DE COMPRAS */}
      {comprasDelDia.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "var(--secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>
              <FileSpreadsheet size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--primary)" }} />
              Detalle de Compras del Día
            </h3>
            <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", backgroundColor: "white", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border)" }}>
              {comprasDelDia.length} registros
            </span>
          </div>
          <div className="mobile-scroll-hint" style={{ marginTop: "8px" }}>
            <Hand size={14} /> <span>Desliza la tabla para ver más</span> <ArrowRight size={14} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="compact-table">
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ width: "40px", textAlign: "center" }}>#</th>
                  <th style={{ textAlign: "center", width: "120px" }}>Cant. Prod.</th>
                  <th style={{ minWidth: "220px" }}>Nombre del Proveedor</th>
                  <th style={{ minWidth: "300px" }}>Detalle de Productos / Precios</th>
                  <th style={{ textAlign: "center", width: "140px", backgroundColor: "rgba(255, 69, 0, 0.06)" }}>Total Proveedor (S/)</th>
                </tr>
              </thead>
              <tbody>
                {resumenPorProveedor.map((prov, i) => (
                  <tr key={i} style={{ transition: "background 0.15s" }}>
                    <td data-label="#" style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>{i + 1}</td>
                    <td data-label="Cant. Prod." style={{ textAlign: "center", fontWeight: 700 }}>
                      <span style={{ backgroundColor: "var(--secondary)", padding: "4px 10px", borderRadius: "12px", fontSize: "11px" }}>
                        {prov.items.length} Variedades
                      </span>
                    </td>
                    <td data-label="Nombre del Proveedor" style={{ fontWeight: 800, color: "#111" }}>{prov.nombre}</td>
                    <td data-label="Detalle de Productos / Precios" style={{ fontSize: "11px", color: "#444" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {prov.items.map((it, idx) => (
                          <div key={idx} style={{ display: "flex", justifyContent: "space-between", borderBottom: idx < prov.items.length - 1 ? "1px dashed #eee" : "none", padding: "2px 0" }}>
                            <span>• {it.producto} ({it.cantidad} {it.unidad})</span>
                            <span style={{ fontWeight: 600 }}>S/ {it.costoUnitario.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td data-label="Total Proveedor (S/)" style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.04)", fontSize: "15px" }}>
                      S/ {prov.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Fila Total General */}
                <tr style={{ backgroundColor: "#111", color: "white" }}>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                    TOTAL GENERAL DEL DÍA (TODOS LOS PROVEEDORES)
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-lg)", border: "none", color: "#ff6b35" }}>
                    S/ {totalGastado.toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
          <BarChart3 size={48} style={{ margin: "0 auto var(--spacing-md)", opacity: 0.1, display: "block" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
            No se encontraron compras registradas por los trabajadores para esta fecha.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)", marginTop: "8px" }}>
            Asegúrate de que el personal de mercado haya completado y guardado sus registros.
          </p>
        </div>
      )}
    </div>
  );
}
