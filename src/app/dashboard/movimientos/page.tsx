"use client";

import { useState } from "react";
import { Camera, AlertCircle, Save, Plus, Trash2 } from "lucide-react";

interface ProductRecord {
  id: string;
  nombre: string;
  cantidadSolicitada: number;
  cantidadComprada: number;
  unidad: string;
  costo: number;
  fotos: string[];
}

export default function RegistroCompras() {
  const [items, setItems] = useState<ProductRecord[]>([
    { id: "1", nombre: "Platano seda", cantidadSolicitada: 159, cantidadComprada: 0, unidad: "unidad", costo: 0, fotos: [] },
    { id: "2", nombre: "Fresa - taper x 500g", cantidadSolicitada: 62, cantidadComprada: 0, unidad: "taper", costo: 0, fotos: [] },
  ]);

  const updateItem = (id: string, field: keyof ProductRecord, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const addPhoto = (id: string) => {
    const item = items.find(i => i.id === id);
    if (item && item.fotos.length < 6) {
      const newPhoto = `https://via.placeholder.com/150?text=Boleta+${item.fotos.length + 1}`;
      updateItem(id, 'fotos', [...item.fotos, newPhoto]);
    } else if (item?.fotos.length === 6) {
      alert("Máximo 6 fotos por producto permitido.");
    }
  };

  const handleSave = () => {
    const incomplete = items.some(item => item.fotos.length === 0 || item.cantidadComprada === 0 || item.costo === 0);
    if (incomplete) {
      alert("Error: Falta completar campos obligatorios o subir la foto de la boleta para algunos productos.");
      return;
    }
    alert("Información guardada correctamente.");
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <header style={{ marginBottom: "var(--spacing-lg)" }}>
        <h1 style={{ fontSize: "var(--font-lg)" }}>Registro Diario de Compras</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
          Ingresa las cantidades reales recogidas del proveedor y sube las boletas correspondientes.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
        {items.map((item) => (
          <div key={item.id} className="card" style={{ 
            borderLeft: item.cantidadComprada > item.cantidadSolicitada ? "4px solid var(--primary)" : "1px solid var(--border)",
            padding: "var(--spacing-md)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--spacing-md)" }}>
              <div>
                <h3 style={{ fontSize: "var(--font-base)", marginBottom: 0 }}>{item.nombre}</h3>
                <p style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>Solicitado: {item.cantidadSolicitada} {item.unidad}</p>
              </div>
              {item.cantidadComprada > item.cantidadSolicitada && (
                <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-xs)", color: "var(--primary)", fontSize: "var(--font-xs)", fontWeight: 600 }}>
                  <AlertCircle size={14} />
                  COMPRA EN EXCESO (+{item.cantidadComprada - item.cantidadSolicitada})
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>Cantidad Recogida</label>
                <input 
                  type="number" 
                  value={item.cantidadComprada || ""} 
                  onChange={(e) => updateItem(item.id, 'cantidadComprada', Number(e.target.value))}
                  style={{ borderColor: item.cantidadComprada > item.cantidadSolicitada ? "var(--primary)" : "var(--border)" }}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>Costo Unitario (S/)</label>
                <input 
                  type="number" 
                  step="0.01" 
                  value={item.costo || ""} 
                  onChange={(e) => updateItem(item.id, 'costo', Number(e.target.value))}
                />
              </div>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 600 }}>Total Pagado</label>
                <div style={{ padding: "var(--spacing-sm)", backgroundColor: "var(--secondary)", borderRadius: "var(--radius-sm)", fontSize: "var(--font-sm)", fontWeight: 600 }}>
                  S/ {(item.cantidadComprada * item.costo).toFixed(2)}
                </div>
              </div>
            </div>

            {item.cantidadComprada > item.cantidadSolicitada && (
              <div style={{ marginBottom: "var(--spacing-md)" }}>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 600, color: "var(--primary)" }}>Justificación de Exceso</label>
                <textarea 
                  placeholder="Explique por qué se compró más de lo solicitado..." 
                  style={{ fontSize: "var(--font-xs)", height: "40px", resize: "none" }}
                />
              </div>
            )}

            <div>
              <p style={{ fontSize: "var(--font-xs)", fontWeight: 600, marginBottom: "var(--spacing-sm)" }}>
                Boletas / Fotos ({item.fotos.length}/6)
              </p>
              <div style={{ display: "flex", gap: "var(--spacing-sm)", flexWrap: "wrap" }}>
                {item.fotos.map((foto, index) => (
                  <div key={index} style={{ position: "relative", width: "60px", height: "60px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
                    <img src={foto} alt="Boleta" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <button 
                      onClick={() => updateItem(item.id, 'fotos', item.fotos.filter((_, i) => i !== index))}
                      style={{ position: "absolute", top: 0, right: 0, background: "rgba(220, 38, 38, 0.8)", color: "white", padding: "2px", border: "none" }}
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                ))}
                {item.fotos.length < 6 && (
                  <button 
                    onClick={() => addPhoto(item.id)}
                    style={{ 
                      width: "60px", 
                      height: "60px", 
                      border: "1px dashed var(--primary)", 
                      borderRadius: "var(--radius-sm)", 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center", 
                      justifyContent: "center",
                      color: "var(--primary)",
                      fontSize: "10px",
                      background: "white"
                    }}
                  >
                    <Camera size={16} />
                    Tomar Foto
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: "var(--spacing-xl)", display: "flex", justifyContent: "flex-end", gap: "var(--spacing-md)" }}>
        <button className="btn-primary" style={{ backgroundColor: "#333" }}>
          <Plus size={14} style={{ marginRight: "var(--spacing-sm)" }} />
          Agregar Producto Manual
        </button>
        <button className="btn-primary" onClick={handleSave}>
          <Save size={14} style={{ marginRight: "var(--spacing-sm)" }} />
          Guardar Todo y Sincronizar
        </button>
      </div>
    </div>
  );
}
