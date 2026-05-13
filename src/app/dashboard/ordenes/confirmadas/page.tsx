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
  ArrowRight,
  Clock,
  Layers
} from "lucide-react";
import * as XLSX from "xlsx-js-style";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backent-sierralta.onrender.com';

interface ConfirmedOrder {
  id: string;
  fecha: string;
  excelFiles: string[];
  itemsCount: number;
  totalUnidades: number;
  creadoPor: string;
  items: any[];
  estado: string;
}

export default function HistorialOrdenes() {
  const [role, setRole] = useState<string | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [ordenes, setOrdenes] = useState<ConfirmedOrder[]>([]);

  const syncHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/ordenes`);
      const data = await res.json();
      setOrdenes(data);
    } catch (e) {
      console.error("Sync error:", e);
    }
  };

  useEffect(() => {
    const userRole = localStorage.getItem("user_role")?.toLowerCase();
    setRole(userRole || "trabajador");
    
    syncHistory();
    const interval = setInterval(syncHistory, 5000);

    if (userRole === "encargado") {
      setTimeout(() => setShowNotification(true), 1000);
    }

    return () => clearInterval(interval);
  }, []);

  const exportarExcel = (order: ConfirmedOrder) => {
    const productos = order.items || [];
    const ws_data = [["PRODUCTO", "PEDIDO", "STOCK", "A COMPRAR"]];

    productos.forEach((prod: any) => {
      ws_data.push([prod.nombre, prod.cantidadSolicitada, prod.stockTienda || 0, prod.compraReal || 0]);
    });

    const ws = XLSX.utils.aoa_to_sheet(ws_data);
    const borderStyle = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
    const headerStyle = { fill: { fgColor: { rgb: "FF8C00" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, border: borderStyle, alignment: { vertical: "center", horizontal: "center" } };
    
    const stockStyle = { fill: { fgColor: { rgb: "3b82f6" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, border: borderStyle, alignment: { vertical: "center", horizontal: "center" } };
    const buyStyle = { fill: { fgColor: { rgb: "22c55e" } }, font: { color: { rgb: "FFFFFF" }, bold: true }, border: borderStyle, alignment: { vertical: "center", horizontal: "center" } };

    for (const cellId in ws) {
      if (cellId[0] === '!') continue;
      const rowIdx = parseInt(cellId.match(/\d+/)![0]) - 1;
      const colLetter = cellId.replace(/[0-9]/g, '');
      
      if (rowIdx === 0) {
        ws[cellId].s = headerStyle;
      } else {
        if (colLetter === "C") {
          ws[cellId].s = stockStyle;
        } else if (colLetter === "D") {
          ws[cellId].s = buyStyle;
        } else {
          ws[cellId].s = { border: borderStyle, alignment: { vertical: "center", horizontal: colLetter === "A" ? "left" : "center" } };
        }
      }
    }
    
    ws['!cols'] = [{ wch: 45 }, { wch: 10 }, { wch: 10 }, { wch: 12 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Orden_Compra");
    XLSX.writeFile(wb, `${order.id}_Pedido_Final.xlsx`);
  };

  const exportarPDF = (order: ConfirmedOrder) => {
    const doc = new jsPDF('p', 'pt', 'a4');
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 140, 0);
    doc.text(`ORDEN DE COMPRA: ${order.id}`, 40, 40);
    
    doc.setFontSize(7); doc.setFont("helvetica", "normal"); doc.setTextColor(0, 0, 0);
    doc.text(`Fecha de Emisión: ${order.fecha}`, 40, 55);
    doc.text(`Generado Por: ${order.creadoPor}`, 40, 65);
    doc.text(`Archivos Consolidados: ${order.excelFiles.join(", ")}`, 40, 75);
    
    doc.setLineWidth(1); doc.setDrawColor(255, 140, 0); doc.line(40, 85, 550, 85);

    const tableColumn = ["PRODUCTO", "PEDIDO", "STOCK", "A COMPRAR"];
    const tableRows = (order.items || []).map((prod: any) => [
      prod.nombre, 
      prod.cantidadSolicitada.toString(),
      (prod.stockTienda || 0).toString(),
      (prod.compraReal || 0).toString()
    ]);

    autoTable(doc, {
      head: [tableColumn], body: tableRows, startY: 100, theme: 'grid',
      styles: { fontSize: 7, cellPadding: 2 },
      headStyles: { fillColor: [255, 140, 0], textColor: 255, halign: 'center' },
      columnStyles: { 
        0: { cellWidth: 300 }, 
        1: { halign: 'center', cellWidth: 50 },
        2: { halign: 'center', cellWidth: 50, fillColor: [59, 130, 246], textColor: 255, fontStyle: 'bold' },
        3: { halign: 'center', cellWidth: 60, fillColor: [34, 197, 94], textColor: 255, fontStyle: 'bold' } 
      },
      margin: { top: 30, bottom: 30 }
    });

    doc.save(`${order.id}_Pedido_Sierralta.pdf`);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      {showNotification && (
        <div style={{ backgroundColor: "var(--primary)", color: "white", padding: "16px", borderRadius: "8px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "var(--shadow-lg)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <Bell size={20} />
            <div>
              <p style={{ margin: 0, fontWeight: 800, fontSize: "12px" }}>¡NUEVA ORDEN PROCESADA!</p>
              <p style={{ margin: 0, fontSize: "10px" }}>Una nueva orden consolidada está lista para descargar.</p>
            </div>
          </div>
          <button onClick={() => setShowNotification(false)} style={{ background: "white", color: "var(--primary)", fontSize: "9px", fontWeight: 700, padding: "4px 10px", borderRadius: "4px", border: "none", cursor: "pointer" }}>CERRAR</button>
        </div>
      )}

      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 4px" }}>Historial de Órdenes Finalizadas</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>Auditoría y descargas de los pedidos diarios.</p>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="compact-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ backgroundColor: "var(--secondary)" }}>
                <th style={{ width: "220px" }}>Fecha y Cantidad</th>
                <th>Ordenes Consolidadas (Archivos)</th>
                <th>Generado Por</th>
                <th style={{ width: "280px" }}>Descargas Disponibles</th>
              </tr>
            </thead>
            <tbody>
              {ordenes.length === 0 ? (
                <tr><td colSpan={4} style={{ textAlign: "center", padding: "40px", color: "var(--text-muted)" }}>No hay órdenes confirmadas aún.</td></tr>
              ) : ordenes.map((oc) => (
                <tr key={oc.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                       <Calendar size={16} color="var(--primary)" />
                       <div>
                          <div style={{ fontWeight: 800, fontSize: "12px" }}>{oc.fecha}</div>
                          <div style={{ fontSize: "10px", color: "var(--primary)", fontWeight: 700 }}>
                            <Layers size={10} style={{ display: "inline", marginRight: "4px" }}/>
                            {oc.excelFiles.length} órdenes subidas
                          </div>
                       </div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                      {oc.excelFiles.map((file, idx) => (
                        <span key={idx} style={{ fontSize: "10px", backgroundColor: "#f1f5f9", padding: "2px 8px", borderRadius: "4px", border: "1px solid #e2e8f0", color: "#475569" }}>
                          {file}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, fontSize: "12px" }}>
                      <UserIcon size={14} color="var(--text-muted)" />
                      {oc.creadoPor}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={() => exportarExcel(oc)} className="btn-primary" style={{ padding: "8px 16px", backgroundColor: "#15803d", fontSize: "10px", flex: 1, borderRadius: "6px" }}>
                        <FileSpreadsheet size={14} style={{ marginRight: "6px" }} /> EXCEL
                      </button>
                      <button onClick={() => exportarPDF(oc)} className="btn-primary" style={{ padding: "8px 16px", backgroundColor: "#b91c1c", fontSize: "10px", flex: 1, borderRadius: "6px" }}>
                        <FileText size={14} style={{ marginRight: "6px" }} /> PDF VERTICAL
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
