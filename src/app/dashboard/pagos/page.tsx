"use client";

import { useState, useMemo } from "react";
import {
  Wallet,
  Calendar,
  DollarSign,
  CheckCircle2,
  Clock,
  ChevronRight,
  AlertCircle,
  TrendingUp,
  Filter,
  Truck,
  Hand,
  ArrowRight
} from "lucide-react";

interface PagoRegistro {
  id: string;
  fecha: string;
  proveedor: string;
  proveedorId: string;
  concepto: string;
  totalDia: number;
  montoPagado: number;
  estado: "PAGADO" | "PENDIENTE";
}

const PROVEEDORES = [
  { id: "all", nombre: "Todos los Proveedores" },
  { id: "prov1", nombre: "Proveedor Principal SAC" },
  { id: "prov2", nombre: "Mercado Central - Puesto 15" },
  { id: "prov3", nombre: "Agro Sur SRL" },
  { id: "prov4", nombre: "Distribuidora El Sol" },
];

export default function VistaPagos() {
  const [pagos, setPagos] = useState<PagoRegistro[]>([
    // Pagos de Marzo 2026
    { id: "pg01", fecha: "2026-03-27", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", concepto: "Compra diaria: Plátano Seda, Cebolla Roja", totalDia: 237.00, montoPagado: 237.00, estado: "PENDIENTE" },
    { id: "pg02", fecha: "2026-03-27", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", concepto: "Compra diaria: Fresa Nacional, Papaya Extra", totalDia: 257.50, montoPagado: 257.50, estado: "PENDIENTE" },
    { id: "pg03", fecha: "2026-03-27", proveedor: "Agro Sur SRL", proveedorId: "prov3", concepto: "Compra diaria: Brócoli Bandeja x 250g", totalDia: 105.00, montoPagado: 105.00, estado: "PENDIENTE" },
    { id: "pg04", fecha: "2026-03-27", proveedor: "Distribuidora El Sol", proveedorId: "prov4", concepto: "Compra diaria: Tomate Especial", totalDia: 100.00, montoPagado: 100.00, estado: "PENDIENTE" },
    { id: "pg05", fecha: "2026-03-26", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", concepto: "Compra diaria: Plátano Seda", totalDia: 112.50, montoPagado: 112.50, estado: "PAGADO" },
    { id: "pg06", fecha: "2026-03-26", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", concepto: "Compra diaria: Fresa Nacional", totalDia: 176.00, montoPagado: 176.00, estado: "PAGADO" },
    { id: "pg07", fecha: "2026-03-26", proveedor: "Agro Sur SRL", proveedorId: "prov3", concepto: "Compra diaria: Aguaymanto Taper x 250g", totalDia: 90.00, montoPagado: 90.00, estado: "PAGADO" },
    { id: "pg08", fecha: "2026-03-26", proveedor: "Distribuidora El Sol", proveedorId: "prov4", concepto: "Compra diaria: Piña Golden", totalDia: 84.00, montoPagado: 84.00, estado: "PAGADO" },
    { id: "pg09", fecha: "2026-03-25", proveedor: "Distribuidora El Sol", proveedorId: "prov4", concepto: "Compra diaria: Tomate Especial", totalDia: 114.00, montoPagado: 114.00, estado: "PAGADO" },
    { id: "pg10", fecha: "2026-03-25", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", concepto: "Compra diaria: Cebolla Roja Malla", totalDia: 98.00, montoPagado: 98.00, estado: "PENDIENTE" },
    { id: "pg11", fecha: "2026-03-25", proveedor: "Agro Sur SRL", proveedorId: "prov3", concepto: "Compra diaria: Brócoli Bandeja x 250g", totalDia: 98.00, montoPagado: 98.00, estado: "PAGADO" },
    { id: "pg12", fecha: "2026-03-25", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", concepto: "Compra diaria: Papaya Extra", totalDia: 65.00, montoPagado: 65.00, estado: "PENDIENTE" },
    { id: "pg13", fecha: "2026-03-24", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", concepto: "Compra diaria: Plátano Seda", totalDia: 132.00, montoPagado: 132.00, estado: "PAGADO" },
    { id: "pg14", fecha: "2026-03-24", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", concepto: "Compra diaria: Fresa Nacional", totalDia: 153.00, montoPagado: 153.00, estado: "PAGADO" },
    { id: "pg15", fecha: "2026-03-10", proveedor: "Proveedor Principal SAC", proveedorId: "prov1", concepto: "Compra diaria: Plátano Seda", totalDia: 150.00, montoPagado: 150.00, estado: "PAGADO" },
    { id: "pg16", fecha: "2026-03-10", proveedor: "Distribuidora El Sol", proveedorId: "prov4", concepto: "Compra diaria: Tomate Especial", totalDia: 140.00, montoPagado: 140.00, estado: "PAGADO" },
    { id: "pg17", fecha: "2026-03-01", proveedor: "Agro Sur SRL", proveedorId: "prov3", concepto: "Compra diaria: Brócoli Bandeja x 250g", totalDia: 112.00, montoPagado: 112.00, estado: "PAGADO" },
    { id: "pg18", fecha: "2026-03-01", proveedor: "Mercado Central - Puesto 15", proveedorId: "prov2", concepto: "Compra diaria: Papaya Extra", totalDia: 84.00, montoPagado: 84.00, estado: "PAGADO" },
  ]);

  const [proveedorFiltro, setProveedorFiltro] = useState("all");
  const [fechaInicio, setFechaInicio] = useState("2026-03-01");
  const [fechaFin, setFechaFin] = useState("2026-03-27");

  const pagosFiltrados = useMemo(() => {
    return pagos
      .filter((p) => proveedorFiltro === "all" || p.proveedorId === proveedorFiltro)
      .filter((p) => p.fecha >= fechaInicio && p.fecha <= fechaFin)
      .sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [pagos, proveedorFiltro, fechaInicio, fechaFin]);

  const totalPagado = pagosFiltrados.filter((p) => p.estado === "PAGADO").reduce((sum, p) => sum + p.montoPagado, 0);
  const totalPendiente = pagosFiltrados.filter((p) => p.estado === "PENDIENTE").reduce((sum, p) => sum + p.montoPagado, 0);
  const nProveedores = new Set(pagosFiltrados.map((p) => p.proveedorId)).size;
  const ultimoPago = pagosFiltrados.find((p) => p.estado === "PAGADO");

  const toggleEstado = (id: string) => {
    setPagos(pagos.map((p) => {
      if (p.id === id) {
        return { ...p, estado: p.estado === "PAGADO" ? "PENDIENTE" : "PAGADO" };
      }
      return p;
    }));
  };

  const provColor = (provId: string) => {
    switch (provId) {
      case "prov1": return "#f97316";
      case "prov2": return "#8b5cf6";
      case "prov3": return "#06b6d4";
      case "prov4": return "#10b981";
      default: return "var(--text-muted)";
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      {/* HEADER */}
      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
          <Wallet size={14} /> FINANZAS <ChevronRight size={10} /> <span style={{ color: "var(--foreground)" }}>CONTROL DE PAGOS</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Historial de Pagos a Proveedores</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
          Gestiona los pagos realizados a cada proveedor. Filtra por proveedor y fecha, y marca los pagos como cancelados.
        </p>
      </header>

      {/* Tip Info Verde */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> Haz clic en el estado de cada pago para alternar entre <strong>PAGADO</strong> y <strong>PENDIENTE</strong>. Los cambios se reflejan inmediatamente en los totales superiores.
        </p>
      </div>

      {/* KPIs */}
      <div className="compact-kpi-row">
        <div className="card" style={{ padding: "10px 16px", borderTop: "3px solid var(--success)", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: "-10px", right: "-10px", width: "50px", height: "50px", borderRadius: "50%", backgroundColor: "rgba(22,163,74,0.06)" }} />
          <div className="kpi-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div className="kpi-icon-container" style={{ width: "24px", height: "24px", backgroundColor: "rgba(22,163,74,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={14} color="var(--success)" />
            </div>
            <span className="kpi-title" title="Total Pagado" style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>Total Pagado</span>
          </div>
          <p className="kpi-value" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "var(--success)" }}>S/ {totalPagado.toFixed(2)}</p>
        </div>

        <div className="card" style={{ padding: "10px 16px", borderTop: "3px solid #f59e0b" }}>
          <div className="kpi-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div className="kpi-icon-container" style={{ width: "24px", height: "24px", backgroundColor: "rgba(245,158,11,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Clock size={14} color="#f59e0b" />
            </div>
            <span className="kpi-title" title="Total Pendiente" style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>Total Pendiente</span>
          </div>
          <p className="kpi-value" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#f59e0b" }}>S/ {totalPendiente.toFixed(2)}</p>
        </div>

        <div className="card" style={{ padding: "10px 16px", borderTop: "3px solid #4338ca" }}>
          <div className="kpi-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div className="kpi-icon-container" style={{ width: "24px", height: "24px", backgroundColor: "rgba(67,56,202,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Truck size={14} color="#4338ca" />
            </div>
            <span className="kpi-title" title="Proveedores" style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>Proveedores</span>
          </div>
          <p className="kpi-value" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#111" }}>{nProveedores}</p>
        </div>

        <div className="card" style={{ padding: "10px 16px", borderTop: "3px solid var(--primary)" }}>
          <div className="kpi-header" style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
            <div className="kpi-icon-container" style={{ width: "24px", height: "24px", backgroundColor: "rgba(255,69,0,0.1)", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={14} color="var(--primary)" />
            </div>
            <span className="kpi-title" title="Último Pago" style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>Último Pago</span>
          </div>
          <p className="kpi-value" style={{ margin: 0, fontSize: "1.15rem", fontWeight: 800, color: "#111" }}>
            {ultimoPago ? new Date(ultimoPago.fecha + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      {/* FILTROS */}
      <div className="card" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)", borderTop: "3px solid var(--primary)" }}>
        <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 800, margin: "0 0 var(--spacing-lg) 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={16} color="var(--primary)" />
          Filtrar Pagos
        </h3>
        <div style={{ display: "flex", gap: "var(--spacing-lg)", flexWrap: "wrap", alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 250px" }}>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
              <Truck size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Proveedor
            </label>
            <select
              value={proveedorFiltro}
              onChange={(e) => setProveedorFiltro(e.target.value)}
              style={{ width: "100%", padding: "10px 16px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600, backgroundColor: "white" }}
            >
              {PROVEEDORES.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
              <Calendar size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Desde
            </label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
              <Calendar size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
              Hasta
            </label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }}
            />
          </div>
        </div>
      </div>

      {/* TABLA DE PAGOS */}
      {pagosFiltrados.length > 0 ? (
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "var(--secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>
              <Wallet size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--primary)" }} />
              Historial de Pagos
            </h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--success)", backgroundColor: "rgba(22,163,74,0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                {pagosFiltrados.filter(p => p.estado === "PAGADO").length} pagados
              </span>
              <span style={{ fontSize: "10px", fontWeight: 700, color: "#f59e0b", backgroundColor: "rgba(245,158,11,0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                {pagosFiltrados.filter(p => p.estado === "PENDIENTE").length} pendientes
              </span>
            </div>
          </div>
          <div className="mobile-scroll-hint" style={{ marginTop: "8px" }}>
            <Hand size={14} /> <span>Desliza la tabla para ver más</span> <ArrowRight size={14} />
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="compact-table">
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th style={{ width: "40px", textAlign: "center" }}>#</th>
                  <th style={{ width: "110px" }}>Fecha</th>
                  <th style={{ minWidth: "200px" }}>Proveedor</th>
                  <th style={{ minWidth: "250px" }}>Concepto / Detalle</th>
                  <th style={{ textAlign: "center", width: "120px" }}>Total Día (S/)</th>
                  <th style={{ textAlign: "center", width: "130px", backgroundColor: "rgba(255, 69, 0, 0.06)" }}>Monto Pagado (S/)</th>
                  <th style={{ textAlign: "center", width: "150px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago, i) => {
                  const fechaLabel = new Date(pago.fecha + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
                  return (
                    <tr key={pago.id} style={{ transition: "background 0.15s", backgroundColor: pago.estado === "PAGADO" ? "rgba(22,163,74,0.02)" : "rgba(245,158,11,0.02)" }}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>{i + 1}</td>
                      <td style={{ fontWeight: 600, fontSize: "var(--font-xs)" }}>
                        <span style={{ padding: "3px 8px", backgroundColor: "#f3f4f6", borderRadius: "4px", border: "1px solid var(--border)" }}>
                          {fechaLabel}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: provColor(pago.proveedorId), flexShrink: 0 }} />
                          <span style={{ fontWeight: 700, fontSize: "var(--font-xs)" }}>{pago.proveedor}</span>
                        </div>
                      </td>
                      <td style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>{pago.concepto}</td>
                      <td style={{ textAlign: "center", fontWeight: 700 }}>S/ {pago.totalDia.toFixed(2)}</td>
                      <td style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.04)" }}>
                        S/ {pago.montoPagado.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          onClick={() => toggleEstado(pago.id)}
                          style={{
                            padding: "6px 16px",
                            borderRadius: "20px",
                            border: "none",
                            fontWeight: 800,
                            fontSize: "10px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            transition: "all 0.2s",
                            backgroundColor: pago.estado === "PAGADO" ? "rgba(22,163,74,0.12)" : "rgba(245,158,11,0.12)",
                            color: pago.estado === "PAGADO" ? "#16a34a" : "#d97706",
                          }}
                        >
                          {pago.estado === "PAGADO" ? (
                            <><CheckCircle2 size={12} /> PAGADO</>
                          ) : (
                            <><Clock size={12} /> PENDIENTE</>
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {/* Fila de totales */}
                <tr style={{ backgroundColor: "#111", color: "white" }}>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                    TOTALES
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-sm)", border: "none" }}>
                    S/ {pagosFiltrados.reduce((s, p) => s + p.totalDia, 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-lg)", border: "none", color: "#ff6b35" }}>
                    S/ {pagosFiltrados.reduce((s, p) => s + p.montoPagado, 0).toFixed(2)}
                  </td>
                  <td style={{ border: "none" }} />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: "center", padding: "80px 20px" }}>
          <Wallet size={48} style={{ margin: "0 auto var(--spacing-md)", opacity: 0.1, display: "block" }} />
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
            No se encontraron pagos para los filtros seleccionados.
          </p>
        </div>
      )}
    </div>
  );
}
