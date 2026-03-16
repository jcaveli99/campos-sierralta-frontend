"use client";

import { useState, useEffect } from "react";
import { 
  Camera, 
  Search,
  Clock,
  Plus,
  CheckCircle2,
  Lock,
  X,
  Save,
  Trash2
} from "lucide-react";

interface ProductRecord {
  id: string;
  nombre: string;
  cantidadSolicitada: number;
  unidadVenta: string; 
  unidadCompra: string;
  cantidadComprada: number; 
  costoUnitario: number; // NUEVO: Costo por unidad de compra
  montoTotal: number;    // Calculado
  proveedor: string;
  fotos: string[];
  esAdicional: boolean;
  // Acciones individuales
  merma: string;
  sobrante: string;
  devueltoProveedor: string;
  devueltoCliente: string;
}

const PROVEEDORES_SIMULADOS = [
  { id: "prov1", nombre: "Proveedor Principal SAC" },
  { id: "prov2", nombre: "Mercado Central - Puesto 15" },
  { id: "prov3", nombre: "Agro Sur SRL" },
  { id: "prov4", nombre: "Distribuidora El Sol" },
];

export default function RegistroCompras() {
  const [allItems, setAllItems] = useState<ProductRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [fechaFiltro, setFechaFiltro] = useState<string>(new Date().toISOString().split("T")[0]);

  // Modales y Controladores de Estado
  const [isLockedPhase, setIsLockedPhase] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdicional, setNewAdicional] = useState({ nombre: "", cantidad: 0, unidadCompra: "KG", costoUnitario: 0, proveedor: "" });
  
  // Estado para los modales de acción (Sobrante, Merma, Devoluciones)
  const [activeActionModal, setActiveActionModal] = useState<{
    itemId: string;
    productName: string;
    actionType: 'merma' | 'sobrante' | 'devueltoProveedor' | 'devueltoCliente';
    title: string;
    currentValue: string;
  } | null>(null);

  useEffect(() => {
    const currentRole = localStorage.getItem("user_role") || "trabajador";
    setRole(currentRole);
    
    // Cargar Catálogo (Simulado)
    const savedData = localStorage.getItem("orden_compra_actual");
    if (savedData) {
      const parsed = JSON.parse(savedData);
      const formattedItems = parsed.map((p: any) => ({
        ...p,
        unidadCompra: p.nombre.toLowerCase().includes("brócoli") ? "KG" : 
                      p.nombre.toLowerCase().includes("papaya") ? "CAJAS" : "UNIDAD",
        cantidadComprada: 0,
        costoUnitario: 0,
        montoTotal: 0,
        proveedor: "",
        fotos: [],
        esAdicional: false,
        merma: "",
        sobrante: "",
        devueltoProveedor: "",
        devueltoCliente: ""
      }));
      setAllItems(formattedItems);
    } else {
      // Data dummy si no hay orden
      setAllItems([
        { id: "1", nombre: "PLATANO", cantidadSolicitada: 50, unidadVenta: "KG", unidadCompra: "KG", cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false, merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: "" },
        { id: "2", nombre: "FRESA", cantidadSolicitada: 20, unidadVenta: "KG", unidadCompra: "KG", cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false, merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: "" }
      ]);
    }
    setLoading(false);

    // Calcular Tiempo
    const checkTime = () => {
      const now = new Date();
      const limite = new Date();
      limite.setHours(17, 0, 0, 0); // 5:00 PM
      
      if (now > limite) {
        setIsLockedPhase(true);
        setTimeRemaining("Tiempo Excedido (5:00 PM Límite)");
      } else {
        const diff = limite.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`Quedan ${hours}h ${minutes}m`);
      }
    };
    checkTime();
    const interval = setInterval(checkTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const updateItem = (id: string, field: keyof ProductRecord, value: any) => {
    setAllItems(allItems.map(item => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      
      // Auto-calcular Monto Total
      if (field === "cantidadComprada" || field === "costoUnitario") {
        updatedItem.montoTotal = parseFloat((updatedItem.cantidadComprada * updatedItem.costoUnitario).toFixed(2));
      }
      return updatedItem;
    }));
  };

  const addPhoto = (id: string) => {
    const item = allItems.find(i => i.id === id);
    if (!item) return;
    if (item.fotos.length >= 6) {
      alert("Límite de 6 fotos alcanzado.");
      return;
    }
    const newPhoto = `https://images.unsplash.com/photo-1590664095641-7fa05f689813?auto=format&fit=crop&w=150&q=80`;
    updateItem(id, 'fotos', [...item.fotos, newPhoto]);
  };

  const removePhoto = (id: string, indexToRemove: number) => {
    const item = allItems.find(i => i.id === id);
    if (!item) return;
    const newFotos = item.fotos.filter((_, index) => index !== indexToRemove);
    updateItem(id, 'fotos', newFotos);
  };

  const agregarAdicional = () => {
    if (!newAdicional.nombre) return;
    const item: ProductRecord = {
      id: `ext-${Math.random()}`,
      nombre: newAdicional.nombre.toUpperCase(),
      cantidadSolicitada: 0,
      unidadVenta: newAdicional.unidadCompra,
      unidadCompra: newAdicional.unidadCompra,
      cantidadComprada: newAdicional.cantidad,
      costoUnitario: newAdicional.costoUnitario,
      montoTotal: parseFloat((newAdicional.cantidad * newAdicional.costoUnitario).toFixed(2)),
      proveedor: newAdicional.proveedor,
      fotos: [],
      esAdicional: true,
      merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: ""
    };
    setAllItems([...allItems, item]);
    setShowAddModal(false);
    setNewAdicional({ nombre: "", cantidad: 0, unidadCompra: "KG", costoUnitario: 0, proveedor: "" });
  };

  const openActionModal = (item: ProductRecord, actionType: 'merma' | 'sobrante' | 'devueltoProveedor' | 'devueltoCliente') => {
    const titles = {
      merma: "Descuento por Merma",
      sobrante: "Inventario Sobrante (Stock)",
      devueltoProveedor: "Devolución a Proveedor",
      devueltoCliente: "Devolución de Cliente"
    };
    
    setActiveActionModal({
      itemId: item.id,
      productName: item.nombre,
      actionType,
      title: titles[actionType],
      currentValue: item[actionType] as string
    });
  };

  const saveActionModal = () => {
    if (activeActionModal) {
      updateItem(activeActionModal.itemId, activeActionModal.actionType, activeActionModal.currentValue);
      setActiveActionModal(null);
    }
  };

  const validarYGuardar = () => {
    const itemsComprados = allItems.filter(i => i.cantidadComprada > 0);
    if (itemsComprados.length === 0) {
      alert("No has registrado ninguna cantidad comprada.");
      return;
    }
    
    for (const item of itemsComprados) {
      if (item.fotos.length === 0) {
        alert(`Falta foto de boleta para: ${item.nombre}`);
        return;
      }
      if (!item.proveedor) {
        alert(`Debes seleccionar un proveedor para: ${item.nombre}`);
        return;
      }
    }
    
    alert("¡Registros guardados exitosamente!");
  };

  const filteredItems = allItems.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isAdminOverride = role === 'dueño' || role === 'supervisor';
  const isFormDisabled = isLockedPhase && !isAdminOverride;

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Cargando...</div>;

  const headerStyle = { 
    backgroundColor: "var(--secondary)", 
    color: "var(--foreground)", 
    padding: "var(--spacing-md)", 
    textAlign: "center" as const, 
    fontWeight: 600,
    fontSize: "12px",
    borderBottom: "2px solid var(--border)"
  };

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "100px", fontFamily: "Arial, sans-serif" }}>
      
      {/* HEADER PRINCIPAL */}
      <header style={{ marginBottom: "var(--spacing-xl)", display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Registro Diario de Compras</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
             <span style={{ width: "24px", height: "24px", borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: "bold" }}>JP</span>
             Juanito Pérez | Fecha asignada: <strong>{fechaFiltro}</strong>
          </p>
        </div>

        <div style={{ textAlign: "right" }}>
          {isLockedPhase && isAdminOverride && (
            <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "10px", marginBottom: "4px" }}>SOBREESCRITURA ADMINISTRADOR</div>
          )}
          <div style={{ padding: "8px 16px", borderRadius: "var(--radius-md)", backgroundColor: isLockedPhase ? "var(--error)" : "var(--primary)", color: "white", fontWeight: 800, fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "8px", boxShadow: "var(--shadow-md)" }}>
            <Clock size={16} /> 
            {isLockedPhase ? "SISTEMA CERRADO" : timeRemaining}
          </div>
        </div>
      </header>

      {/* CONTROLES E INPUTS SUPERIORES */}
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-xl)", opacity: isFormDisabled ? 0.6 : 1, pointerEvents: isFormDisabled ? "none" : "auto" }}>
        <div style={{ position: "relative" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
          <input 
            type="text" placeholder="Buscar producto de tu lista..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px 10px 10px 35px", width: "300px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px" }}
          />
        </div>
        
        <button className="btn-primary" onClick={() => setShowAddModal(true)} style={{ backgroundColor: "#0f766e" }}>
          <Plus size={16} style={{ marginRight: "6px" }} /> ADICIONAR PRODUCTO EXTRA
        </button>
      </div>

      {isFormDisabled && !isAdminOverride && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #f87171", padding: "var(--spacing-lg)", borderRadius: "var(--radius-md)", marginBottom: "var(--spacing-xl)", textAlign: "center", color: "#b91c1c", fontWeight: 800 }}>
          <Lock size={24} style={{ margin: "0 auto 10px" }} />
          EL HORARIO DE REGISTRO HA FINALIZADO (5:00 PM). CONTACTA A TU SUPERVISOR.
        </div>
      )}

      {/* TABLA PRINCIPAL - DISEÑO REFINADO */}
      <div className="card" style={{ padding: 0, overflowX: "auto", opacity: isFormDisabled && !isAdminOverride ? 0.6 : 1, pointerEvents: isFormDisabled && !isAdminOverride ? "none" : "auto" }}>
        <table className="compact-table" style={{ width: "100%" }}>
          <thead>
            <tr>
              <th style={{ ...headerStyle, textAlign: "left", width: "180px" }}>PRODUCTO</th>
              <th style={{ ...headerStyle, width: "120px" }}>CANT. FÍSICA</th>
              <th style={{ ...headerStyle, width: "120px" }}>UNIDAD / TIPO</th>
              <th style={{ ...headerStyle, width: "130px" }}>COSTO UNIT.</th>
              <th style={{ ...headerStyle, width: "150px" }}>TOTAL (S/)</th>
              <th style={{ ...headerStyle, width: "160px" }}>PROVEEDOR</th>
              <th style={{ ...headerStyle, width: "180px" }}>ACCIONES</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map(item => (
              <tr key={item.id} style={{ borderBottom: "1px solid var(--border)", backgroundColor: item.esAdicional ? "#f0fdf4" : "transparent" }}>
                {/* 1. PRODUCTO */}
                <td style={{ padding: "var(--spacing-md)", fontWeight: 600 }}>
                  <div style={{ fontSize: "14px" }}>{item.nombre}</div>
                  {item.esAdicional && <div style={{ fontSize: "9px", padding: "2px 6px", borderRadius: "10px", backgroundColor: "#ccfbf1", color: "#0f766e", display: "inline-block", marginTop: "4px", fontWeight: 800 }}>ADICIONAL</div>}
                </td>
                
                {/* 2. CANTIDAD DE COMPRA */}
                <td style={{ textAlign: "center", padding: "var(--spacing-sm)" }}>
                  <input 
                    type="number" 
                    step="0.1"
                    placeholder="0.0"
                    value={item.cantidadComprada || ""} 
                    onChange={(e) => updateItem(item.id, "cantidadComprada", Number(e.target.value))} 
                    style={{ width: "80px", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", textAlign: "center", fontSize: "14px", fontWeight: 700 }}
                  />
                </td>

                {/* 3. PRESENTACION POR (SELECT) */}
                <td style={{ textAlign: "center", padding: "var(--spacing-sm)" }}>
                  <select 
                    value={item.unidadCompra} 
                    onChange={(e) => updateItem(item.id, "unidadCompra", e.target.value)} 
                    style={{ width: "100px", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "12px", backgroundColor: "white" }}
                  >
                    <option value="" disabled>Seleccionar</option>
                    <option value="KG">KILOS (KG)</option>
                    <option value="GRAMOS">GRAMOS</option>
                    <option value="CAJAS">CAJAS</option>
                    <option value="ATADOS">ATADOS</option>
                    <option value="PAQUETES">PAQUETES</option>
                    <option value="UNIDAD">UNIDAD</option>
                  </select>
                </td>

                {/* 4. COSTO UNITARIO */}
                <td style={{ textAlign: "center", padding: "var(--spacing-sm)" }}>
                  <div style={{ position: "relative", width: "100px", margin: "0 auto" }}>
                    <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "12px", color: "var(--text-muted)", fontWeight: 700 }}>S/</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      placeholder="0.00"
                      value={item.costoUnitario || ""} 
                      onChange={(e) => updateItem(item.id, "costoUnitario", Number(e.target.value))} 
                      style={{ width: "100%", padding: "8px 8px 8px 25px", border: "1px solid var(--border)", borderRadius: "4px", fontWeight: 600, fontSize: "14px" }}
                    />
                  </div>
                </td>

                {/* 5. MONTO TOTAL (AUTOMATICO) */}
                <td style={{ textAlign: "center", padding: "var(--spacing-sm)" }}>
                  <div style={{ backgroundColor: "#f3f4f6", padding: "8px", borderRadius: "4px", display: "inline-flex", flexDirection: "column", alignItems: "center", border: "1px solid var(--border)", minWidth: "90px" }}>
                    <span style={{ fontSize: "18px", fontWeight: 800, color: "var(--primary)" }}>
                      S/ {item.montoTotal.toFixed(2)}
                    </span>
                  </div>
                </td>

                {/* 6. PROVEEDOR */}
                <td style={{ textAlign: "center", padding: "var(--spacing-sm)" }}>
                  <select 
                    value={item.proveedor} 
                    onChange={(e) => updateItem(item.id, "proveedor", e.target.value)} 
                    style={{ width: "140px", padding: "8px", border: "1px solid var(--border)", borderRadius: "4px", fontSize: "11px", backgroundColor: "white" }}
                  >
                    <option value="">-- Seleccionar --</option>
                    {PROVEEDORES_SIMULADOS.map(prov => (
                      <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                    ))}
                  </select>
                </td>

                {/* 7. ACCIONES APILADAS */}
                <td style={{ padding: "var(--spacing-sm)" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", width: "100%" }}>
                    
                    {/* Botón Subir Foto */}
                    <div style={{ position: "relative", width: "100%" }}>
                      <button 
                        onClick={() => addPhoto(item.id)}
                        style={{ width: "100%", padding: "6px 8px", backgroundColor: item.fotos.length > 0 ? "#16a34a" : "white", color: item.fotos.length > 0 ? "white" : "var(--primary)", border: `1px solid ${item.fotos.length > 0 ? "#16a34a" : "var(--primary)"}`, borderRadius: "4px", fontWeight: 700, fontSize: "10px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px", transition: "all 0.2s" }}
                      >
                        <Camera size={12} /> {item.fotos.length > 0 ? `FOTOS (${item.fotos.length})` : "SUBIR BOLETA"}
                      </button>
                      {item.fotos.length > 0 && (
                        <div style={{ display: "flex", gap: "4px", marginTop: "4px", flexWrap: "wrap", justifyContent: "center" }}>
                          {item.fotos.map((f, i) => (
                            <div key={i} style={{ position: "relative", width: "22px", height: "22px", borderRadius: "4px", overflow: "hidden", border: "1px solid var(--border)" }}>
                              <img src={f} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                              <button onClick={() => removePhoto(item.id, i)} style={{ position: "absolute", top: -5, right: -5, background: "rgba(239, 68, 68, 0.9)", color: "white", border: "none", borderRadius: "50%", width: "14px", height: "14px", fontSize: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>x</button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      {[
                        { key: 'devueltoProveedor', label: 'Dev. Proveedor', color: '#c2410c' },
                        { key: 'merma', label: 'Notificar Merma', color: '#b91c1c' },
                        { key: 'sobrante', label: 'Reg. Sobrante', color: '#1d4ed8' },
                        { key: 'devueltoCliente', label: 'Dev. de Cliente', color: '#047857' }
                      ].map((action) => {
                         const hasValue = item[action.key as keyof ProductRecord];
                         return (
                          <button 
                            key={action.key}
                            onClick={() => openActionModal(item, action.key as any)}
                            style={{ 
                              width: "100%", padding: "4px 8px", 
                              backgroundColor: hasValue ? `${action.color}15` : "#f9fafb", 
                              color: hasValue ? action.color : "var(--text-muted)", 
                              border: `1px solid ${hasValue ? action.color : "var(--border)"}`, 
                              borderRadius: "4px", fontWeight: 700, fontSize: "9px", 
                              cursor: "pointer", textAlign: "left",
                              display: "flex", justifyContent: "space-between", alignItems: "center"
                            }}
                          >
                            {action.label}
                            {hasValue && <CheckCircle2 size={10} />}
                          </button>
                         )
                      })}
                    </div>
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr>
                <td colSpan={7} style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)", fontSize: "14px" }}>
                  No se encontraron productos en tu lista.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "30px", textAlign: "right", opacity: isFormDisabled && !isAdminOverride ? 0 : 1 }}>
        <button onClick={validarYGuardar} style={{ backgroundColor: "#ea580c", color: "white", border: "none", padding: "15px 40px", borderRadius: "30px", fontSize: "16px", fontWeight: "bold", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "10px" }}>
          <Save size={20} /> GUARDAR REGISTROS DEL DÍA
        </button>
      </div>

      {/* --- MODALES --- */}

      {/* 1. Modal Añadir Producto Adicional */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{ backgroundColor: "white", padding: "20px", width: "450px", borderRadius: "8px" }}>
            <h3 style={{ margin: "0 0 15px 0", color: "#114f2f", fontWeight: "bold" }}>Añadir Producto Fuera de Orden</h3>
            
            <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Nombre del Producto</label>
            <input type="text" value={newAdicional.nombre} onChange={e => setNewAdicional({...newAdicional, nombre: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", marginBottom: "15px", borderRadius: "4px" }} />
            
            <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Cantidad</label>
                <input type="number" value={newAdicional.cantidad || ""} onChange={e => setNewAdicional({...newAdicional, cantidad: Number(e.target.value)})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Unidad</label>
                <select value={newAdicional.unidadCompra} onChange={e => setNewAdicional({...newAdicional, unidadCompra: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}>
                  <option value="KG">KG</option>
                  <option value="GRAMOS">GRAMOS</option>
                  <option value="CAJAS">CAJAS</option>
                  <option value="ATADOS">ATADOS</option>
                  <option value="UNIDAD">UNIDAD</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Costo Unitario (S/)</label>
                <input type="number" step="0.01" value={newAdicional.costoUnitario || ""} onChange={e => setNewAdicional({...newAdicional, costoUnitario: Number(e.target.value)})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: "12px", fontWeight: "bold", display: "block", marginBottom: "5px" }}>Proveedor</label>
                <select value={newAdicional.proveedor} onChange={e => setNewAdicional({...newAdicional, proveedor: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}>
                  <option value="">-- Seleccione --</option>
                  {PROVEEDORES_SIMULADOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid #ccc", background: "white", cursor: "pointer", fontWeight: "bold" }}>CANCELAR</button>
              <button onClick={agregarAdicional} style={{ flex: 1, padding: "12px", backgroundColor: "#114f2f", color: "white", border: "none", cursor: "pointer", fontWeight: "bold" }}>AÑADIR A TABLA</button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Modal de Acciones Específicas (Merma, Sobrante, etc) */}
      {activeActionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ padding: "var(--spacing-xl)", width: "400px", borderTop: "4px solid var(--primary)", animation: "slideDown 0.2s ease-out" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
              <h3 style={{ margin: 0, color: "var(--foreground)", fontWeight: 800, fontSize: "18px" }}>{activeActionModal.title}</h3>
              <X size={20} style={{ cursor: "pointer", color: "var(--text-muted)" }} onClick={() => setActiveActionModal(null)} />
            </div>
            
            <div style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", padding: "10px", borderRadius: "var(--radius-sm)", marginBottom: "var(--spacing-lg)", display: "flex", alignItems: "center", gap: "8px" }}>
              <strong style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase" }}>Producto:</strong>
              <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary)" }}>{activeActionModal.productName}</span>
            </div>

            <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "8px" }}>
              Ingrese la cantidad o notas detalladas de la incidencia:
            </label>
            <textarea 
              autoFocus
              rows={4} 
              placeholder="Ej. 2 kg en mal estado devueltos hoy..."
              value={activeActionModal.currentValue}
              onChange={(e) => setActiveActionModal({...activeActionModal, currentValue: e.target.value})}
              style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", resize: "none", marginBottom: "var(--spacing-xl)", fontSize: "14px", backgroundColor: "#fafafa" }}
            />

            <div style={{ display: "flex", gap: "10px" }}>
              <button className="btn-secondary" onClick={() => setActiveActionModal(null)} style={{ flex: 1, padding: "12px", justifyContent: "center" }}>CANCELAR</button>
              <button className="btn-primary" onClick={saveActionModal} style={{ flex: 1, padding: "12px", justifyContent: "center", backgroundColor: "var(--primary)" }}>
                <CheckCircle2 size={16} style={{ marginRight: "4px" }} /> GUARDAR
              </button>
            </div>

          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
