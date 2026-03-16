"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Upload, FileSpreadsheet, Calculator, CheckCircle2, Table, AlertCircle, ShoppingBag, PackageCheck, Info, History } from "lucide-react";

interface ProductOrder {
  descripcion: string;
  valores: { [key: string]: any };
}

interface StockVerification {
  producto: string;
  pedidoTotal: number;
  stockAcumulado: number;
  compraRecomendada: number;
  stockProyectado: number; // Nuevo: Saldo que quedaría para mañana
  estado: "DESCONTADO" | "COMPRA_TOTAL" | "STOCK_SUFICIENTE";
}

export default function OrdenesCompra() {
  const [data, setData] = useState<ProductOrder[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [fechaReporte, setFechaReporte] = useState("");
  const [verificacionStock, setVerificacionStock] = useState<StockVerification[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [showModal, setShowModal] = useState(false);

  // Simulación de stock total (acumulado de varios días)
  const simulatedTotalStock: { [key: string]: number } = {
    "Aguaymanto - taper x 250 g": 10, // Stock acumulado
    "Ají amarillo x unidad": 25,
    "Brócoli - bandeja x 250 g": 12,
    "Cebolla roja - malla x 500 g": 15
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setVerificacionStock([]);
    setShowVerification(false);
    
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws, { header: 1 }) as any[][];

        if (rawData.length > 1) {
          const primeraFila = rawData[0];
          const titulo = primeraFila.find(cell => typeof cell === 'string' && cell.length > 0);
          setFechaReporte(titulo || "Fecha no detectada");

          let headerIdx = rawData.findIndex(row => 
            row.some(cell => String(cell).toUpperCase().includes("DESCRIPCION"))
          );
          if (headerIdx === -1) headerIdx = 1;

          const headerRow = rawData[headerIdx] as string[];
          const validHeaders = headerRow.map(h => h ? String(h).trim() : "");
          setHeaders(validHeaders);

          const orders: ProductOrder[] = rawData.slice(headerIdx + 1)
            .filter(row => row.length > 0 && row[0] && String(row[0]).trim() !== "") 
            .map(row => {
              const rowData: { [key: string]: any } = {};
              validHeaders.forEach((label, index) => {
                if (label) rowData[label] = row[index] !== undefined ? row[index] : 0;
              });
              return { descripcion: String(row[0]).trim(), valores: rowData };
            });

          setData(orders);
        }
      } catch (error) {
        alert("Error al procesar el Excel.");
      }
      setLoading(false);
    };
    reader.readAsBinaryString(file);
  };

  const analizarStockAcumulado = () => {
    if (data.length === 0) return;

    const results: StockVerification[] = data.map(order => {
      const totalCol = headers.find(h => h.toUpperCase() === "TOTAL");
      const pedidoTotal = totalCol ? Number(order.valores[totalCol]) || 0 : 0;
      const stockAcumulado = simulatedTotalStock[order.descripcion] || 0;
      
      let compraRecomendada = pedidoTotal - stockAcumulado;
      let stockProyectado = stockAcumulado - pedidoTotal;
      let estado: StockVerification["estado"] = "COMPRA_TOTAL";

      if (stockAcumulado > 0) {
        if (compraRecomendada <= 0) {
          compraRecomendada = 0;
          estado = "STOCK_SUFICIENTE";
        } else {
          stockProyectado = 0; // Se gastó todo el stock y aún falta comprar
          estado = "DESCONTADO";
        }
      } else {
        stockProyectado = 0;
      }

      return {
        producto: order.descripcion,
        pedidoTotal,
        stockAcumulado,
        compraRecomendada,
        stockProyectado: Math.max(0, stockProyectado),
        estado
      };
    });

    setVerificacionStock(results);
    setShowVerification(true);
    
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleConfirmar = () => {
    if (verificacionStock.length === 0) {
      alert("Primero presione 'Verificar vs Stock' para calcular las cantidades reales.");
      return;
    }

    const productosAComprar = verificacionStock
      .filter(row => row.compraRecomendada > 0)
      .map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        nombre: row.producto,
        cantidadSolicitada: row.compraRecomendada,
        unidadVenta: row.producto.toLowerCase().includes("bandeja") ? "Bandejas" : 
                    row.producto.toLowerCase().includes("taper") ? "Tapers" : "Unidades"
      }));

    if (productosAComprar.length === 0) {
      alert("El stock acumulado cubre todos los pedidos. ¡No es necesario comprar nada hoy!");
      return;
    }

    // Simular guardado
    localStorage.setItem("orden_compra_actual", JSON.stringify(productosAComprar));
    
    // Mostrar modal en lugar de redireccionar
    setShowModal(true);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      <header style={{ marginBottom: "var(--spacing-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-lg)" }}>Órdenes de Compra</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
            Calcula la compra real descontando el **stock total acumulado** del almacén.
          </p>
        </div>
        
        <label className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", cursor: "pointer" }}>
          <Upload size={14} />
          Cargar Excel de Hoy
          <input type="file" hidden accept=".xlsx, .xls" onChange={handleFileUpload} />
        </label>
      </header>

      {fechaReporte && (
        <div style={{ marginBottom: "var(--spacing-md)", padding: "var(--spacing-sm)", backgroundColor: "var(--primary)", color: "white", borderRadius: "var(--radius-sm)", display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "var(--font-xs)", fontWeight: 600 }}>
          <AlertCircle size={14} />
          REPORTE: {fechaReporte}
        </div>
      )}

      {data.length > 0 && (
        <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ overflowX: "auto", maxHeight: "50vh" }}>
            <table className="compact-table" style={{ minWidth: "100%" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ backgroundColor: "var(--secondary)", width: "40px", textAlign: "center" }}>#</th>
                  {headers.map((h, i) => h ? (
                    <th key={i} style={{ whiteSpace: "nowrap", backgroundColor: "var(--secondary)", color: "var(--foreground)", textAlign: i === 0 ? "left" : "center" }}>
                      {h}
                    </th>
                  ) : <th key={i}></th>)}
                </tr>
              </thead>
              <tbody>
                {data.map((order, rowIndex) => (
                  <tr key={rowIndex}>
                    <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.7rem" }}>{rowIndex + 1}</td>
                    {headers.map((h, colIndex) => h ? (
                      <td key={colIndex} style={{ textAlign: colIndex === 0 ? "left" : "center", fontWeight: colIndex === 0 ? 600 : 400, backgroundColor: h.toUpperCase() === "TOTAL" ? "#fff9f6" : "transparent" }}>
                        {order.valores[h]}
                      </td>
                    ) : <td key={colIndex}></td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ padding: "var(--spacing-md)", backgroundColor: "var(--secondary)", display: "flex", justifyContent: "flex-end", gap: "var(--spacing-md)" }}>
            <button className="btn-primary" style={{ backgroundColor: "#333" }} onClick={analizarStockAcumulado}>
              <Calculator size={14} style={{ marginRight: "var(--spacing-sm)" }} />
              Verificar vs Stock Total
            </button>
            <button className="btn-primary" onClick={handleConfirmar}>
              <CheckCircle2 size={14} style={{ marginRight: "var(--spacing-sm)" }} />
              Confirmar Pedido Consolidado
            </button>
          </div>
        </div>
      )}

      {showVerification && (
        <div className="card" style={{ marginTop: "var(--spacing-xl)", borderTop: "4px solid var(--primary)" }}>
          <div style={{ marginBottom: "var(--spacing-md)", display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
            <History size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "var(--font-lg)", margin: 0 }}>Cálculo Basado en Stock Acumulado (Multi-Día)</h2>
          </div>
          
          <div style={{ padding: "var(--spacing-sm)", backgroundColor: "rgba(255, 69, 0, 0.05)", borderRadius: "var(--radius-sm)", marginBottom: "var(--spacing-md)", display: "flex", flexWrap: "wrap", gap: "var(--spacing-md)" }}>
             <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
               <div style={{ width: "10px", height: "10px", backgroundColor: "#f0fdf4", border: "1px solid #16a34a" }}></div> Stock Cubre Todo
             </div>
             <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
               <Info size={10} /> El sistema resta **todo el stock disponible** en el historial, no solo el de ayer.
             </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="compact-table">
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Producto</th>
                  <th>Pedido Excel</th>
                  <th style={{ backgroundColor: "#eef2ff" }}>Stock Actual</th>
                  <th style={{ backgroundColor: "var(--primary)", color: "white" }}>A Comprar Realmente</th>
                  <th style={{ backgroundColor: "#f0fdf4" }}>Saldo Stock Proyectado</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {verificacionStock.map((row, i) => (
                  <tr key={i} style={{ backgroundColor: row.estado === "STOCK_SUFICIENTE" ? "#f0fdf4" : "transparent" }}>
                    <td style={{ textAlign: "center", fontSize: "10px" }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{row.producto}</td>
                    <td style={{ textAlign: "center" }}>{row.pedidoTotal}</td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "#4338ca", backgroundColor: "#f5f7ff" }}>
                      {row.stockAcumulado}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", fontSize: "var(--font-lg)" }}>
                      {row.compraRecomendada}
                    </td>
                    <td style={{ textAlign: "center", fontWeight: 700, color: "var(--success)" }}>
                      {row.stockProyectado}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      {row.estado === "STOCK_SUFICIENTE" ? (
                        <span style={{ color: "var(--success)", fontSize: "10px", fontWeight: 700 }}>SOBRANTE ACUMULADO CUBRE PEDIDO</span>
                      ) : row.estado === "DESCONTADO" ? (
                        <span style={{ color: "var(--primary)", fontSize: "10px", fontWeight: 600 }}>CANTIDAD REDUCIDA POR STOCK</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "10px" }}>SIN STOCK DISPONIBLE</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "80px 0", border: "2px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
          <FileSpreadsheet size={48} style={{ marginBottom: "var(--spacing-md)", opacity: 0.1 }} />
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-muted)" }}>Sube el Excel para analizar el stock acumulado.</p>
        </div>
      )}

      {/* Modal de Confirmación */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999
        }}>
          <div className="card" style={{ width: "450px", textAlign: "center", animation: "slideDown 0.3s ease-out" }}>
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", backgroundColor: "var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto var(--spacing-md)" }}>
              <CheckCircle2 size={32} color="white" />
            </div>
            <h2 style={{ fontSize: "var(--font-lg)", marginBottom: "var(--spacing-sm)" }}>¡Enviado al encargado!</h2>
            <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", marginBottom: "var(--spacing-xl)" }}>
              El pedido consolidado ha sido calculado y enviado exitosamente. Selecciona qué deseas hacer ahora:
            </p>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
              <button 
                onClick={() => window.location.href = "/dashboard/ordenes/confirmadas"}
                className="btn-primary" 
                style={{ backgroundColor: "var(--secondary)", color: "var(--foreground)", padding: "var(--spacing-md)" }}
              >
                1. Ir a Historial del Encargado
              </button>
              
              <button 
                onClick={() => window.location.href = "/dashboard/asignaciones-boletas"}
                className="btn-primary" 
                style={{ padding: "var(--spacing-md)" }}
              >
                2. Ver Boletas y Asignaciones
              </button>
              
              <button 
                onClick={() => setShowModal(false)}
                style={{ marginTop: "var(--spacing-md)", background: "transparent", border: "none", color: "var(--text-muted)", fontSize: "var(--font-xs)", cursor: "pointer", textDecoration: "underline" }}
              >
                Cerrar y quedarme aquí
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
