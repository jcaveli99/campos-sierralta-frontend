"use client";

import { useState, useMemo, useEffect } from "react";
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
  ArrowRight,
  CreditCard,
  Search
} from "lucide-react";

interface PagoRegistro {
  id: string;
  fechaRegistro: string;
  fechaInicio: string;
  fechaFin: string;
  proveedor: string;
  proveedorId: string;
  total: number;
  estado: "PAGADO" | "PENDIENTE";
  metodoPago?: string | null;
  conceptos?: number;
}

const PROVEEDORES = [
  { id: "all", nombre: "Todos los Proveedores" },
  { id: "prov1", nombre: "Proveedor Principal SAC" },
  { id: "prov2", nombre: "Mercado Central - Puesto 15" },
  { id: "prov3", nombre: "Agro Sur SRL" },
  { id: "prov4", nombre: "Distribuidora El Sol" },
];

export default function VistaPagos() {
  const [pagos, setPagos] = useState<PagoRegistro[]>([]);
  const [proveedorFiltro, setProveedorFiltro] = useState("all");
  const [fechaInicioFiltro, setFechaInicioFiltro] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [fechaFinFiltro, setFechaFinFiltro] = useState(new Date().toISOString().split("T")[0]);

  // Estados para Registro/Consulta de Pago
  const [provConsulta, setProvConsulta] = useState("prov1");
  const [fechaInicioConsulta, setFechaInicioConsulta] = useState(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]);
  const [fechaFinConsulta, setFechaFinConsulta] = useState(new Date().toISOString().split("T")[0]);
  const [consultaActiva, setConsultaActiva] = useState(false);
  const [datosConsulta, setDatosConsulta] = useState<{ total: number, conceptos: number, isPaid: boolean, metodoPago: string, detalles: any[] }>({ total: 0, conceptos: 0, isPaid: false, metodoPago: "", detalles: [] });
  const [estadoPagoNuevo, setEstadoPagoNuevo] = useState<"PENDIENTE"|"PAGADO">("PENDIENTE");
  const [metodoPagoNuevo, setMetodoPagoNuevo] = useState<string>("");

  const loadDatos = () => {
    const savedPagos = localStorage.getItem('pagos_historial');
    const pagosHistorial: PagoRegistro[] = savedPagos ? JSON.parse(savedPagos) : [];
    
    // Solo cargamos los pagos confirmados (PAGADOS) en la vista principal
    setPagos(pagosHistorial.filter(p => p.estado === "PAGADO"));
  };

  useEffect(() => {
    loadDatos();
  }, []);

  const pagosFiltrados = useMemo(() => {
    return pagos
      .filter((p) => proveedorFiltro === "all" || p.proveedorId === proveedorFiltro)
      .filter((p) => p.fechaRegistro >= fechaInicioFiltro && p.fechaRegistro <= fechaFinFiltro)
      .sort((a, b) => b.fechaRegistro.localeCompare(a.fechaRegistro));
  }, [pagos, proveedorFiltro, fechaInicioFiltro, fechaFinFiltro]);

  const totalPagado = pagosFiltrados.reduce((sum, p) => sum + p.total, 0);
  const nProveedores = new Set(pagosFiltrados.map((p) => p.proveedorId)).size;
  const ultimoPago = pagosFiltrados[0];

  const handleConsultar = () => {
    let total = 0;
    let conceptos = 0;
    const detalles: any[] = [];
    
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('orden_compra_actual_')) {
        try {
          const data = JSON.parse(localStorage.getItem(key) || '[]');
          const fechaStr = key.split('_')[3]; 
          if (!fechaStr) continue;
          
          if (fechaStr >= fechaInicioConsulta && fechaStr <= fechaFinConsulta) {
            data.forEach((item: any) => {
              if (item.proveedor === provConsulta && item.montoTotal) {
                 total += item.montoTotal;
                 conceptos += 1;
                 const dateGroup = detalles.find(d => d.fecha === fechaStr);
                 if (dateGroup) {
                   dateGroup.productos.push({
                     nombre: item.nombre,
                     cantidad: item.cantidadComprada,
                     unidad: item.unidadCompra || "KG",
                     precioUnitario: item.costoUnitario,
                     subtotal: item.montoTotal
                   });
                   dateGroup.totalDia += item.montoTotal;
                 } else {
                   detalles.push({
                     fecha: fechaStr,
                     productos: [{
                       nombre: item.nombre,
                       cantidad: item.cantidadComprada,
                       unidad: item.unidadCompra || "KG",
                       precioUnitario: item.costoUnitario,
                       subtotal: item.montoTotal
                     }],
                     totalDia: item.montoTotal
                   });
                 }
              }
            });
          }
        } catch(e) {}
      }
    }

    // Ordenar detalles por fecha descendente
    detalles.sort((a, b) => b.fecha.localeCompare(a.fecha));

    const savedPagos = localStorage.getItem('pagos_historial');
    const pagosHistorial: PagoRegistro[] = savedPagos ? JSON.parse(savedPagos) : [];
    
    const pagoExistente = pagosHistorial.find(p => 
      p.proveedorId === provConsulta && 
      p.fechaInicio <= fechaInicioConsulta && 
      p.fechaFin >= fechaFinConsulta &&
      p.estado === "PAGADO"
    );

    setDatosConsulta({
       total,
       conceptos,
       isPaid: !!pagoExistente,
       metodoPago: pagoExistente?.metodoPago || "",
       detalles
    });
    
    if (pagoExistente) {
       setEstadoPagoNuevo("PAGADO");
    } else {
       setEstadoPagoNuevo("PENDIENTE");
       setMetodoPagoNuevo("");
    }
    
    setConsultaActiva(true);
  };

  const handleRegistrarPago = () => {
    if (estadoPagoNuevo === "PAGADO" && !metodoPagoNuevo) {
      alert("Por favor, selecciona un método de pago.");
      return;
    }

    const provName = PROVEEDORES.find(p => p.id === provConsulta)?.nombre || "";

    const nuevoPago = {
      id: `pago_${Date.now()}`,
      fechaRegistro: new Date().toISOString().split("T")[0],
      fechaInicio: fechaInicioConsulta,
      fechaFin: fechaFinConsulta,
      proveedor: provName,
      proveedorId: provConsulta,
      total: datosConsulta.total,
      estado: estadoPagoNuevo,
      metodoPago: estadoPagoNuevo === "PAGADO" ? metodoPagoNuevo : null,
      conceptos: datosConsulta.conceptos
    };

    const savedPagos = localStorage.getItem('pagos_historial');
    const pagosHistorial = savedPagos ? JSON.parse(savedPagos) : [];
    pagosHistorial.push(nuevoPago);
    localStorage.setItem('pagos_historial', JSON.stringify(pagosHistorial));

    setDatosConsulta({ ...datosConsulta, isPaid: estadoPagoNuevo === "PAGADO", metodoPago: metodoPagoNuevo });
    loadDatos();
  };

  const toggleEstado = (pago: PagoRegistro) => {
    if (pago.estado === "PAGADO") {
       const confirm = window.confirm("¿Desea anular este pago y volver a dejar las compras como PENDIENTES?");
       if (confirm) {
          const saved = JSON.parse(localStorage.getItem('pagos_historial') || '[]');
          const filtered = saved.filter((p: any) => p.id !== pago.id);
          localStorage.setItem('pagos_historial', JSON.stringify(filtered));
          loadDatos();
       }
    } else {
       const metodo = window.prompt("Ingrese el método de pago (Ej. Efectivo, Yape, Plin, Transferencia):", "Efectivo");
       if (metodo === null) return;
       
       const nuevoPago = {
          id: `pago_${Date.now()}`,
          fechaRegistro: new Date().toISOString().split("T")[0],
          fechaInicio: pago.fechaInicio,
          fechaFin: pago.fechaFin,
          proveedor: pago.proveedor,
          proveedorId: pago.proveedorId,
          total: pago.total,
          estado: "PAGADO",
          metodoPago: metodo,
          conceptos: pago.conceptos
       };
       
       const saved = JSON.parse(localStorage.getItem('pagos_historial') || '[]');
       saved.push(nuevoPago);
       localStorage.setItem('pagos_historial', JSON.stringify(saved));
       loadDatos();
    }
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
            {ultimoPago ? new Date(ultimoPago.fechaRegistro + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
          </p>
        </div>
      </div>

      {/* PANEL DE CONSULTA Y PAGO */}
      <div className="card" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-xl)", borderTop: "3px solid var(--success)", backgroundColor: "#fdfdfd" }}>
        <h3 style={{ fontSize: "var(--font-sm)", fontWeight: 800, margin: "0 0 var(--spacing-lg) 0", display: "flex", alignItems: "center", gap: "8px" }}>
          <Search size={16} color="var(--success)" />
          Consultar Deuda y Registrar Pago
        </h3>
        <div style={{ display: "flex", gap: "var(--spacing-lg)", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "var(--spacing-lg)" }}>
          <div style={{ flex: "1 1 250px" }}>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>Proveedor</label>
            <select
              value={provConsulta}
              onChange={(e) => { setProvConsulta(e.target.value); setConsultaActiva(false); }}
              style={{ width: "100%", padding: "10px 16px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600, backgroundColor: "white" }}
            >
              {PROVEEDORES.filter(p => p.id !== "all").map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>Desde</label>
            <input
              type="date"
              value={fechaInicioConsulta}
              onChange={(e) => { setFechaInicioConsulta(e.target.value); setConsultaActiva(false); }}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }}
            />
          </div>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>Hasta</label>
            <input
              type="date"
              value={fechaFinConsulta}
              onChange={(e) => { setFechaFinConsulta(e.target.value); setConsultaActiva(false); }}
              style={{ padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }}
            />
          </div>
          <button
            onClick={handleConsultar}
            style={{ padding: "10px 24px", backgroundColor: "var(--success)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: 800, cursor: "pointer", height: "42px" }}
          >
            CONSULTAR
          </button>
        </div>

        {consultaActiva && (
          <div style={{ padding: "var(--spacing-md)", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)" }}>
            {datosConsulta.total === 0 ? (
              <p style={{ margin: 0, textAlign: "center", color: "var(--text-muted)", fontWeight: 600 }}>
                No se encontraron compras registradas para este proveedor en las fechas seleccionadas.
              </p>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)", paddingBottom: "var(--spacing-sm)", borderBottom: "1px dashed var(--border)" }}>
                  <div>
                    <h4 style={{ margin: "0 0 4px 0", fontSize: "var(--font-sm)", color: "var(--text-muted)", fontWeight: 700 }}>REPORTE DETALLADO</h4>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: "0 0 4px 0", fontSize: "var(--font-xs)", color: "var(--text-muted)", fontWeight: 700 }}>REGISTROS</p>
                    <p style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>{datosConsulta.conceptos} items</p>
                  </div>
                </div>

                {/* TABLA DE REPORTE DETALLADO */}
                <div style={{ overflowX: "auto", marginBottom: "var(--spacing-xl)" }}>
                  <table className="compact-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8f9fa", borderBottom: "2px solid var(--border)" }}>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "var(--font-xs)" }}>FECHA</th>
                        <th style={{ padding: "10px", textAlign: "left", fontSize: "var(--font-xs)" }}>PRODUCTO</th>
                        <th style={{ padding: "10px", textAlign: "center", fontSize: "var(--font-xs)" }}>CANTIDAD</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "var(--font-xs)" }}>PRECIO UNIT.</th>
                        <th style={{ padding: "10px", textAlign: "right", fontSize: "var(--font-xs)", backgroundColor: "rgba(255, 69, 0, 0.05)" }}>TOTAL (S/)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {datosConsulta.detalles.map((dia, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                          <td style={{ padding: "10px", fontSize: "var(--font-sm)", verticalAlign: "top" }}>
                            <div style={{ padding: "4px 0" }}>{new Date(dia.fecha + "T12:00:00").toLocaleDateString("es-PE")}</div>
                          </td>
                          <td style={{ padding: "10px", fontWeight: 600, fontSize: "11px", verticalAlign: "top" }}>
                            {(dia.productos || []).map((p: any, idx: number) => (
                              <div key={idx} style={{ padding: "2px 0", borderBottom: idx < (dia.productos?.length || 0) - 1 ? "1px solid rgba(0,0,0,0.05)" : "none", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "200px" }}>
                                {p.nombre}
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: "10px", textAlign: "center", fontSize: "11px", verticalAlign: "top", color: "var(--text-muted)", fontWeight: 700 }}>
                            {(dia.productos || []).map((p: any, idx: number) => (
                              <div key={idx} style={{ padding: "2px 0", borderBottom: idx < (dia.productos?.length || 0) - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                                {p.cantidad} {p.unidad}
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: "10px", textAlign: "right", fontSize: "11px", verticalAlign: "top", color: "var(--text-muted)" }}>
                            {(dia.productos || []).map((p: any, idx: number) => (
                              <div key={idx} style={{ padding: "2px 0", borderBottom: idx < (dia.productos?.length || 0) - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
                                S/ {Number(p.precioUnitario || 0).toFixed(2)}
                              </div>
                            ))}
                          </td>
                          <td style={{ padding: "10px", textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", color: "var(--primary)", verticalAlign: "middle" }}>
                            S/ {Number(dia.totalDia || dia.total || 0).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                      <tr style={{ backgroundColor: "rgba(255, 69, 0, 0.08)" }}>
                        <td colSpan={4} style={{ padding: "14px", textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)" }}>TOTAL ACUMULADO DEL PERÍODO</td>
                        <td style={{ padding: "14px", textAlign: "right", fontWeight: 800, color: "var(--primary)", fontSize: "1.2rem" }}>S/ {datosConsulta.total.toFixed(2)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {datosConsulta.isPaid ? (
                  <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.1)", borderRadius: "var(--radius-md)", border: "1px solid var(--success)", display: "flex", alignItems: "center", gap: "12px" }}>
                    <CheckCircle2 size={24} color="var(--success)" />
                    <div>
                      <p style={{ margin: 0, fontWeight: 800, color: "var(--success)" }}>Este periodo ya se encuentra PAGADO.</p>
                      <p style={{ margin: 0, fontSize: "var(--font-sm)", color: "var(--text-muted)" }}>Método: {datosConsulta.metodoPago}</p>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
                    <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
                      <button
                        onClick={() => setEstadoPagoNuevo("PAGADO")}
                        style={{
                          flex: 1, padding: "10px", borderRadius: "var(--radius-md)",
                          border: `2px solid ${estadoPagoNuevo === "PAGADO" ? "var(--success)" : "var(--border)"}`,
                          backgroundColor: estadoPagoNuevo === "PAGADO" ? "rgba(22, 163, 74, 0.05)" : "white",
                          color: estadoPagoNuevo === "PAGADO" ? "var(--success)" : "var(--text-muted)",
                          fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                        }}
                      >
                        <CheckCircle2 size={16} /> PAGADO
                      </button>
                      <button
                        onClick={() => { setEstadoPagoNuevo("PENDIENTE"); setMetodoPagoNuevo(""); }}
                        style={{
                          flex: 1, padding: "10px", borderRadius: "var(--radius-md)",
                          border: `2px solid ${estadoPagoNuevo === "PENDIENTE" ? "#f59e0b" : "var(--border)"}`,
                          backgroundColor: estadoPagoNuevo === "PENDIENTE" ? "rgba(245, 158, 11, 0.05)" : "white",
                          color: estadoPagoNuevo === "PENDIENTE" ? "#d97706" : "var(--text-muted)",
                          fontWeight: 800, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px"
                        }}
                      >
                        <Clock size={16} /> PENDIENTE
                      </button>
                    </div>

                    {estadoPagoNuevo === "PAGADO" && (
                      <div>
                        <label style={{ fontSize: "var(--font-sm)", fontWeight: 700, display: "block", marginBottom: "8px" }}>Método de Pago:</label>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          {["Efectivo", "Yape", "Plin", "Transferencia"].map((metodo) => (
                            <button
                              key={metodo}
                              onClick={() => setMetodoPagoNuevo(metodo)}
                              style={{
                                padding: "6px 12px", borderRadius: "20px",
                                border: `1px solid ${metodoPagoNuevo === metodo ? "var(--primary)" : "var(--border)"}`,
                                backgroundColor: metodoPagoNuevo === metodo ? "var(--primary)" : "white",
                                color: metodoPagoNuevo === metodo ? "white" : "var(--text-muted)",
                                fontWeight: 700, fontSize: "var(--font-xs)"
                              }}
                            >
                              {metodo}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={handleRegistrarPago}
                      style={{ padding: "10px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: 800, display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", cursor: "pointer" }}
                    >
                      <CreditCard size={16} /> GUARDAR REGISTRO
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* FILTROS DE HISTORIAL */}
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
              value={fechaInicioFiltro}
              onChange={(e) => setFechaInicioFiltro(e.target.value)}
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
              value={fechaFinFiltro}
              onChange={(e) => setFechaFinFiltro(e.target.value)}
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
              <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--success)", backgroundColor: "rgba(22,163,74,0.1)", padding: "4px 10px", borderRadius: "20px" }}>
                {pagosFiltrados.length} registros pagados
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
                  <th style={{ width: "110px" }}>Fecha Registro</th>
                  <th style={{ minWidth: "150px" }}>Proveedor</th>
                  <th style={{ minWidth: "220px" }}>Período / Detalle</th>
                  <th style={{ textAlign: "center", width: "140px", backgroundColor: "rgba(255, 69, 0, 0.06)" }}>Total a Pagar (S/)</th>
                  <th style={{ textAlign: "center", width: "150px" }}>Estado</th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.map((pago, i) => {
                  const fechaLabel = new Date(pago.fechaRegistro + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
                  const fechaInicio = new Date(pago.fechaInicio + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
                  const fechaFin = new Date(pago.fechaFin + "T12:00:00").toLocaleDateString("es-PE", { day: "2-digit", month: "short" });
                  
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
                      <td style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>
                        <strong>{fechaInicio} al {fechaFin}</strong><br/>
                        <span style={{ fontSize: "10px" }}>{pago.conceptos} registros calculados</span>
                      </td>
                      <td style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.04)", fontSize: "14px" }}>
                        S/ {pago.total.toFixed(2)}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", alignItems: "center" }}>
                          <button
                          onClick={() => toggleEstado(pago)}
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
                        {pago.metodoPago && (
                          <span style={{ fontSize: "9px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase" }}>
                            vía {pago.metodoPago}
                          </span>
                        )}
                      </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Fila de totales */}
                <tr style={{ backgroundColor: "#111", color: "white" }}>
                  <td colSpan={4} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                    TOTAL ACUMULADO DEL PERÍODO FILTRADO
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-lg)", border: "none", color: "#ff6b35" }}>
                    S/ {pagosFiltrados.reduce((s, p) => s + p.total, 0).toFixed(2)}
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
