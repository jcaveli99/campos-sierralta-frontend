"use client";

import { useState, useMemo, useEffect } from "react";
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

const WORKERS = ['Daniel', 'Jesus', 'Alex', 'Yamilet', 'Victor', 'Abraham', 'Fabricio'];
const PROVEEDORES_MAP: Record<string, string> = {
  "prov1": "Proveedor Principal SAC",
  "prov2": "Mercado Central - Puesto 15",
  "prov3": "Agro Sur SRL",
  "prov4": "Distribuidora El Sol",
  "none": "Sin Proveedor"
};

const PROVEEDORES = Object.entries(PROVEEDORES_MAP)
  .filter(([id]) => id !== "none")
  .map(([id, nombre]) => ({ id, nombre }));

export default function ReporteProveedor() {
  const [proveedorSeleccionado, setProveedorSeleccionado] = useState("");
  const [fechaInicio, setFechaInicio] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [fechaFin, setFechaFin] = useState(new Date().toISOString().split("T")[0]);
  const [reporteGenerado, setReporteGenerado] = useState(false);
  const [comprasReales, setComprasReales] = useState<CompraRegistro[]>([]);

  // Función para agrupar compras desde el Backend
  const fetchSupplierData = async () => {
    if (!proveedorSeleccionado || !reporteGenerado) return;
    const aggregated: CompraRegistro[] = [];

    const start = new Date(fechaInicio + "T12:00:00");
    const end = new Date(fechaFin + "T12:00:00");
    const dates: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d).toISOString().split("T")[0]);
    }

    const targetProvName = PROVEEDORES_MAP[proveedorSeleccionado];

    try {
      const results = await Promise.all(
        dates.map(fecha => fetch(`https://backent-sierralta.onrender.com/compras?fecha=${fecha}`).then(res => res.json()))
      );

      results.forEach((serverData, idx) => {
        const fecha = dates[idx];
        serverData.forEach((item: any) => {
          const itemProvName = item.proveedor?.nombre || item.proveedor_nombre || "Sin Proveedor";
          const itemProvId = item.proveedor_id?.toLowerCase() || "";
          if (Number(item.cantidad_comprada) > 0 && (itemProvId === proveedorSeleccionado || itemProvName === targetProvName)) {
            aggregated.push({
              id: item.id,
              fecha,
              producto: item.producto?.nombre || "DESCONOCIDO",
              proveedor: itemProvName,
              proveedorId: proveedorSeleccionado,
              cantidad: Number(item.cantidad_comprada) || 0,
              unidad: item.unidad_compra || "KG",
              costoUnitario: Number(item.costo_unitario) || 0,
              total: Number(item.monto_total) || 0
            });
          }
        });
      });

      setComprasReales(aggregated);
    } catch (error) {
      console.error("Error fetching supplier report data:", error);
    }
  };

  // Sincronización inicial
  useEffect(() => {
    const initSync = async () => {
      try {
        const res = await fetch('/api/sync');
        const serverData = await res.json();
        if (serverData) {
          Object.entries(serverData).forEach(([key, val]) => {
            localStorage.setItem(key, typeof val === 'string' ? val : JSON.stringify(val));
          });
          if (reporteGenerado) fetchSupplierData();
        }
      } catch (e) {}
    };
    initSync();
  }, []);

  // Recargar datos cuando cambien filtros o se genere el reporte
  useEffect(() => {
    if (reporteGenerado) {
      fetchSupplierData();
    }
  }, [reporteGenerado, proveedorSeleccionado, fechaInicio, fechaFin]);

  const handleGenerar = () => {
    if (!proveedorSeleccionado) {
      alert("Selecciona un proveedor para generar el reporte.");
      return;
    }
    setReporteGenerado(true);
  };

  const handleDownloadPDF = () => {
    window.print();
  };

  const comprasFiltradas = useMemo(() => {
    return [...comprasReales].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [comprasReales]);

  const totalPeriodo = comprasFiltradas.reduce((sum, c) => sum + c.total, 0);
  const totalProductos = comprasFiltradas.length;
  const totalUnidades = comprasFiltradas.reduce((sum, c) => sum + c.cantidad, 0);
  const proveedorNombre = PROVEEDORES.find((p) => p.id === proveedorSeleccionado)?.nombre || "";

  const comprasPorFecha = useMemo(() => {
    const grouped: Record<string, CompraRegistro[]> = {};
    comprasFiltradas.forEach((c) => {
      if (!grouped[c.fecha]) grouped[c.fecha] = [];
      grouped[c.fecha].push(c);
    });
    return grouped;
  }, [comprasFiltradas]);

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
          <div style={{ display: "flex", gap: "12px" }}>
            <button
              className="btn-primary"
              onClick={handleGenerar}
              style={{ padding: "10px 28px", fontWeight: 800, fontSize: "var(--font-sm)", height: "auto" }}
            >
              <SearchIcon size={14} style={{ marginRight: "6px" }} />
              GENERAR REPORTE
            </button>
            {reporteGenerado && comprasFiltradas.length > 0 && (
              <button
                onClick={handleDownloadPDF}
                style={{ padding: "10px 20px", backgroundColor: "#dc2626", color: "white", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 800, cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <TrendingUp size={14} /> EXPORTAR PDF
              </button>
            )}
          </div>
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
                    <th style={{ width: "150px" }}>Fecha de Compra</th>
                    <th style={{ textAlign: "center", width: "120px" }}>Cant. Variedades</th>
                    <th style={{ minWidth: "300px" }}>Detalle de Productos / Precios Unitarios</th>
                    <th style={{ textAlign: "center", width: "140px", backgroundColor: "rgba(255, 69, 0, 0.06)" }}>Total del Día (S/)</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(comprasPorFecha).sort((a, b) => b[0].localeCompare(a[0])).map(([fecha, compras], idx) => {
                    const subTotal = compras.reduce((s, c) => s + c.total, 0);
                    const fechaLabel = new Date(fecha + "T12:00:00").toLocaleDateString("es-PE", { weekday: "long", day: "2-digit", month: "long", year: "numeric" });
                    return (
                      <tr key={fecha} style={{ transition: "background 0.15s" }}>
                        <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>{idx + 1}</td>
                        <td style={{ fontWeight: 800, color: "#111", textTransform: "capitalize" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                            <Calendar size={12} color={provColor} />
                            {fechaLabel}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 700 }}>
                          <span style={{ backgroundColor: "var(--secondary)", padding: "4px 10px", borderRadius: "12px", fontSize: "10px" }}>
                            {compras.length} Items
                          </span>
                        </td>
                        <td style={{ fontSize: "11px", color: "#444" }}>
                          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            {compras.map((it, iIdx) => (
                              <div key={iIdx} style={{ display: "flex", justifyContent: "space-between", borderBottom: iIdx < compras.length - 1 ? "1px dashed #eee" : "none", padding: "2px 0" }}>
                                <span>• {it.producto} ({it.cantidad} {it.unidad})</span>
                                <span style={{ fontWeight: 600 }}>S/ {it.costoUnitario.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.04)", fontSize: "14px" }}>
                          S/ {subTotal.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Fila TOTAL */}
                  <tr style={{ backgroundColor: "#111", color: "white" }}>
                    <td colSpan={4} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                      TOTAL ACUMULADO DEL PERÍODO ({proveedorNombre})
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
