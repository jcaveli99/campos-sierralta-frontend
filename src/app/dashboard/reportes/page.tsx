"use client";

import { useState, useMemo } from "react";
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

// ── Data simulada de compras (multi-día, multi-proveedor) ──
const COMPRAS_SIMULADAS: CompraRegistro[] = [
  // ── 27 Marzo 2026 ──
  { id: "c01", fecha: "2026-03-27", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 50, unidad: "KG", costoUnitario: 2.50, total: 125.00 },
  { id: "c02", fecha: "2026-03-27", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 20, unidad: "KG", costoUnitario: 8.00, total: 160.00 },
  { id: "c03", fecha: "2026-03-27", producto: "Brócoli Bandeja x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 30, unidad: "Bandeja", costoUnitario: 3.50, total: 105.00 },
  { id: "c04", fecha: "2026-03-27", producto: "Tomate Especial", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 25, unidad: "KG", costoUnitario: 4.00, total: 100.00 },
  { id: "c05", fecha: "2026-03-27", producto: "Cebolla Roja Malla x 500g", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 40, unidad: "Malla", costoUnitario: 2.80, total: 112.00 },
  { id: "c06", fecha: "2026-03-27", producto: "Papaya Extra", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 15, unidad: "Unidad", costoUnitario: 6.50, total: 97.50 },
  // ── 26 Marzo 2026 ──
  { id: "c07", fecha: "2026-03-26", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 45, unidad: "KG", costoUnitario: 2.50, total: 112.50 },
  { id: "c08", fecha: "2026-03-26", producto: "Aguaymanto Taper x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 18, unidad: "Taper", costoUnitario: 5.00, total: 90.00 },
  { id: "c09", fecha: "2026-03-26", producto: "Piña Golden", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 12, unidad: "Unidad", costoUnitario: 7.00, total: 84.00 },
  { id: "c10", fecha: "2026-03-26", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 22, unidad: "KG", costoUnitario: 8.00, total: 176.00 },
  // ── 25 Marzo 2026 ──
  { id: "c11", fecha: "2026-03-25", producto: "Tomate Especial", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 30, unidad: "KG", costoUnitario: 3.80, total: 114.00 },
  { id: "c12", fecha: "2026-03-25", producto: "Cebolla Roja Malla x 500g", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 35, unidad: "Malla", costoUnitario: 2.80, total: 98.00 },
  { id: "c13", fecha: "2026-03-25", producto: "Brócoli Bandeja x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 28, unidad: "Bandeja", costoUnitario: 3.50, total: 98.00 },
  { id: "c14", fecha: "2026-03-25", producto: "Papaya Extra", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 10, unidad: "Unidad", costoUnitario: 6.50, total: 65.00 },
  // ── 24 Marzo 2026 ──
  { id: "c15", fecha: "2026-03-24", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 55, unidad: "KG", costoUnitario: 2.40, total: 132.00 },
  { id: "c16", fecha: "2026-03-24", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 18, unidad: "KG", costoUnitario: 8.50, total: 153.00 },
  { id: "c17", fecha: "2026-03-24", producto: "Piña Golden", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 10, unidad: "Unidad", costoUnitario: 7.00, total: 70.00 },
  { id: "c18", fecha: "2026-03-24", producto: "Aguaymanto Taper x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 15, unidad: "Taper", costoUnitario: 5.00, total: 75.00 },
  // ── 10 Marzo 2026 ──
  { id: "c19", fecha: "2026-03-10", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 60, unidad: "KG", costoUnitario: 2.50, total: 150.00 },
  { id: "c20", fecha: "2026-03-10", producto: "Tomate Especial", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 35, unidad: "KG", costoUnitario: 4.00, total: 140.00 },
  { id: "c21", fecha: "2026-03-10", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 25, unidad: "KG", costoUnitario: 7.50, total: 187.50 },
  // ── 01 Marzo 2026 ──
  { id: "c22", fecha: "2026-03-01", producto: "Cebolla Roja Malla x 500g", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 45, unidad: "Malla", costoUnitario: 2.80, total: 126.00 },
  { id: "c23", fecha: "2026-03-01", producto: "Brócoli Bandeja x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 32, unidad: "Bandeja", costoUnitario: 3.50, total: 112.00 },
  { id: "c24", fecha: "2026-03-01", producto: "Papaya Extra", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 14, unidad: "Unidad", costoUnitario: 6.00, total: 84.00 },
];

export default function ReporteGeneral() {
  const [fechaSeleccionada, setFechaSeleccionada] = useState("2026-03-27");
  const [searchTerm, setSearchTerm] = useState("");

  const comprasDelDia = useMemo(() => {
    return COMPRAS_SIMULADAS
      .filter((c) => c.fecha === fechaSeleccionada)
      .filter((c) => c.producto.toLowerCase().includes(searchTerm.toLowerCase()) || c.proveedor.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [fechaSeleccionada, searchTerm]);

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
            onChange={(e) => setFechaSeleccionada(e.target.value)}
            style={{ padding: "10px 16px", border: "2px solid var(--primary)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 700, color: "var(--foreground)", cursor: "pointer" }}
          />
        </div>
        <div style={{ position: "relative" }}>
          <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
            <Search size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
            Buscar
          </label>
          <input
            type="text"
            placeholder="Producto o proveedor..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px 16px", width: "260px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)" }}
          />
        </div>
        <div style={{ padding: "10px 20px", backgroundColor: "var(--primary)", color: "white", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" }}>
          {fechaFormateada}
        </div>
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
                  <th style={{ minWidth: "200px" }}>Producto</th>
                  <th style={{ minWidth: "200px" }}>Proveedor</th>
                  <th style={{ textAlign: "center", width: "100px" }}>Cantidad</th>
                  <th style={{ textAlign: "center", width: "90px" }}>Unidad</th>
                  <th style={{ textAlign: "center", width: "120px" }}>Costo Unit. (S/)</th>
                  <th style={{ textAlign: "center", width: "120px", backgroundColor: "rgba(255, 69, 0, 0.06)" }}>Total (S/)</th>
                </tr>
              </thead>
              <tbody>
                {comprasDelDia.map((compra, i) => (
                  <tr key={compra.id} style={{ transition: "background 0.15s" }}>
                    <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{compra.producto}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: compra.proveedorId === "prov1" ? "#f97316" : compra.proveedorId === "prov2" ? "#8b5cf6" : compra.proveedorId === "prov3" ? "#06b6d4" : "#10b981" }} />
                        <span style={{ fontSize: "var(--font-xs)" }}>{compra.proveedor}</span>
                      </div>
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700 }}>{compra.cantidad}</td>
                    <td style={{ textAlign: "center", fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{compra.unidad}</td>
                    <td style={{ textAlign: "center" }}>S/ {compra.costoUnitario.toFixed(2)}</td>
                    <td style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.04)" }}>
                      S/ {compra.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
                {/* Fila Total */}
                <tr style={{ backgroundColor: "#111", color: "white" }}>
                  <td colSpan={6} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                    TOTAL GENERAL DEL DÍA
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
            No se encontraron compras para la fecha seleccionada.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)", marginTop: "8px" }}>
            Intenta seleccionar otra fecha (27, 26, 25, 24, 10 o 01 de Marzo 2026)
          </p>
        </div>
      )}
    </div>
  );
}
