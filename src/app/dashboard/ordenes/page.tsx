"use client";

import { useState, useRef, useEffect } from "react";
import * as XLSX from "xlsx";
import { 
  Upload, FileSpreadsheet, Calculator, CheckCircle2, 
  AlertCircle, ShoppingBag, PackageCheck, Info, History, 
  X, Plus, Layers, Trash2, FileText
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

// ═══════════════════════════════════════════════
// UTILIDAD: Limpiar nombre de producto
// ═══════════════════════════════════════════════

function limpiarNombreProducto(desc: string): string {
  return desc
    // Remover guiones seguidos de presentación
    .replace(/\s*[-–]\s*(bandeja|taper|malla|bolsa|caja|atado|paquete|sachet|frasco|botella|lata|sobre|display)\b/gi, '')
    // Remover "x 250 g", "x unidad", "x 1 kg", "x100g", etc.
    .replace(/\s*x\s*\d+\s*(g|gr|kg|ml|l|lt|cc|oz|unidad|unidades|und|un)?\b/gi, '')
    // Remover "x unidad" suelto
    .replace(/\s*x\s*(unidad|unidades|und|atado|atados|paquete|paquetes)\b/gi, '')
    // Limpiar espacios dobles
    .replace(/\s+/g, ' ')
    .trim();
}

// ═══════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════

export default function OrdenesCompra() {
  // Multi-Excel state
  const [excelSets, setExcelSets] = useState<ExcelDataSet[]>([]);
  const [loading, setLoading] = useState(false);

  // Consolidated summary
  const [consolidatedData, setConsolidatedData] = useState<ConsolidatedRow[]>([]);
  const [showConsolidated, setShowConsolidated] = useState(false);

  // Stock verification
  const [verificacionStock, setVerificacionStock] = useState<StockVerification[]>([]);
  const [showVerification, setShowVerification] = useState(false);

  // Confirmation modal
  const [showModal, setShowModal] = useState(false);

  // Ref for hidden file input (add more button)
  const addMoreRef = useRef<HTMLInputElement>(null);

  // Usaremos el stock global compartido con Inventario
  const [globalStock, setGlobalStock] = useState<any[]>([]);
  useEffect(() => {
    const saved = localStorage.getItem("global_inventory_stock");
    let initialGlobalStock = [];
    if (saved) {
      try {
        initialGlobalStock = JSON.parse(saved);
      } catch(e) {}
    }
    // Para simulacion: asegurarnos que tenemos los datos de prueba listos
    if (initialGlobalStock.length === 0 || !initialGlobalStock.some((s:any) => s.producto.includes("amarillo"))) {
      initialGlobalStock = [
        { id: "1", producto: "Platano seda", unidad: "unid", stockAcumulado: 45, sobranteAyer: 10, mermaHoy: 0, ultimaActualizacion: "2026-03-10 21:00" },
        { id: "2", producto: "Fresa", unidad: "taper", stockAcumulado: 22, sobranteAyer: 5, mermaHoy: 0, ultimaActualizacion: "2026-03-10 20:30" },
        { id: "3", producto: "Aguaymanto", unidad: "taper", stockAcumulado: 15, sobranteAyer: 2, mermaHoy: 0, ultimaActualizacion: "2026-03-10 19:45" },
        { id: "4", producto: "Brócoli", unidad: "bandeja", stockAcumulado: 30, sobranteAyer: 8, mermaHoy: 0, ultimaActualizacion: "2026-03-10 18:00" },
        { id: "5", producto: "Cebolla roja", unidad: "kg", stockAcumulado: 20, sobranteAyer: 15, mermaHoy: 0, ultimaActualizacion: "2026-03-10 18:00" },
        { id: "6", producto: "Ají amarillo", unidad: "kg", stockAcumulado: 25, sobranteAyer: 5, mermaHoy: 0, ultimaActualizacion: "2026-03-10 18:00" },
      ];
      localStorage.setItem("global_inventory_stock", JSON.stringify(initialGlobalStock));
    }
    setGlobalStock(initialGlobalStock);
  }, []);

  // ── PROCESAR EXCEL ──
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
              validHeaders = headerRow.map((h, i) => {
                if (h && String(h).trim() !== "") return String(h).trim();
                return `COL_${i}`;
              });

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
              // No hay fila de cabecera estándar detectada. 
              // Buscamos la primera fila que parezca contener datos (String, Número).
              let firstDataIdx = rawData.findIndex(row => 
                row.length >= 1 && typeof row[0] === 'string' && row[0].trim() !== "" && !isNaN(Number(row[row.length - 1]))
              );

              if (firstDataIdx === -1) {
                firstDataIdx = 1;
              }

              // Sintetizar headers
              const maxCols = Math.max(1, ...rawData.slice(firstDataIdx).map(r => r.length));
              validHeaders = Array.from({ length: maxCols }, (_, i) => {
                if (i === 0) return "DESCRIPCION";
                if (i === maxCols - 1) return "TOTAL";
                return `COL_${i}`;
              });

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

  // ── UPLOAD HANDLER (soporta múltiples archivos simultáneos) ──
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    // Reset consolidado y stock si suben nuevos archivos
    setShowConsolidated(false);
    setConsolidatedData([]);
    setShowVerification(false);
    setVerificacionStock([]);

    const newSets: ExcelDataSet[] = [];
    for (let i = 0; i < files.length; i++) {
      const result = await processExcelFile(files[i]);
      if (result) newSets.push(result);
    }

    setExcelSets(prev => [...prev, ...newSets]);
    setLoading(false);
    e.target.value = ""; // Reset input
  };

  // ── ELIMINAR UN EXCEL ──
  const removeExcel = (id: string) => {
    setExcelSets(prev => prev.filter(s => s.id !== id));
    // Reset consolidado si eliminaron un Excel
    setShowConsolidated(false);
    setConsolidatedData([]);
    setShowVerification(false);
    setVerificacionStock([]);
  };

  // ── CALCULAR SUMA CONSOLIDADA ──
  const calcularSumaTotal = () => {
    if (excelSets.length === 0) return;

    const productMap = new Map<string, ConsolidatedRow>();

    excelSets.forEach(excelSet => {
      excelSet.data.forEach(order => {
        const nombreLimpio = order.descripcionLimpia;
        // Buscar la columna TOTAL o de cantidad aproximada
        const totalCol = excelSet.headers.find(h => {
          const upper = h.toUpperCase();
          return upper === "TOTAL" || upper === "TOTALES" || upper === "CANT" || upper === "CANTIDAD";
        });
        
        let cantidad = 0;
        if (totalCol) {
          cantidad = Number(order.valores[totalCol]) || 0;
        } else {
          // Si no hay ninguna columna explícita, probamos con la última columna que tenga números
          const lastCol = excelSet.headers[excelSet.headers.length - 1];
          cantidad = Number(order.valores[lastCol]) || 0;
        }

        if (!productMap.has(nombreLimpio)) {
          productMap.set(nombreLimpio, {
            producto: nombreLimpio,
            cantidadesPorExcel: [],
            total: 0
          });
        }

        const row = productMap.get(nombreLimpio)!;

        // Verificar si ya existe entrada para este Excel (mismo producto aparece 2 veces en 1 Excel)
        const existingExcelEntry = row.cantidadesPorExcel.find(c => c.excelId === excelSet.id);
        if (existingExcelEntry) {
          existingExcelEntry.cantidad += cantidad;
        } else {
          row.cantidadesPorExcel.push({
            excelId: excelSet.id,
            fileName: excelSet.fileName,
            cantidad: cantidad
          });
        }
      });
    });

    // Calcular totales
    const consolidated: ConsolidatedRow[] = [];
    productMap.forEach(row => {
      row.total = row.cantidadesPorExcel.reduce((sum, c) => sum + c.cantidad, 0);
      consolidated.push(row);
    });

    // Ordenar alfabéticamente
    consolidated.sort((a, b) => a.producto.localeCompare(b.producto));

    setConsolidatedData(consolidated);
    setShowConsolidated(true);

    // Scroll suave hacia la tabla consolidada
    setTimeout(() => {
      document.getElementById("tabla-consolidada")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ── VERIFICAR VS STOCK (ahora usa la tabla consolidada) ──
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

      const stockAcumulado = productEnStock ? productEnStock.stockAcumulado : 0;
      const unidad = productEnStock ? productEnStock.unidad : "und";

      let compraRecomendada = pedidoTotal - stockAcumulado;
      let stockProyectado = stockAcumulado - pedidoTotal;
      let estado: StockVerification["estado"] = "COMPRA_TOTAL";

      if (stockAcumulado > 0) {
        if (compraRecomendada <= 0) {
          compraRecomendada = 0;
          estado = "STOCK_SUFICIENTE";
        } else {
          stockProyectado = 0;
          estado = "DESCONTADO";
        }
      } else {
        stockProyectado = 0;
      }

      return {
        producto: row.producto,
        unidad,
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
      document.getElementById("tabla-stock")?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  // ── CONFIRMAR PEDIDO ──
  const handleConfirmar = () => {
    if (verificacionStock.length === 0) {
      alert("Primero presione 'Verificar vs Stock Total' para calcular las cantidades reales.");
      return;
    }

    const productosAComprar = verificacionStock
      .filter(row => row.compraRecomendada > 0)
      .map(row => ({
        id: Math.random().toString(36).substr(2, 9),
        nombre: row.producto,
        cantidadSolicitada: row.compraRecomendada,
        unidadVenta: "Unidades"
      }));

    if (productosAComprar.length === 0) {
      alert("El stock acumulado cubre todos los pedidos. ¡No es necesario comprar nada hoy!");
      return;
    }

    // Preservar raw data del primer Excel (para compatibilidad con confirmadas)
    if (excelSets.length > 0) {
      const firstSet = excelSets[0];
      const updatedRawData = [...firstSet.rawExcelData];
      if (firstSet.headerRowIndex !== -1 && updatedRawData.length > 0) {
        const colCalculoName = "TOTAL CALCULADO COMPRA";
        const headerRow = [...updatedRawData[firstSet.headerRowIndex]];
        let colIdx = headerRow.findIndex(h => String(h).toUpperCase().includes("TOTAL CALCULADO COMPRA"));

        if (colIdx === -1) {
          colIdx = headerRow.length;
          headerRow[colIdx] = colCalculoName;
        }

        updatedRawData[firstSet.headerRowIndex] = headerRow;

        for (let i = firstSet.headerRowIndex + 1; i < updatedRawData.length; i++) {
          const row = updatedRawData[i];
          if (row && row[0]) {
            const productDesc = limpiarNombreProducto(String(row[0]).trim());
            const result = verificacionStock.find(r => r.producto === productDesc);
            if (result) {
              updatedRawData[i] = [...row];
              updatedRawData[i][colIdx] = result.compraRecomendada;
            }
          }
        }
        localStorage.setItem("orden_compra_full_raw", JSON.stringify(updatedRawData));
      }
    }

    localStorage.setItem("orden_compra_actual", JSON.stringify(productosAComprar));
    setShowModal(true);
  };

  // ═══════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>

      {/* ── HEADER ── */}
      <header style={{ marginBottom: "var(--spacing-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-lg)" }}>Órdenes de Compra</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
            Carga múltiples Excel, consolida productos y calcula la compra real descontando stock.
          </p>
        </div>

        <label className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", cursor: "pointer", whiteSpace: "nowrap" }}>
          <Upload size={14} />
          Cargar Excel
          <input type="file" hidden accept=".xlsx, .xls" multiple onChange={handleFileUpload} />
        </label>
      </header>

      {/* ── TIP INFO VERDE ── */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" style={{ flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> Puedes subir uno o varios Excel de órdenes de compra (Rappi, etc). Cada Excel se mostrará en su propia tabla. Luego presiona &quot;Calcular Suma Total&quot; para consolidar y finalmente &quot;Verificar vs Stock Total&quot;.
        </p>
      </div>

      {/* ── BADGE: Cantidad de Excel subidos ── */}
      {excelSets.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-lg)", flexWrap: "wrap" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 16px", backgroundColor: "var(--primary)", color: "white", borderRadius: "20px", fontSize: "var(--font-xs)", fontWeight: 800 }}>
            <Layers size={14} />
            {excelSets.length} Excel{excelSets.length > 1 ? "es" : ""} cargado{excelSets.length > 1 ? "s" : ""}
          </div>
          {excelSets.map(s => (
            <span key={s.id} style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", backgroundColor: "var(--secondary)", padding: "4px 10px", borderRadius: "12px", border: "1px solid var(--border)" }}>
              {s.fileName}
            </span>
          ))}
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TABLAS POR CADA EXCEL SUBIDO ──             */}
      {/* ═══════════════════════════════════════════════ */}
      {excelSets.map((excelSet, setIndex) => (
        <div key={excelSet.id} className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--spacing-xl)" }}>

          {/* Header de la tabla del Excel */}
          <div style={{
            padding: "var(--spacing-md) var(--spacing-lg)",
            backgroundColor: "var(--secondary)",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
              <div style={{ width: "28px", height: "28px", borderRadius: "6px", backgroundColor: "var(--primary)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: 800 }}>
                {setIndex + 1}
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: "var(--font-sm)", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px" }}>
                  <FileText size={14} color="var(--primary)" />
                  {excelSet.fileName}
                </h3>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
                  {excelSet.fechaReporte} — {excelSet.data.length} productos
                </p>
              </div>
            </div>
            <button
              onClick={() => removeExcel(excelSet.id)}
              style={{
                background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)",
                borderRadius: "6px", padding: "6px 12px", display: "flex", alignItems: "center",
                gap: "4px", fontSize: "10px", fontWeight: 700, color: "#dc2626", cursor: "pointer",
                transition: "all 0.15s"
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "rgba(239,68,68,0.08)"; }}
            >
              <Trash2 size={12} /> Quitar
            </button>
          </div>

          {/* Tabla con los datos del Excel */}
          <div style={{ overflowX: "auto", maxHeight: "50vh" }}>
            <table className="compact-table" style={{ minWidth: "100%" }}>
              <thead style={{ position: "sticky", top: 0, zIndex: 10 }}>
                <tr>
                  <th style={{ backgroundColor: "var(--secondary)", width: "40px", textAlign: "center" }}>#</th>
                  {excelSet.headers.map((h, i) => h ? (
                    <th key={i} style={{ whiteSpace: "nowrap", backgroundColor: "var(--secondary)", color: "var(--foreground)", textAlign: i === 0 ? "left" : "center" }}>
                      {h}
                    </th>
                  ) : <th key={i}></th>)}
                </tr>
              </thead>
              <tbody>
                {excelSet.data.map((order, rowIndex) => {
                  // Encontrar el índice de la columna DESCRIPCION
                  const descColIndex = excelSet.headers.findIndex(h =>
                    h.toUpperCase().includes("DESCRIPCION")
                  );
                  const descHeaderName = descColIndex !== -1 ? excelSet.headers[descColIndex] : "";

                  return (
                    <tr key={rowIndex}>
                      <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.7rem" }}>{rowIndex + 1}</td>
                      {excelSet.headers.map((h, colIndex) => {
                        if (!h) return <td key={colIndex}></td>;

                        // ✅ CAMBIO 1: Si es la columna DESCRIPCION, mostrar solo nombre limpio
                        const isDescCol = h === descHeaderName && descColIndex !== -1 && colIndex === descColIndex;
                        const cellValue = isDescCol ? order.descripcionLimpia : order.valores[h];

                        return (
                          <td key={colIndex} style={{
                            textAlign: colIndex === 0 ? "left" : "center",
                            fontWeight: colIndex === 0 ? 600 : 400,
                            backgroundColor: h.toUpperCase() === "TOTAL" ? "#fff9f6" : "transparent"
                          }}>
                            {cellValue}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* ── BOTÓN AGREGAR MÁS EXCEL ── */}
      {excelSets.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
          <input ref={addMoreRef} type="file" hidden accept=".xlsx, .xls" multiple onChange={handleFileUpload} />
          <button
            onClick={() => addMoreRef.current?.click()}
            style={{
              padding: "12px 28px", backgroundColor: "white", color: "var(--primary)",
              border: "2px dashed var(--primary)", borderRadius: "var(--radius-md)",
              fontWeight: 800, fontSize: "var(--font-xs)", cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: "8px",
              transition: "all 0.2s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "rgba(255,69,0,0.05)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "white"; }}
          >
            <Plus size={16} /> AGREGAR MÁS EXCEL DE ÓRDENES
          </button>
        </div>
      )}

      {/* ── BOTÓN CALCULAR SUMA TOTAL ── */}
      {excelSets.length > 0 && (
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
          <button
            onClick={calcularSumaTotal}
            className="btn-primary"
            style={{
              padding: "14px 36px", fontSize: "var(--font-sm)", fontWeight: 800,
              display: "inline-flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 14px rgba(255,69,0,0.3)", borderRadius: "var(--radius-md)",
              transition: "transform 0.15s, box-shadow 0.15s"
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,69,0,0.4)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,69,0,0.3)"; }}
          >
            <Calculator size={16} /> CALCULAR SUMA TOTAL DE TODOS LOS EXCEL
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TABLA CONSOLIDADA (Suma por producto) ──    */}
      {/* ═══════════════════════════════════════════════ */}
      {showConsolidated && consolidatedData.length > 0 && (
        <div id="tabla-consolidada" className="card" style={{ padding: 0, overflow: "hidden", marginBottom: "var(--spacing-xl)", borderTop: "4px solid #0f766e" }}>

          {/* Header */}
          <div style={{
            padding: "var(--spacing-md) var(--spacing-lg)",
            backgroundColor: "#f0fdf4",
            borderBottom: "1px solid rgba(22, 163, 74, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
              <Layers size={20} color="#0f766e" />
              <div>
                <h2 style={{ margin: 0, fontSize: "var(--font-lg)", fontWeight: 800, color: "#0f766e" }}>
                  Suma Consolidada de Todos los Excel
                </h2>
                <p style={{ margin: 0, fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
                  {consolidatedData.length} productos únicos agrupados de {excelSets.length} Excel{excelSets.length > 1 ? "es" : ""}
                </p>
              </div>
            </div>
            <span style={{ fontSize: "10px", fontWeight: 800, color: "#0f766e", backgroundColor: "white", padding: "4px 14px", borderRadius: "20px", border: "1px solid rgba(22, 163, 74, 0.3)" }}>
              SUMA INTELIGENTE
            </span>
          </div>

          {/* Tabla consolidada */}
          <div style={{ overflowX: "auto" }}>
            <table className="compact-table" style={{ minWidth: "100%" }}>
              <thead>
                <tr style={{ backgroundColor: "#f0fdf4" }}>
                  <th style={{ width: "40px", textAlign: "center" }}>#</th>
                  <th style={{ minWidth: "180px" }}>Producto</th>
                  {excelSets.map(s => (
                    <th key={s.id} style={{ textAlign: "center", backgroundColor: "#f8fafc", minWidth: "120px" }}>
                      <div style={{ fontSize: "9px", color: "var(--text-muted)", fontWeight: 700, marginBottom: "2px" }}>EXCEL</div>
                      <div style={{ fontSize: "10px", fontWeight: 800, color: "var(--foreground)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "120px" }}>
                        {s.fileName.replace(/\.(xlsx|xls)$/i, '')}
                      </div>
                    </th>
                  ))}
                  <th style={{ textAlign: "center", backgroundColor: "#0f766e", color: "white", minWidth: "100px", fontWeight: 800 }}>
                    TOTAL
                  </th>
                </tr>
              </thead>
              <tbody>
                {consolidatedData.map((row, i) => (
                  <tr key={i}>
                    <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "10px" }}>{i + 1}</td>
                    <td style={{ fontWeight: 700, fontSize: "var(--font-sm)" }}>{row.producto}</td>
                    {excelSets.map(s => {
                      const entry = row.cantidadesPorExcel.find(c => c.excelId === s.id);
                      const cantidad = entry ? entry.cantidad : 0;
                      return (
                        <td key={s.id} style={{
                          textAlign: "center",
                          fontWeight: 600,
                          color: cantidad > 0 ? "var(--foreground)" : "var(--text-muted)",
                          backgroundColor: cantidad > 0 ? "rgba(22, 163, 74, 0.04)" : "transparent",
                          fontSize: "var(--font-sm)"
                        }}>
                          {cantidad > 0 ? cantidad : "—"}
                        </td>
                      );
                    })}
                    <td style={{
                      textAlign: "center", fontWeight: 800,
                      fontSize: "var(--font-base)",
                      color: "#0f766e",
                      backgroundColor: "rgba(15, 118, 110, 0.06)"
                    }}>
                      {row.total}
                    </td>
                  </tr>
                ))}

                {/* Fila TOTAL GENERAL */}
                <tr style={{ backgroundColor: "#111", color: "white" }}>
                  <td colSpan={2} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                    GRAN TOTAL
                  </td>
                  {excelSets.map(s => {
                    const totalExcel = consolidatedData.reduce((sum, row) => {
                      const entry = row.cantidadesPorExcel.find(c => c.excelId === s.id);
                      return sum + (entry ? entry.cantidad : 0);
                    }, 0);
                    return (
                      <td key={s.id} style={{ textAlign: "center", fontWeight: 700, border: "none", color: "#94a3b8", fontSize: "var(--font-sm)" }}>
                        {totalExcel}
                      </td>
                    );
                  })}
                  <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-lg)", border: "none", color: "#ff6b35" }}>
                    {consolidatedData.reduce((sum, r) => sum + r.total, 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Botones debajo de la tabla consolidada */}
          <div className="responsive-flex" style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "var(--secondary)", display: "flex", justifyContent: "flex-end", gap: "var(--spacing-md)", borderTop: "1px solid var(--border)" }}>
            <button className="btn-primary" style={{ backgroundColor: "#333", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }} onClick={analizarStockAcumulado}>
              <Calculator size={14} style={{ marginRight: "var(--spacing-sm)" }} />
              Verificar vs Stock Total
            </button>
            <button className="btn-primary" style={{ display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }} onClick={handleConfirmar}>
              <CheckCircle2 size={14} style={{ marginRight: "var(--spacing-sm)" }} />
              Confirmar Pedido Consolidado
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TABLA VERIFICACIÓN VS STOCK ──              */}
      {/* ═══════════════════════════════════════════════ */}
      {showVerification && (
        <div id="tabla-stock" className="card" style={{ marginTop: "var(--spacing-xl)", borderTop: "4px solid var(--primary)" }}>
          <div style={{ marginBottom: "var(--spacing-md)", display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
            <History size={20} color="var(--primary)" />
            <h2 style={{ fontSize: "var(--font-lg)", margin: 0 }}>Cálculo Basado en Stock Acumulado (Multi-Día)</h2>
          </div>

          <div style={{ padding: "var(--spacing-sm)", backgroundColor: "rgba(255, 69, 0, 0.05)", borderRadius: "var(--radius-sm)", marginBottom: "var(--spacing-md)", display: "flex", flexWrap: "wrap", gap: "var(--spacing-md)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
              <div style={{ width: "10px", height: "10px", backgroundColor: "#f0fdf4", border: "1px solid #16a34a" }}></div> Stock Cubre Todo
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "10px", color: "var(--text-muted)" }}>
              <Info size={10} /> Basado en la suma consolidada de {excelSets.length} Excel{excelSets.length > 1 ? "es" : ""}. El sistema resta todo el stock disponible.
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="compact-table">
              <thead>
                <tr style={{ backgroundColor: "#f3f4f6" }}>
                  <th style={{ width: "40px" }}>#</th>
                  <th>Producto</th>
                  <th>Pedido Total (Suma)</th>
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
                      {row.stockAcumulado > 0 ? `${row.stockAcumulado} ${row.unidad}` : "0"}
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

      {/* ── EMPTY STATE ── */}
      {excelSets.length === 0 && !loading && (
        <div style={{ textAlign: "center", padding: "80px 0", border: "2px dashed var(--border)", borderRadius: "var(--radius-md)" }}>
          <FileSpreadsheet size={48} style={{ marginBottom: "var(--spacing-md)", opacity: 0.1 }} />
          <p style={{ fontSize: "var(--font-sm)", color: "var(--text-muted)", marginBottom: "var(--spacing-sm)" }}>Sube uno o más Excel para comenzar.</p>
          <p style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Puedes cargar varios archivos a la vez o de uno en uno.</p>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>Procesando archivo(s)...</p>
        </div>
      )}

      {/* ══════ MODAL DE CONFIRMACIÓN ══════ */}
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
              El pedido consolidado de {excelSets.length} Excel{excelSets.length > 1 ? "es" : ""} ha sido calculado y enviado exitosamente. Selecciona qué deseas hacer ahora:
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
