"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, FileSpreadsheet, Calculator, CheckCircle2, 
  AlertCircle, ShoppingBag, PackageCheck, Info, History, 
  X, Plus, Layers, Trash2, FileText, ArrowRight
} from "lucide-react";

// ═══════════════════════════════════════════════
// INTERFACES
// ═══════════════════════════════════════════════

interface ProductOrder {
  descripcion: string;       // Nombre original completo del Excel
  descripcionLimpia: string; // Nombre limpio (solo producto, sin presentación)
  valores: { [key: string]: any };
}

interface ExcelDataSet {
  id: string;
  fileName: string;
  fechaReporte: string;
  headers: string[];
  data: ProductOrder[];
  rawExcelData: any[][];
  headerRowIndex: number;
}

interface ConsolidatedRow {
  producto: string;           // Nombre limpio del producto
  cantidadesPorExcel: { excelId: string; fileName: string; cantidad: number }[];
  total: number;
}

interface StockVerification {
  producto: string;
  unidad: string;
  pedidoTotal: number;
  stockAcumulado: number;
  compraRecomendada: number;
  stockProyectado: number;
  estado: "DESCONTADO" | "COMPRA_TOTAL" | "STOCK_SUFICIENTE";
}

function limpiarNombreProducto(desc: string): string {
  if (!desc) return "";
  return desc.trim(); // Solo quitamos espacios, respetando mayúsculas/minúsculas
}

// ═══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════

export default function OrdenesCompra() {
  const [role, setRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [excelSets, setExcelSets] = useState<ExcelDataSet[]>([]);
  const [loading, setLoading] = useState(false);
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedRow[]>([]);
  const [showConsolidated, setShowConsolidated] = useState(false);
  const [verificacionStock, setVerificacionStock] = useState<StockVerification[]>([]);
  const [showVerification, setShowVerification] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [globalStock, setGlobalStock] = useState<any[]>([]);

  const addMoreRef = useRef<HTMLInputElement>(null);

  // ── SISTEMA DE SINCRONIZACIÓN (Simulación Real-Time) ──
  const syncData = async (dataToPush?: any) => {
    try {
      if (dataToPush && (role === 'admin' || role === 'supervisor')) {
        await fetch('/api/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(dataToPush)
        });
      }
      
      const res = await fetch('/api/sync');
      const db = await res.json();
      
      // 1. Cargar stock agregado de trabajadores desde la DB compartida
      const today = new Date().toISOString().split("T")[0];
      const workers = ['Daniel', 'Jesus', 'Alex', 'Yamilet', 'Victor', 'Abraham', 'Fabricio'];
      const aggregated: Record<string, { producto: string, stock: number, unidad: string }> = {};

      workers.forEach(w => {
        const key = `inventario_dia_${today}_${w}`;
        const data = db[key]; // Leer de la DB compartida
        if (data) {
          try {
            const records = typeof data === 'string' ? JSON.parse(data) : data;
            records.forEach((r: any) => {
              const prodKey = r.producto.toUpperCase().trim();
              if (!aggregated[prodKey]) {
                aggregated[prodKey] = { producto: r.producto, stock: 0, unidad: r.unidad };
              }
              aggregated[prodKey].stock += (r.stockActual || 0);
            });
          } catch(e) {}
        }
      });
      setGlobalStock(Object.values(aggregated));

      // 2. Cargar órdenes compartidas (Solo si el estado local está vacío para no interrumpir al que está subiendo)
      if (db.shared_excel_sets && excelSets.length === 0) {
        setExcelSets(db.shared_excel_sets);
      }
      if (db.shared_consolidated_data && consolidatedData.length === 0) {
        setConsolidatedData(db.shared_consolidated_data);
        setShowConsolidated(true);
      }
      if (db.shared_verificacion_stock && verificacionStock.length === 0) {
        setVerificacionStock(db.shared_verificacion_stock);
        setShowVerification(true);
      }
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  useEffect(() => {
    const rawRole = localStorage.getItem("user_role")?.toLowerCase() || "";
    // Mapeo flexible de roles
    let normalizedRole = "trabajador";
    if (rawRole.includes("admin") || rawRole.includes("due") || rawRole.includes("jefe")) {
      normalizedRole = "admin";
    } else if (rawRole.includes("super")) {
      normalizedRole = "supervisor";
    } else if (rawRole.includes("enca")) {
      normalizedRole = "encargado";
    }
    
    const currentName = localStorage.getItem("user_name") || "Usuario";
    setRole(normalizedRole);
    setUserName(currentName);

    syncData();
    const interval = setInterval(() => syncData(), 3000); 
    return () => clearInterval(interval);
  }, []); 

  const processExcelFile = (file: File) => {
    return new Promise<ExcelDataSet | null>((resolve) => {
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

            let headerIdx = rawData.findIndex(row =>
              row.some(cell => {
                if (typeof cell !== 'string') return false;
                const upper = cell.toUpperCase();
                return upper.includes("DESCRIPCION") || upper.includes("PRODUCTO") || upper.includes("ARTICULO") || upper === "ITEM" || upper.includes("DETALLE");
              })
            );

            let validHeaders: string[] = [];
            let orders: ProductOrder[] = [];

            if (headerIdx !== -1) {
              const headerRow = rawData[headerIdx] as string[];
              validHeaders = headerRow.map((h, i) => (h && String(h).trim() !== "") ? String(h).trim() : `COL_${i}`);
              orders = rawData.slice(headerIdx + 1)
                .filter(row => row.length > 0 && row[0] && String(row[0]).trim() !== "")
                .map(row => {
                  const rowData: { [key: string]: any } = {};
                  validHeaders.forEach((label, index) => {
                    if (label) rowData[label] = row[index] !== undefined ? row[index] : 0;
                  });
                  const descOriginal = String(row[0]).trim();
                  return {
                    descripcion: descOriginal,
                    descripcionLimpia: limpiarNombreProducto(descOriginal),
                    valores: rowData
                  };
                });
            } else {
              let firstDataIdx = rawData.findIndex(row => 
                row.length >= 1 && typeof row[0] === 'string' && row[0].trim() !== "" && !isNaN(Number(row[row.length - 1]))
              );
              if (firstDataIdx === -1) firstDataIdx = 1;
              const maxCols = Math.max(1, ...rawData.slice(firstDataIdx).map(r => r.length));
              validHeaders = Array.from({ length: maxCols }, (_, i) => i === 0 ? "DESCRIPCION" : (i === maxCols - 1 ? "TOTAL" : `COL_${i}`));
              headerIdx = Math.max(0, firstDataIdx - 1);
              orders = rawData.slice(firstDataIdx)
                .filter(row => row.length > 0 && row[0] && String(row[0]).trim() !== "")
                .map(row => {
                  const rowData: { [key: string]: any } = {};
                  validHeaders.forEach((label, index) => {
                    if (label) rowData[label] = row[index] !== undefined ? row[index] : 0;
                  });
                  const descOriginal = String(row[0]).trim();
                  return {
                    descripcion: descOriginal,
                    descripcionLimpia: limpiarNombreProducto(descOriginal),
                    valores: rowData
                  };
                });
            }

            resolve({
              id: `excel-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
              fileName: file.name,
              fechaReporte: titulo || "Fecha no detectada",
              headers: validHeaders,
              data: orders,
              rawExcelData: rawData,
              headerRowIndex: headerIdx
            });
          } else {
            resolve(null);
          }
        } catch {
          alert(`Error al procesar el archivo: ${file.name}`);
          resolve(null);
        }
      };
      reader.readAsBinaryString(file);
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setLoading(true);
    setShowConsolidated(false);
    setConsolidatedData([]);
    setShowVerification(false);
    setVerificacionStock([]);

    const newSets: ExcelDataSet[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await processExcelFile(files[i]);
      if (result) newSets.push(result);
    }
    const nextSets = [...excelSets, ...newSets];
    setExcelSets(nextSets);
    syncData({ shared_excel_sets: nextSets });
    setLoading(false);
    e.target.value = ""; 
  };

  const removeExcel = (id: string) => {
    setExcelSets(prev => {
      const next = prev.filter(s => s.id !== id);
      syncData({ 
        shared_excel_sets: next,
        shared_consolidated_data: [],
        shared_verificacion_stock: []
      });
      return next;
    });
    setShowConsolidated(false);
    setConsolidatedData([]);
    setShowVerification(false);
    setVerificacionStock([]);
  };

  const calcularSumaTotal = () => {
    if (excelSets.length === 0) return;
    // Mapa: Key en MAYÚSCULAS -> { Datos Consolidados }
    const productMap = new Map<string, ConsolidatedRow & { nombreDisplay?: string, nombreOriginalRappi?: string }>();

    excelSets.forEach(excelSet => {
      const isRappi = excelSet.fileName.toLowerCase().includes("rappi");
      excelSet.data.forEach(order => {
        const nombreOriginal = order.descripcion;
        const keyAgrupacion = nombreOriginal.trim().toUpperCase(); // Key interna para sumar
        
        const totalCol = excelSet.headers.find(h => {
          const upper = h.toUpperCase();
          return upper === "TOTAL" || upper === "TOTALES" || upper === "CANT" || upper === "CANTIDAD";
        });
        let cantidad = 0;
        if (totalCol) cantidad = Number(order.valores[totalCol]) || 0;
        else cantidad = Number(order.valores[excelSet.headers[excelSet.headers.length - 1]]) || 0;

        if (!productMap.has(keyAgrupacion)) {
          productMap.set(keyAgrupacion, { 
            producto: keyAgrupacion, 
            cantidadesPorExcel: [], 
            total: 0,
            nombreDisplay: nombreOriginal // Guardar el primero que encontremos
          });
        }
        
        const row = productMap.get(keyAgrupacion)!;
        
        // Priorizar el nombre LITERAL de Rappi (respetando sus mayúsculas/minúsculas)
        if (isRappi && !row.nombreOriginalRappi) {
          row.nombreOriginalRappi = nombreOriginal;
        }

        const existingExcelEntry = row.cantidadesPorExcel.find(c => c.excelId === excelSet.id);
        if (existingExcelEntry) existingExcelEntry.cantidad += cantidad;
        else row.cantidadesPorExcel.push({ excelId: excelSet.id, fileName: excelSet.fileName, cantidad: cantidad });
      });
    });

    const consolidated: ConsolidatedRow[] = [];
    productMap.forEach(row => {
      row.total = row.cantidadesPorExcel.reduce((sum, c) => sum + c.cantidad, 0);
      
      // EL NOMBRE FINAL DEBE SER EL ORIGINAL (CON SUS MAYÚSCULAS)
      const finalRow = {
        ...row,
        producto: row.nombreOriginalRappi || row.nombreDisplay || row.producto
      };
      consolidated.push(finalRow);
    });
    consolidated.sort((a, b) => a.producto.localeCompare(b.producto));
    setConsolidatedData(consolidated);
    setShowConsolidated(true);
    syncData({ 
      shared_excel_sets: excelSets,
      shared_consolidated_data: consolidated 
    });
    setTimeout(() => document.getElementById("tabla-consolidada")?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const analizarStockAcumulado = () => {
    if (consolidatedData.length === 0) {
      alert("Primero presione 'Calcular Suma Total' para consolidar los datos de todos los Excel.");
      return;
    }
    const results: StockVerification[] = consolidatedData.map(row => {
      const pedidoTotal = row.total;
      const productEnStock = globalStock.find(s => {
        const p1 = s.producto.toLowerCase().replace(/['"]/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const p2 = row.producto.toLowerCase().replace(/['"]/g, '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return p1.includes(p2) || p2.includes(p1);
      });
      const stockAcumulado = productEnStock ? productEnStock.stock : 0;
      const unidad = productEnStock ? productEnStock.unidad : "und";
      let compraRecomendada = pedidoTotal - stockAcumulado;
      let stockProyectado = stockAcumulado - pedidoTotal;
      let estado: StockVerification["estado"] = "COMPRA_TOTAL";
      if (stockAcumulado > 0) {
        if (compraRecomendada <= 0) { compraRecomendada = 0; estado = "STOCK_SUFICIENTE"; }
        else { stockProyectado = 0; estado = "DESCONTADO"; }
      } else { stockProyectado = 0; }
      return { producto: row.producto, unidad, pedidoTotal, stockAcumulado, compraRecomendada, stockProyectado: Math.max(0, stockProyectado), estado };
    });
    setVerificacionStock(results);
    setShowVerification(true);
    syncData({ 
      shared_verificacion_stock: results 
    });
    setTimeout(() => document.getElementById("tabla-stock")?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  const handleConfirmar = async () => {
    if (verificacionStock.length === 0) {
      alert("Primero presione 'Verificar vs Stock Total' para calcular las cantidades reales.");
      return;
    }
    const productosAComprar = verificacionStock.map(row => ({
      id: Math.random().toString(36).substr(2, 9),
      nombre: row.producto,
      cantidadSolicitada: row.pedidoTotal, // El pedido original del Excel
      stockTienda: row.stockAcumulado,     // El stock que había
      compraReal: row.compraRecomendada,   // Lo que realmente hay que comprar
      unidadVenta: row.unidad || "Unid"
    }));

    // Preparar entrada de historial para simulación compartida
    const res = await fetch('/api/sync');
    const db = await res.json();
    const historial = db.orden_compra_historial || [];
    
    const newEntry = {
      id: `OC-${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 12)}`,
      fecha: new Date().toLocaleString(),
      excelFiles: excelSets.map(s => s.fileName),
      itemsCount: verificacionStock.length,
      totalUnidades: verificacionStock.reduce((sum, r) => sum + r.compraRecomendada, 0),
      creadoPor: userName || "Dueño Principal",
      items: productosAComprar, 
      estado: "EN_MERCADO"
    };

    const updatedHistorial = [newEntry, ...historial];
    
    // Limpiar estados compartidos después de finalizar
    await syncData({ 
      orden_compra_historial: updatedHistorial,
      shared_excel_sets: [],
      shared_consolidated_data: [],
      shared_verificacion_stock: []
    });

    localStorage.setItem("orden_compra_actual", JSON.stringify(productosAComprar));
    setShowModal(true);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      <header style={{ marginBottom: "var(--spacing-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-lg)" }}>Órdenes de Compra</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
            {role === 'encargado' ? "Visualiza la orden consolidada y descarga el pedido final." : "Carga múltiples Excel, consolida y resta el stock de tienda."}
          </p>
        </div>
        {(role === 'admin' || role === 'supervisor') && (
          <label className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", cursor: "pointer" }}>
            <Upload size={14} /> Cargar Excel
            <input type="file" hidden accept=".xlsx, .xls" multiple onChange={handleFileUpload} />
          </label>
        )}
      </header>

      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> {role === 'encargado' ? "Pedido final restando el stock de tienda." : "Sube los Excel de Rappi y Tienda Campos para consolidar."}
        </p>
      </div>

      {excelSets.map((excelSet, setIndex) => (
        <div key={excelSet.id} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "var(--secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
              <div style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>{setIndex + 1}</div>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--font-sm)", fontWeight: 800 }}>{excelSet.fileName}</h3>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)" }}>{excelSet.data.length} productos</p>
              </div>
            </div>
            <button onClick={() => removeExcel(excelSet.id)} style={{ background: "none", border: "none", color: "#dc2626", cursor: "pointer" }}><Trash2 size={16} /></button>
          </div>
          <div style={{ overflowX: "auto", maxHeight: "40vh" }}>
            <table className="compact-table">
              <thead>
                <tr>
                  <th style={{ width: "40px" }}>#</th>
                  {excelSet.headers.map((h, i) => <th key={i}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {excelSet.data.map((order, ri) => (
                  <tr key={ri}>
                    <td>{ri + 1}</td>
                    {excelSet.headers.map((h, ci) => <td key={ci}>{ci === 0 ? order.descripcionLimpia : order.valores[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {excelSets.length > 0 && (role === 'admin' || role === 'supervisor') && (
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)", display: "flex", justifyContent: "center", gap: "var(--spacing-md)" }}>
          <button className="btn-primary" onClick={calcularSumaTotal} style={{ padding: "12px 24px" }}><Calculator size={16} style={{ marginRight: "8px" }} /> CONSOLIDAR ÓRDENES</button>
          <button className="btn-primary" onClick={() => addMoreRef.current?.click()} style={{ backgroundColor: "white", color: "var(--primary)", border: "1px solid var(--primary)" }}><Plus size={16} /> AGREGAR OTRO</button>
          <input ref={addMoreRef} type="file" hidden accept=".xlsx, .xls" multiple onChange={handleFileUpload} />
        </div>
      )}

      {showConsolidated && (
        <div id="tabla-consolidada" className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "#f0fdf4", borderBottom: "1px solid #bbf7d0" }}>
            <h2 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800, color: "#16a34a" }}>Suma Consolidada de Pedidos</h2>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="compact-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  {excelSets.map(s => <th key={s.id} style={{ textAlign: "center" }}>{s.fileName.split('.')[0]}</th>)}
                  <th style={{ textAlign: "center", backgroundColor: "#f0fdf4" }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {consolidatedData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 700 }}>{row.producto}</td>
                    {excelSets.map(s => {
                      const e = row.cantidadesPorExcel.find(c => c.excelId === s.id);
                      return <td key={s.id} style={{ textAlign: "center" }}>{e ? e.cantidad : "—"}</td>;
                    })}
                    <td style={{ textAlign: "center", fontWeight: 800, color: "#16a34a" }}>{row.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "var(--spacing-md)", textAlign: "right", backgroundColor: "var(--secondary)" }}>
            <button className="btn-primary" onClick={analizarStockAcumulado}>VERIFICAR STOCK TIENDA <ArrowRight size={14} style={{ marginLeft: "8px" }} /></button>
          </div>
        </div>
      )}

      {showVerification && (
        <div id="tabla-stock" className="card" style={{ padding: 0, overflow: "hidden", borderTop: "4px solid var(--primary)" }}>
          <div style={{ padding: "var(--spacing-lg)", backgroundColor: "var(--secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between" }}>
            <h2 style={{ fontSize: "var(--font-base)", fontWeight: 800, margin: 0 }}>Cálculo Final para el Encargado</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#1d4ed8" }}>■ SIN STOCK (AZUL)</div>
              <div style={{ fontSize: "10px", fontWeight: 800, color: "#16a34a" }}>■ STOCK OK (VERDE)</div>
            </div>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="compact-table">
              <thead>
                <tr style={{ backgroundColor: "#f8f9fa" }}>
                  <th>#</th>
                  <th>Producto</th>
                  <th style={{ textAlign: "center" }}>Pedido Total</th>
                  <th style={{ textAlign: "center", backgroundColor: "#eff6ff" }}>Stock en Tienda</th>
                  <th style={{ textAlign: "center", backgroundColor: "var(--primary)", color: "white" }}>A Comprar Real</th>
                  <th style={{ textAlign: "center" }}>Unidad</th>
                  <th>Observación</th>
                </tr>
              </thead>
              <tbody>
                {verificacionStock.map((row, i) => {
                  const noStock = row.stockAcumulado <= 0;
                  const enough = row.estado === "STOCK_SUFICIENTE";
                  return (
                    <tr key={i} style={{ backgroundColor: enough ? "#f0fdf4" : "transparent" }}>
                      <td style={{ fontSize: "10px" }}>{i + 1}</td>
                      <td style={{ fontWeight: 800, color: noStock ? "#1d4ed8" : "inherit" }}>{row.producto}</td>
                      <td style={{ textAlign: "center" }}>{row.pedidoTotal}</td>
                      <td style={{ textAlign: "center", fontWeight: 800, color: noStock ? "#1d4ed8" : "#1e40af", backgroundColor: "rgba(30,64,175,0.03)" }}>{row.stockAcumulado}</td>
                      <td style={{ textAlign: "center", fontWeight: 900, color: "var(--primary)", fontSize: "1.1rem" }}>{row.compraRecomendada}</td>
                      <td style={{ textAlign: "center", fontSize: "10px" }}>{row.unidad}</td>
                      <td style={{ fontSize: "10px", fontWeight: 800 }}>
                        {enough ? "STOCK CUBRE TODO" : (noStock ? "SIN STOCK (COMPRAR TODO)" : "DESCONTADO PARCIAL")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{ padding: "var(--spacing-lg)", textAlign: "right" }}>
            <button className="btn-primary" onClick={handleConfirmar}>FINALIZAR Y ENVIAR PEDIDO</button>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 1000 }}>
          <div className="card" style={{ width: "400px", textAlign: "center", padding: "40px" }}>
            <CheckCircle2 size={48} color="var(--success)" style={{ margin: "0 auto 20px" }} />
            <h3>¡Pedido Procesado!</h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "20px" }}>El encargado ya puede visualizar la lista final de compras.</p>
            <button onClick={() => setShowModal(false)} className="btn-primary">Aceptar</button>
          </div>
        </div>
      )}
    </div>
  );
}
