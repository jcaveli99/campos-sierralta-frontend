"use client";

import { useState, useEffect } from "react";
import { 
  Calendar,
  Users,
  Search,
  ShoppingCart,
  Image as ImageIcon,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  X,
  Plus
} from "lucide-react";

interface Producto {
  id: string;
  nombre: string;
}

interface Trabajador {
  id: string;
  nombre: string;
  productosAsignados: string[]; // IDs de productos
}

interface CompraItemResumen {
  id: string;
  nombreProducto: string;
  cantidadComprada: number;
  unidadMedida: string;
  costoTotal: number;
  esAdicional: boolean;
  fotoUrl: string; // URL simulada
}

export default function AsignacionesYBoletas() {
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split("T")[0]);
  const [role, setRole] = useState<string | null>(null);
  
  // Productos extraídos de la Orden de Compra diaria (Simulación)
  const [productosCatalogo, setProductosCatalogo] = useState<Producto[]>([
    { id: "p1", nombre: "Fresa Nacional" },
    { id: "p2", nombre: "Plátano Seda" },
    { id: "p3", nombre: "Papaya Extra" },
    { id: "p4", nombre: "Piña Golden" },
    { id: "p5", nombre: "Tomate Especial" },
    { id: "p6", nombre: "Cebolla Roja" },
  ]);

  const [trabajadores, setTrabajadores] = useState<Trabajador[]>([
    { id: "t1", nombre: "Juanito Pérez (Trabajador 1)", productosAsignados: ["p1", "p2", "p3"] },
    { id: "t2", nombre: "Pepito Díaz (Trabajador 2)", productosAsignados: ["p4", "p5", "p6"] },
  ]);

  // Simulación de los registros de compras que subieron hoy
  const comprasDelDia: Record<string, CompraItemResumen[]> = {
    "t1": [
      { id: "c1", nombreProducto: "Fresa Nacional", cantidadComprada: 12, unidadMedida: "CAJA", costoTotal: 250, esAdicional: false, fotoUrl: "https://images.unsplash.com/photo-1590664095641-7fa05f689813?w=300" },
      { id: "c2", nombreProducto: "Granadilla Malla", cantidadComprada: 5, unidadMedida: "MALLA", costoTotal: 40, esAdicional: true, fotoUrl: "https://images.unsplash.com/photo-1550828520-4cb496926fc9?w=300" }, // Adicional fuera de orden
    ],
    "t2": [
      { id: "c3", nombreProducto: "Tomate Especial", cantidadComprada: 30, unidadMedida: "KG", costoTotal: 90, esAdicional: false, fotoUrl: "https://images.unsplash.com/photo-1601646761273-df267aa7945d?w=300" },
    ]
  };

  const [expandedTrabajador, setExpandedTrabajador] = useState<string | null>("t1");
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  
  // UI States para el selector de asignación
  const [isAssigning, setIsAssigning] = useState<string | null>(null);
  const [nuevoProductoId, setNuevoProductoId] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("user_role") || "supervisor");
  }, []);

  const handleAsignar = (trabajadorId: string) => {
    if (!nuevoProductoId) return;
    
    setTrabajadores(trabajadores.map(t => {
      if (t.id === trabajadorId && !t.productosAsignados.includes(nuevoProductoId)) {
        return { ...t, productosAsignados: [...t.productosAsignados, nuevoProductoId] };
      }
      return t;
    }));
    setNuevoProductoId("");
    setIsAssigning(null);
  };

  const handleDesasignar = (trabajadorId: string, prodId: string) => {
    setTrabajadores(trabajadores.map(t => {
      if (t.id === trabajadorId) {
        return { ...t, productosAsignados: t.productosAsignados.filter(p => p !== prodId) };
      }
      return t;
    }));
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px" }}>
      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800 }}>Asignaciones y Verificación de Boletas</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)" }}>
            Módulo de Supervisor: Gestiona el catálogo de quién compra qué, verifica las unidades físicas, costos, adiciones de hoy y audita fotos de boletas.
          </p>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", backgroundColor: "white", padding: "8px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", boxShadow: "var(--shadow-sm)" }}>
          <Calendar size={18} color="var(--primary)" />
          <input 
            type="date" 
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            style={{ border: "none", outline: "none", fontWeight: 700, color: "var(--foreground)" }}
            max={new Date().toISOString().split("T")[0]}
          />
        </div>
      </header>

      {/* SECCIÓN 1: PANEL DE TRABAJADORES (Layout de Despliegue) */}
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-lg)" }}>
        {trabajadores.map((t) => (
          <div key={t.id} className="card" style={{ padding: 0, overflow: "hidden", border: expandedTrabajador === t.id ? "2px solid var(--primary)" : "1px solid var(--border)" }}>
            
            {/* Header del Trabajador (Clickeable) */}
            <div 
              onClick={() => setExpandedTrabajador(expandedTrabajador === t.id ? null : t.id)}
              style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: expandedTrabajador === t.id ? "#f3f4f6" : "white", display: "flex", alignItems: "center", justifyContent: "space-between", cursor: "pointer" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "var(--secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Users size={20} color="var(--primary)" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "var(--font-lg)", fontWeight: 800 }}>{t.nombre}</h3>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>
                    {t.productosAsignados.length} Productos Asignados para comprar hoy.
                  </span>
                </div>
              </div>
              <div>
                {expandedTrabajador === t.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {/* Contenido Desplegable: Panel de Supervisor del Trabajador */}
            {expandedTrabajador === t.id && (
              <div style={{ padding: "var(--spacing-lg)", borderTop: "1px solid var(--border)" }}>
                
                {/* 1. SECCIÓN ASIGNACIÓN DE PRODUCTOS */}
                <div style={{ marginBottom: "var(--spacing-xl)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-sm)" }}>
                    <h4 style={{ margin: 0, fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Asignación de Compras</h4>
                    {isAssigning !== t.id && (
                      <button onClick={() => setIsAssigning(t.id)} className="btn-secondary" style={{ padding: "4px 10px", fontSize: "10px" }}>
                        <Plus size={12} style={{ marginRight: "4px" }} /> AGREGAR / REASIGNAR PRODUCTO
                      </button>
                    )}
                  </div>

                  {/* UI de Tags de Productos Asignados */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", alignItems: "center" }}>
                    {t.productosAsignados.map(prodId => {
                      const prod = productosCatalogo.find(p => p.id === prodId);
                      return (
                        <div key={prodId} style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 12px", backgroundColor: "#eef2ff", borderRadius: "20px", border: "1px solid #c7d2fe", fontSize: "12px", fontWeight: 600, color: "#3730a3" }}>
                          {prod?.nombre || "Producto Desconocido"}
                          <X size={14} style={{ cursor: "pointer", opacity: 0.5 }} onClick={() => handleDesasignar(t.id, prodId)} />
                        </div>
                      )
                    })}
                    {t.productosAsignados.length === 0 && <span style={{ fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic" }}>Sin productos asignados aún.</span>}
                  </div>

                  {/* Desplegable Modo Asignación */}
                  {isAssigning === t.id && (
                    <div style={{ marginTop: "12px", display: "flex", gap: "8px", alignItems: "center", padding: "10px", backgroundColor: "#f9fafb", borderRadius: "var(--radius-sm)", border: "1px dashed #d1d5db" }}>
                       <select 
                        value={nuevoProductoId} 
                        onChange={(e) => setNuevoProductoId(e.target.value)}
                        style={{ flex: 1, padding: "8px", borderRadius: "4px", border: "1px solid var(--border)", fontSize: "12px" }}
                       >
                         <option value="">-- Seleccionar Producto del Catálogo de la Orden --</option>
                         {productosCatalogo
                            .filter(p => !t.productosAsignados.includes(p.id))
                            .map(p => (
                           <option key={p.id} value={p.id}>{p.nombre}</option>
                         ))}
                       </select>
                       <button onClick={() => handleAsignar(t.id)} className="btn-primary" style={{ padding: "8px 16px", fontSize: "11px", height: "auto" }}>
                          GUARDAR ASIGNACIÓN
                       </button>
                       <X size={20} color="#9ca3af" style={{ cursor: "pointer", marginLeft: "4px" }} onClick={() => setIsAssigning(null)} />
                    </div>
                  )}
                </div>

                {/* 2. SECCIÓN TABLA DE AUDITORÍA (COMPRAS Y BOLETAS) */}
                <div>
                  <h4 style={{ margin: "0 0 var(--spacing-md) 0", fontSize: "12px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    Información Registrada ({fecha})
                  </h4>
                  
                  {comprasDelDia[t.id]?.length > 0 ? (
                    <div style={{ overflowX: "auto" }}>
                      <table className="compact-table" style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)" }}>
                        <thead>
                          <tr style={{ backgroundColor: "var(--secondary)" }}>
                            <th>Producto Comprado</th>
                            <th style={{ textAlign: "center" }}>Tipo/Aviso</th>
                            <th style={{ textAlign: "center" }}>Cantidad Fís.</th>
                            <th>Presentación Real</th>
                            <th>Total S/ Extraído</th>
                            <th style={{ textAlign: "center", width: "120px" }}>Documento</th>
                          </tr>
                        </thead>
                        <tbody>
                          {comprasDelDia[t.id].map(compra => (
                            <tr key={compra.id}>
                              <td style={{ fontWeight: 600 }}>{compra.nombreProducto}</td>
                              <td style={{ textAlign: "center" }}>
                                {compra.esAdicional ? (
                                  <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(220, 38, 38, 0.1)", color: "#dc2626", borderRadius: "4px", fontWeight: 800 }}>
                                    ADICIONAL EXTRA
                                  </span>
                                ) : (
                                  <span style={{ fontSize: "9px", padding: "2px 6px", background: "rgba(22, 163, 74, 0.1)", color: "#16a34a", borderRadius: "4px", fontWeight: 800 }}>
                                    EN ORDEN
                                  </span>
                                )}
                              </td>
                              <td style={{ textAlign: "center", fontWeight: 800, fontSize: "14px" }}>{compra.cantidadComprada}</td>
                              <td style={{ fontWeight: 600, color: "var(--primary)" }}>{compra.unidadMedida}</td>
                              <td style={{ fontWeight: 700 }}>S/ {compra.costoTotal.toFixed(2)}</td>
                              <td style={{ textAlign: "center" }}>
                                <button 
                                  onClick={() => setSelectedPhoto(compra.fotoUrl)}
                                  style={{ padding: "4px 8px", backgroundColor: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "4px", display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "10px", fontWeight: 700, cursor: "pointer", color: "#374151" }}
                                >
                                  <ImageIcon size={12} color="var(--primary)" /> VER BOLETA
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div style={{ padding: "30px", textAlign: "center", border: "1px dashed var(--border)", borderRadius: "var(--radius-sm)", color: "var(--text-muted)", fontSize: "13px" }}>
                      El trabajador no ha subido información de boletas/compras para este día.
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        ))}
      </div>

      {/* MODAL PARA VER FOTO DE BOLETA */}
      {selectedPhoto && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center",
          padding: "var(--spacing-xl)"
        }}>
          <div style={{ position: "relative", backgroundColor: "white", padding: "var(--spacing-md)", borderRadius: "var(--radius-md)", maxWidth: "100%", maxHeight: "100%", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
              <h3 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>Auditoría de Documento (Agrupado por Proveedor / Producto)</h3>
              <X size={24} style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setSelectedPhoto(null)} />
            </div>
            <div style={{ flex: 1, overflow: "auto", display: "flex", justifyContent: "center" }}>
              <img src={selectedPhoto} alt="Boleta Subida" style={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", border: "1px solid var(--border)" }} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
