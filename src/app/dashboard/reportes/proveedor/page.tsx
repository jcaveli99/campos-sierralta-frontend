"use client";

import { useState, useMemo } from "react";
import {
  ClipboardList,
  Calendar,
  DollarSign,
  Package,
  Search as SearchIcon,
  Filter,
  TrendingUp,
  ChevronRight,
  FileSpreadsheet,
  Truck,
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

const PROVEEDORES = [
  { id: "prov1", nombre: "Proveedor Principal SAC" },
  { id: "prov2", nombre: "Mercado Central - Puesto 15" },
  { id: "prov3", nombre: "Agro Sur SRL" },
  { id: "prov4", nombre: "Distribuidora El Sol" },
];

const COMPRAS_SIMULADAS: CompraRegistro[] = [
  // 27 Marzo
  { id: "c01", fecha: "2026-03-27", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 50, unidad: "KG", costoUnitario: 2.50, total: 125.00 },
  { id: "c02", fecha: "2026-03-27", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 20, unidad: "KG", costoUnitario: 8.00, total: 160.00 },
  { id: "c03", fecha: "2026-03-27", producto: "Brócoli Bandeja x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 30, unidad: "Bandeja", costoUnitario: 3.50, total: 105.00 },
  { id: "c04", fecha: "2026-03-27", producto: "Tomate Especial", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 25, unidad: "KG", costoUnitario: 4.00, total: 100.00 },
  { id: "c05", fecha: "2026-03-27", producto: "Cebolla Roja Malla x 500g", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 40, unidad: "Malla", costoUnitario: 2.80, total: 112.00 },
  { id: "c06", fecha: "2026-03-27", producto: "Papaya Extra", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 15, unidad: "Unidad", costoUnitario: 6.50, total: 97.50 },
  // 26 Marzo
  { id: "c07", fecha: "2026-03-26", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 45, unidad: "KG", costoUnitario: 2.50, total: 112.50 },
  { id: "c08", fecha: "2026-03-26", producto: "Aguaymanto Taper x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 18, unidad: "Taper", costoUnitario: 5.00, total: 90.00 },
  { id: "c09", fecha: "2026-03-26", producto: "Piña Golden", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 12, unidad: "Unidad", costoUnitario: 7.00, total: 84.00 },
  { id: "c10", fecha: "2026-03-26", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 22, unidad: "KG", costoUnitario: 8.00, total: 176.00 },
  // 25 Marzo
  { id: "c11", fecha: "2026-03-25", producto: "Tomate Especial", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 30, unidad: "KG", costoUnitario: 3.80, total: 114.00 },
  { id: "c12", fecha: "2026-03-25", producto: "Cebolla Roja Malla x 500g", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 35, unidad: "Malla", costoUnitario: 2.80, total: 98.00 },
  { id: "c13", fecha: "2026-03-25", producto: "Brócoli Bandeja x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 28, unidad: "Bandeja", costoUnitario: 3.50, total: 98.00 },
  { id: "c14", fecha: "2026-03-25", producto: "Papaya Extra", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 10, unidad: "Unidad", costoUnitario: 6.50, total: 65.00 },
  // 24 Marzo
  { id: "c15", fecha: "2026-03-24", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 55, unidad: "KG", costoUnitario: 2.40, total: 132.00 },
  { id: "c16", fecha: "2026-03-24", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 18, unidad: "KG", costoUnitario: 8.50, total: 153.00 },
  { id: "c17", fecha: "2026-03-24", producto: "Piña Golden", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 10, unidad: "Unidad", costoUnitario: 7.00, total: 70.00 },
  { id: "c18", fecha: "2026-03-24", producto: "Aguaymanto Taper x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 15, unidad: "Taper", costoUnitario: 5.00, total: 75.00 },
  // 10 Marzo
  { id: "c19", fecha: "2026-03-10", producto: "Plátano Seda", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 60, unidad: "KG", costoUnitario: 2.50, total: 150.00 },
  { id: "c20", fecha: "2026-03-10", producto: "Tomate Especial", proveedor: "Distribuidora El Sol", proveedorId: "prov4", cantidad: 35, unidad: "KG", costoUnitario: 4.00, total: 140.00 },
  { id: "c21", fecha: "2026-03-10", producto: "Fresa Nacional", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 25, unidad: "KG", costoUnitario: 7.50, total: 187.50 },
  // 01 Marzo
  { id: "c22", fecha: "2026-03-01", producto: "Cebolla Roja Malla x 500g", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", cantidad: 45, unidad: "Malla", costoUnitario: 2.80, total: 126.00 },
  { id: "c23", fecha: "2026-03-01", producto: "Brócoli Bandeja x 250g", proveedor: "Agro Sur SRL", proveedorId: "prov3", cantidad: 32, unidad: "Bandeja", costoUnitario: 3.50, total: 112.00 },
  { id: "c24", fecha: "2026-03-01", producto: "Papaya Extra", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", cantidad: 14, unidad: "Unidad", costoUnitario: 6.00, total: 84.00 },
];

export default function ReporteProveedor() {
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState("2026-03-01");
  const [fechaFin, setFechaFin] = useState("2026-03-27");
  const [reporteGenerado, setReporteGenerado] = useState(false);

  const comprasFiltradas = useMemo(() => {
    if (!reporteGenerado || !proveedorSeleccionado) return [];
    return COMPRAS_SIMULADAS.filter(
      (c) =>
        c.proveedorId === proveedorSeleccionado &&
        c.fecha >= fechaInicio &&
        c.fecha <= fechaFin
    ).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [reporteGenerado, proveedorSeleccionado, fechaInicio, fechaFin]);

  const totalPeriodo = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
  const totalProductos = comprasFiltradas.length;
  const totalUnidades = comprasFiltradas.reduce((sum, c) => sum + c.cantidad, 0);
  const proveedorNombre = PROVEEDORES.find((p) => p.id === proveedorSeleccionado)?.nombre || "";

  // Agrupar por fecha para sub-totales
  const comprasPorFecha = useMemo(() => {
    const grouped: Record<string, CompraRegistro[]> = {};
    comprasFiltradas.forEach((c) => {
      if (!grouped[c.fecha]) grouped[c.fecha] = [];
      grouped[c.fecha].push(c);
    });
    return grouped;
  }, [comprasFiltradas]);

  const handleGenerar = () => {
    if (!proveedorSeleccionado) {
      alert("Selecciona un proveedor para generar el reporte.");
      return;
    }
    setReporteGenerado(true);
  };

  const provColor = proveedorSeleccionado === "prov1" ? "#f97316" : proveedorSeleccionado === "prov2" ? "#8b5cf6" : proveedorSeleccionado === "prov3" ? "#06b6d4" : proveedorSeleccionado === "prov4" ? "#10b981" : "var(--primary)";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      {/* HEADER */}
      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
          <ClipboardList size={14} /> REPORTES <ChevronRight size={10} /> <span style={{ color: "var(--foreground)" }}>POR PROVEEDOR</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Reporte por Proveedor</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
          Selecciona un proveedor y un rango de fechas para ver el detalle completo de todas las compras realizadas.
        </p>
      </header>

      {/* Tip Info Verde */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> Selecciona un proveedor y las fechas para analizar su historial. Útil para conciliar montos totales antes de programar pagos.
        </p>
      </div>

      {/* FILTROS */}
      <div className="card" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)", borderTop: "3px solid var(--primary)" }}>
        <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 800, margin: "0 0 var(--spacing-lg) 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="var(--primary)" />
          Configurar Reporte
        </h3>
        <div style={{ display: "flex", gap: "var(--spacing-lg)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 250px" }}>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
              <Truck size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Proveedor
            </label>
            <select
              value={proveedorSeleccionado}
              onChange={(e) => { setProveedorSeleccionado(e.target.value); setReporteGenerado(false); }}
              style={{ width: "100%", padding: "10px 16px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600, backgroundColor: "white" }}
            >
              <option value="">-- Seleccionar Proveedor --</option>
              {PROVEEDORES.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
              <Calendar size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Fecha Inicio
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => { setFechaInicio(e.target.value); setReporteGenerado(false); }}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
              <Calendar size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Fecha Fin
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => { setFechaFin(e.target.value); setReporteGenerado(false); }}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }}
            />
          </div>
          <button
            className="btn-primary"
            onClick={handleGenerar}
            style={{ padding: "10px 28px", fontWeight: 800, fontSize: "var(--font-sm)", height: "auto" }}
          >
            <SearchIcon size={14} style={{ marginRight: "6px" }} />
            GENERAR REPORTE
          </button>
        </div>
      </div>

      {/* RESULTADO DEL REPORTE */}
      {reporteGenerado && comprasFiltradas.length > 0 && (
        <>
          {/* Card resumen del proveedor */}
          <div className="compact-kpi-row">
            <div className="card" style={{ padding: "10px 16px", borderLeft: `4px solid ${provColor}`, background: "linear-gradient(135deg, #fff 80%, rgba(255,69,0,0.03))" }}>
              <p className="kpi-title" title="Proveedor" style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Proveedor</p>
              <p className="kpi-value" style={{ margin: 0, fontSize: "var(--font-sm)", fontWeight: 800, color: provColor }}>{proveedorNombre}</p>
            </div>
            <div className="card" style={{ padding: "10px 16px", borderLeft: "4px solid #4338ca" }}>
              <p className="kpi-title" title="Período" style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Período</p>
              <p className="kpi-value" style={{ margin: 0, fontSize: "var(--font-xs)", fontWeight: 800 }}>
                {new Date(fechaInicio + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" })} — {new Date(fechaFin + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" })}
              </p>
            </div>
            <div className="card" style={{ padding: "10px 16px", borderLeft: "4px solid var(--success)" }}>
              <p className="kpi-title" title="Total Comprado" style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Total Comprado</p>
              <p className="kpi-value" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--success)" }}>S/ {totalPeriodo.toFixed(2)}</p>
            </div>
            <div className="card" style={{ padding: "10px 16px", borderLeft: "4px solid var(--primary)" }}>
              <p className="kpi-title" title="Registros / Unidades" style={{ margin: "0 0 4px 0", fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>Registros/Unids</p>
              <p className="kpi-value" style={{ margin: 0, fontSize: "var(--font-xs)", fontWeight: 800 }}>{totalProductos} cmp / {totalUnidades} und.</p>
            </div>
          </div>

          {/* Tabla detallada agrupada por fecha */}
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: provColor, color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>
                <FileSpreadsheet size={16} style={{ marginRight: "8px", verticalAlign: "middle" }} />
                Detalle de Compras — {proveedorNombre}
              </h3>
              <span style={{ fontSize: "10px", fontWeight: 700, backgroundColor: "rgba(255,255,255,0.2)", padding: "4px 12px", borderRadius: "20px" }}>
                {totalProductos} registros
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
                    <th style={{ width: "120px" }}>Fecha</th>
                    <th style={{ minWidth: "200px" }}>Producto</th>
                    <th style={{ textAlign: "center", width: "100px" }}>Cantidad</th>
                    <th style={{ textAlign: "center", width: "90px" }}>Unidad</th>
                    <th style={{ textAlign: "center", width: "120px" }}>Costo Unit. (S/)</th>
                    <th style={{ textAlign: "center", width: "120px", backgroundColor: "rgba(255, 69, 0, 0.06)" }}>Total (S/)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comprasPorFecha).map(([fecha, compras]) => {
                    const subTotal = compras.reduce((s, c) => s + c.total, 0);
                    const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
                    return compras.map((compra, i) => (
                      <tr key={compra.id}>
                        <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>{i + 1}</td>
                        <td style={{ fontWeight: 600, fontSize: "var(--font-xs)" }}>
                          {i === 0 ? (
                            <span style={{ padding: "3px 8px", backgroundColor: "#eef2ff", borderRadius: "4px", border: "1px solid #c7d2fe", color: "#3730a3" }}>
                              {fechaLabel}
                            </span>
                          ) : ""}
                        </td>
                        <td style={{ fontWeight: 600 }}>{compra.producto}</td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>{compra.cantidad}</td>
                        <td style={{ textAlign: "center", fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{compra.unidad}</td>
                        <td style={{ textAlign: "center" }}>S/ {compra.costoUnitario.toFixed(2)}</td>
                        <td style={{ textAlign: "center", fontWeight: 700, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.04)" }}>
                          S/ {compra.total.toFixed(2)}
                        </td>
                      </tr>
                    )).concat(
                      <tr key={`sub-${fecha}`} style={{ backgroundColor: "#f8f9fa" }}>
                        <td colSpan={6} style={{ textAlign: "right", fontWeight: 700, fontSize: "11px", color: "var(--text-muted)", padding: "8px var(--spacing-lg)", borderLeft: `3px solid ${provColor}` }}>
                          Subtotal {fechaLabel}
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-sm)", color: provColor }}>
                          S/ {subTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  }).flat()}
                  {/* Fila TOTAL */}
                  <tr style={{ backgroundColor: "#111", color: "white" }}>
                    <td colSpan={6} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                      TOTAL DEL PERÍODO
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-lg)", border: "none", color: "#ff6b35" }}>
                      S/ {totalPeriodo.toFixed(2)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {reporteGenerado && comprasFiltradas.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
          <ClipboardList size={48} style={{ margin: "0 auto var(--spacing-md)", opacity: 0.1, display: "block" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
            No se encontraron compras para este proveedor en el rango de fechas seleccionado.
          </p>
        </div>
      )}

      {!reporteGenerado && (
        <div className="card" style={{ textAlign: "center", padding: "80px 20px", border: "2px dashed var(--border)" }}>
          <Truck size={48} style={{ margin: "0 auto var(--spacing-md)", opacity: 0.1, display: "block" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
            Selecciona un proveedor y rango de fechas, luego presiona <strong>&quot;Generar Reporte&quot;</strong>.
          </p>
        </div>
      )}
    </div>
  );
}
