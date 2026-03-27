"use client";

import { useState, useEffect } from "react";
import { 
  FileSpreadsheet, 
  FileText, 
  Calendar, 
  User as UserIcon, 
  Eye,
  Filter,
  Bell,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Hand,
  ArrowRight
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import "jspdf-autotable";

interface ConfirmedOrder {
  id: string;
  fecha: string;
  itemsCount: number;
  tiendasCount: number;
  totalUnidades: number;
  creadoPor: string;
  estado: "CONFIRMADA" | "EN_MERCADO" | "COMPLETADA";
}

export default function HistorialOrdenes() {
  const [role, setRole] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  
  const [ordenes] = useState<ConfirmedOrder[]>([
    { 
      id: "OC-20260310-01", 
      fecha: "SABADO 07 MARZO", 
      itemsCount: 86, 
      tiendasCount: 9, 
      totalUnidades: 450, 
      creadoPor: "Dueño Principal",
      estado: "EN_MERCADO"
    }
  ]);

  useEffect(() => {
    const userRole = localStorage.getItem("user_role");
    setRole(userRole);
    
    // Simular notificación para Encargado de Tienda
    if (userRole === "encargado") {
      setTimeout(() => setShowNotification(true), 1000);
    }
  }, []);

  const exportarExcel = (id: string) => {
    // Intentar recuperar el Raw Data completo preservado
    const fullRawData = localStorage.getItem("orden_compra_full_raw");
    
    if (fullRawData) {
      const ws_data: any[][] = JSON.parse(fullRawData);
      const ws = XLSX.utils.aoa_to_sheet(ws_data);
      
      // Estilo de bordes para todas las celdas
      const borderStyle = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" }
      };

      const headerStyle = {
        fill: { fgColor: { rgb: "FF8C00" } }, // Naranja (DarkOrange)
        font: { color: { rgb: "FFFFFF" }, bold: true },
        border: borderStyle,
        alignment: { vertical: "center", horizontal: "center", wrapText: true }
      };

      const bodyStyle = {
        border: borderStyle,
        alignment: { vertical: "center", wrapText: true }
      };

      // Identificar el índice de la cabecera (usualmente donde está 'DESCRIPCION')
      let headerIdx = -1;
      ws_data.forEach((row, idx) => {
        if (row && row.some(cell => String(cell).toUpperCase().includes("DESCRIPCION"))) {
          headerIdx = idx;
        }
      });

      // Aplicar estilos a todas las celdas
      for (const cellId in ws) {
        if (cellId[0] === '!') continue;
        const cell = ws[cellId];
        const rowIdx = parseInt(cellId.substring(1)) - 1;

        if (rowIdx === headerIdx) {
          cell.s = headerStyle;
        } else {
          cell.s = bodyStyle;
        }
      }
      
      // Auto-ajuste de columnas dinámico (ancho mínimo según contenido, con tope para wrap)
      const colWidths = ws_data[0] ? ws_data[0].map((_, colIdx) => {
        let maxLen = 0;
        ws_data.forEach(row => {
          const cellValue = row[colIdx] != null ? String(row[colIdx]) : "";
          if (cellValue.length > maxLen) maxLen = cellValue.length;
        });
        // Limitamos el ancho para que el wrapText tenga sentido en descripciones largas
        const finalWidth = Math.min(Math.max(maxLen + 2, 10), 40);
        return { wch: finalWidth };
      }) : [];
      ws['!cols'] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Orden_Compra");
      XLSX.writeFile(wb, `${id}_Reporte_Premium.xlsx`);
      return;
    }

    // Fallback: Lógica anterior si no hay raw data (para órdenes antiguas)
    const savedData = localStorage.getItem("orden_compra_actual");
    const productosCalculados = savedData ? JSON.parse(savedData) : [];

    if (productosCalculados.length === 0) {
      alert("No hay productos en esta orden de compra.");
      return;
    }

    const ws_data = [
      ["DESCRIPCION", "CANTIDAD", "UND. MEDIDA", "TIENDA A", "TIENDA B", "TIENDA C", "TOTAL SOLICITADO", "TOTAL CALCULADO COMPRA"]
    ];

    productosCalculados.forEach((prod: any) => {
      ws_data.push([
        prod.nombre, "", prod.unidadVenta, "", "", "", prod.cantidadSolicitada, prod.cantidadSolicitada
      ]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orden_Compra");
    XLSX.writeFile(wb, `${id}_Export.xlsx`);
  };

  const exportarPDF = (id: string) => {
    // Intentar recuperar el Raw Data completo preservado
    const fullRawData = localStorage.getItem("orden_compra_full_raw");
    const doc = new jsPDF('p', 'pt', 'a4');
    
    // Título y Encabezado
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(`ORDEN DE COMPRA: ${id}`, 40, 50);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 40, 70);
    doc.text(`Generado Por: ${role === 'dueño' ? 'Dueño Principal' : 'Supervisor'}`, 40, 85);
    
    doc.setLineWidth(1);
    doc.line(40, 95, 550, 95);

    if (fullRawData) {
      const ws_data: any[][] = JSON.parse(fullRawData);
      
      // Identificar cabecera
      let headerIdx = ws_data.findIndex(row => 
        row && row.some(cell => String(cell).toUpperCase().includes("DESCRIPCION"))
      );
      
      if (headerIdx !== -1) {
        const tableColumn = ws_data[headerIdx].map(h => String(h || ""));
        const tableRows = ws_data.slice(headerIdx + 1);

        (doc as any).autoTable({
          head: [tableColumn],
          body: tableRows,
          startY: 110,
          theme: 'grid',
          styles: { fontSize: 7, font: 'helvetica', cellPadding: 3 },
          headStyles: { 
            fillColor: [255, 140, 0], // Naranja premium
            textColor: 255, 
            fontStyle: 'bold', 
            halign: 'center' 
          },
          alternateRowStyles: { fillColor: [249, 250, 251] },
        });

        doc.save(`${id}_Reporte_Premium.pdf`);
        return;
      }
    }

    // Fallback: Lógica anterior si no hay raw data
    const savedData = localStorage.getItem("orden_compra_actual");
    const productosCalculados = savedData ? JSON.parse(savedData) : [];

    if (productosCalculados.length === 0) {
      doc.text("No hay datos de compra para mostrar.", 40, 115);
      doc.save(`${id}_Vertical.pdf`);
      return;
    }

    const tableColumn = ["#", "Producto", "Unidad", "Total a Comprar (Calculado)"];
    const tableRows = productosCalculados.map((prod: any, index: number) => [
      index + 1, prod.nombre, prod.unidadVenta, prod.cantidadSolicitada.toString()
    ]);

    (doc as any).autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: 110,
      theme: 'grid',
      styles: { fontSize: 9, font: 'helvetica' },
      headStyles: { fillColor: [255, 140, 0], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [249, 250, 251] }
    });

    doc.save(`${id}_Vertical.pdf`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      {/* NOTIFICACIÓN SIMULADA */}
      {showNotification && (
        <div style={{ 
          backgroundColor: "var(--primary)", 
          color: "white", 
          padding: "var(--spacing-md)", 
          borderRadius: "var(--radius-md)", 
          marginBottom: "var(--spacing-lg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          animation: "slideDown 0.5s ease-out",
          boxShadow: "var(--shadow-lg)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
            <Bell size={20} className="animate-bounce" />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "var(--font-xs)" }}>¡ORDEN DISPONIBLE!</p>
              <p style={{ margin: 0, fontSize: "10px" }}>La orden de compra del 07 de Marzo ya ha sido procesada por el Dueño.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowNotification(false)}
            style={{ background: "white", color: "var(--primary)", fontSize: "9px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px" }}
          >
            ENTENDIDO
          </button>
        </div>
      )}

      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
           MENU <ChevronRight size={10} /> <span style={{ color: "var(--foreground)" }}>HISTORIAL Y DESCARGAS</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800 }}>Órdenes de Compra Finalizadas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>
          {role === "encargado" ? "Como Encargado, puedes descargar las órdenes para tu gestión en tienda." : "Control total de auditoría para Dueño y Supervisor."}
        </p>
      </header>

      {/* Tip Info Verde */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
           <strong>Importante:</strong> Aquí se almacenan las órdenes procesadas. Descarga el Excel para llevar al mercado, o el PDF Vertical para agilizar el armado en turno de noche.
        </p>
      </div>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div className="mobile-scroll-hint" style={{ marginTop: "12px", marginRight: "12px" }}>
          <Hand size={14} /> <span>Desliza la tabla para ver más</span> <ArrowRight size={14} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="compact-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--secondary)" }}>
                <th style={{ width: "150px" }}>Código OC</th>
                <th>Fecha del Reporte</th>
                <th style={{ textAlign: "center" }}>Prod.</th>
                <th style={{ textAlign: "center" }}>Total Unid.</th>
                <th>Generado Por</th>
                <th style={{ textAlign: "center" }}>Estado</th>
                <th style={{ width: "240px" }}>Descargas Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.map((oc) => (
                <tr key={oc.id}>
                  <td style={{ fontWeight: 700, color: "var(--primary)" }}>{oc.id}</td>
                  <td style={{ fontWeight: 600 }}>{oc.fecha}</td>
                  <td style={{ textAlign: "center" }}>{oc.itemsCount}</td>
                  <td style={{ textAlign: "center", fontWeight: 700 }}>{oc.totalUnidades}</td>
                  <td>{oc.creadoPor}</td>
                  <td style={{ textAlign: "center" }}>
                     <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", background: "rgba(255, 69, 0, 0.1)", color: "var(--primary)", fontWeight: 700 }}>{oc.estado}</span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button 
                        onClick={() => exportarExcel(oc.id)}
                        className="btn-primary"
                        style={{ padding: "6px 12px", backgroundColor: "#1d6f42", fontSize: "9px", flex: 1 }}
                      >
                        <FileSpreadsheet size={12} style={{ marginRight: "4px" }} /> EXCEL
                      </button>
                      <button 
                        onClick={() => exportarPDF(oc.id)}
                        className="btn-primary"
                        style={{ padding: "6px 12px", backgroundColor: "#c43e1c", fontSize: "9px", flex: 1 }}
                      >
                        <FileText size={12} style={{ marginRight: "4px" }} /> PDF VERTICAL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
