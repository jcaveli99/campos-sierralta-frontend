"use client";

import { useState } from "react";
import { Package, RefreshCw, TrendingDown, History, Info, AlertTriangle, ShieldCheck } from "lucide-react";

interface StockItem {
  id: string;
  producto: string;
  unidad: string;
  stockAcumulado: number; // Stock total sumado de varios días
  sobranteAyer: number;
  mermaHoy: number;
  ultimaActualizacion: string;
}

export default function Inventario() {
  const [stock, setStock] = useState<StockItem[]>([
    { id: "1", producto: "Platano seda", unidad: "unidad", stockAcumulado: 45, sobranteAyer: 10, mermaHoy: 0, ultimaActualizacion: "2026-03-10 21:00" },
    { id: "2", producto: "Fresa - taper x 500g", unidad: "taper", stockAcumulado: 22, sobranteAyer: 5, mermaHoy: 0, ultimaActualizacion: "2026-03-10 20:30" },
    { id: "3", producto: "Aguaymanto - taper x 250 g", unidad: "taper", stockAcumulado: 15, sobranteAyer: 2, mermaHoy: 0, ultimaActualizacion: "2026-03-10 19:45" },
    { id: "4", producto: "Brócoli - bandeja x 250 g", unidad: "bandeja", stockAcumulado: 30, sobranteAyer: 8, mermaHoy: 0, ultimaActualizacion: "2026-03-10 18:00" },
  ]);

  const registrarMerma = (id: string, cant: number) => {
    setStock(stock.map(item => {
      if (item.id === id) {
        return {
          ...item,
          mermaHoy: item.mermaHoy + cant,
          stockAcumulado: item.stockAcumulado - cant,
          ultimaActualizacion: "Justo ahora"
        };
      }
      return item;
    }));
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "var(--spacing-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-lg)" }}>Control de Stock Acumulado (Total)</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
            Gestión de todos los sobrantes históricos y descuento automático de mermas.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--spacing-sm)" }}>
          <button className="card" style={{ padding: "var(--spacing-sm) var(--spacing-md)", fontSize: "10px", display: "flex", alignItems: "center", gap: "4px" }}>
            <History size={14} /> Ver Historial de Movimientos
          </button>
          <button className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)" }}>
            <RefreshCw size={14} />
            Actualizar Almacén
          </button>
        </div>
      </header>

      {/* Alerta de Stock Consolidado */}
      <div style={{ 
        padding: "var(--spacing-md)", 
        backgroundColor: "#eff6ff", 
        border: "1px solid #bfdbfe", 
        borderRadius: "var(--radius-md)", 
        marginBottom: "var(--spacing-lg)",
        display: "flex",
        alignItems: "center",
        gap: "var(--spacing-md)"
      }}>
        <div style={{ padding: "var(--spacing-sm)", backgroundColor: "#3b82f6", borderRadius: "50%" }}>
          <ShieldCheck size={20} color="white" />
        </div>
        <div>
          <h4 style={{ color: "#1e3a8a", margin: 0, fontSize: "var(--font-sm)" }}>Lógica de Stock Multi-Día Activada</h4>
          <p style={{ color: "#1e40af", fontSize: "var(--font-xs)", margin: 0 }}>
            El sistema está sumando automáticamente todos los productos sobrantes registrados en días anteriores para evitar compras innecesarias.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2.5fr 1fr", gap: "var(--spacing-lg)" }}>
        {/* Tabla de Stock */}
        <div className="card" style={{ padding: 0 }}>
          <table className="compact-table">
            <thead>
              <tr>
                <th style={{ width: "250px" }}>Producto</th>
                <th style={{ textAlign: "center" }}>Stock Total Acumulado</th>
                <th style={{ textAlign: "center" }}>Sobrante Ayer</th>
                <th style={{ textAlign: "center", color: "var(--error)" }}>Merma Hoy</th>
                <th style={{ textAlign: "center" }}>Estado</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((item) => (
                <tr key={item.id}>
                  <td style={{ fontWeight: 600 }}>{item.producto}</td>
                  <td style={{ textAlign: "center", fontWeight: 800, color: "var(--primary)", backgroundColor: "rgba(255, 69, 0, 0.05)", fontSize: "var(--font-base)" }}>
                    {item.stockAcumulado} {item.unidad}
                  </td>
                  <td style={{ textAlign: "center", fontStyle: "italic", color: "var(--text-muted)" }}>
                    {item.sobranteAyer}
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 600, color: "var(--error)" }}>
                    {item.mermaHoy > 0 ? `-${item.mermaHoy}` : "0"}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <span style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "10px", backgroundColor: "#f3f4f6" }}>
                      Actualizado: {item.ultimaActualizacion}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Panel de Registro de Merma Rápida */}
        <div className="card" style={{ borderTop: "4px solid var(--error)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", marginBottom: "var(--spacing-md)" }}>
            <AlertTriangle size={18} color="var(--error)" />
            <h3 style={{ fontSize: "var(--font-sm)", margin: 0 }}>Reportar Merma Crítica</h3>
          </div>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
            <div>
              <label style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>Seleccionar Producto</label>
              <select style={{ marginTop: "4px" }}>
                {stock.map(s => <option key={s.id}>{s.producto}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>Cantidad Dañada</label>
              <input type="number" placeholder="Ej: 5" style={{ marginTop: "4px" }} />
            </div>
            <div>
              <label style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>Causa</label>
              <select style={{ marginTop: "4px" }}>
                <option>Maduración Excesiva</option>
                <option>Daño por Transporte</option>
                <option>Mal Estado (Proveedor)</option>
                <option>Otros</option>
              </select>
            </div>
            <button className="btn-primary" 
              style={{ backgroundColor: "var(--error)", padding: "var(--spacing-md)" }}
              onClick={() => alert("Merma registrada. El stock acumulado se descontará automáticamente.")}
            >
              <TrendingDown size={14} style={{ marginRight: "8px" }} />
              Descontar de Stock Total
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
