"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  Camera, 
  Search,
  Clock,
  Plus,
  CheckCircle2,
  Lock,
  X,
  Save,
  Trash2,
  ShoppingBag,
  ChevronRight,
  DollarSign,
  Package,
  Truck,
  AlertTriangle,
  FileText,
  RotateCcw,
  TrendingDown,
  ArrowLeftRight,
  AlertCircle,
  Upload,
  Settings,
  Hand,
  ArrowRight
} from "lucide-react";

interface ProductRecord {
  id: string;
  nombre: string;
  cantidadSolicitada: number;
  unidadVenta: string; 
  unidadCompra: string;
  cantidadComprada: number; 
  costoUnitario: number;
  montoTotal: number;
  proveedor: string;
  fotos: string[];
  esAdicional: boolean;
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
  const [fechaFiltro] = useState<string>(new Date().toISOString().split("T")[0]);

  const [isLockedPhase, setIsLockedPhase] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdicional, setNewAdicional] = useState({ nombre: "", cantidad: 0, unidadCompra: "KG", costoUnitario: 0, proveedor: "" });
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [activeOptionsRow, setActiveOptionsRow] = useState<string | null>(null);

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
        merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: ""
      }));
      setAllItems(formattedItems);
    } else {
      setAllItems([
        { id: "1", nombre: "PLATANO", cantidadSolicitada: 50, unidadVenta: "KG", unidadCompra: "KG", cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false, merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: "" },
        { id: "2", nombre: "FRESA", cantidadSolicitada: 20, unidadVenta: "KG", unidadCompra: "KG", cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false, merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: "" },
        { id: "3", nombre: "BRÓCOLI BANDEJA", cantidadSolicitada: 30, unidadVenta: "KG", unidadCompra: "KG", cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false, merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: "" },
        { id: "4", nombre: "TOMATE ESPECIAL", cantidadSolicitada: 25, unidadVenta: "KG", unidadCompra: "KG", cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false, merma: "", sobrante: "", devueltoProveedor: "", devueltoCliente: "" },
      ]);
    }
    setLoading(false);

    const checkTime = () => {
      const now = new Date();
      const limite = new Date();
      limite.setHours(17, 0, 0, 0);
      
      if (now > limite) {
        setIsLockedPhase(true);
        setTimeRemaining("Tiempo Excedido");
      } else {
        const diff = limite.getTime() - now.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setTimeRemaining(`${hours}h ${minutes}m`);
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
      if (field === "cantidadComprada" || field === "costoUnitario") {
        updatedItem.montoTotal = parseFloat((updatedItem.cantidadComprada * updatedItem.costoUnitario).toFixed(2));
      }
      return updatedItem;
    }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const files = e.target.files;
    if (!files) return;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    const remainingSlots = 6 - item.fotos.length;
    if (remainingSlots <= 0) {
      alert("Límite de 6 fotos alcanzado.");
      return;
    }

    const newPhotos: string[] = [];
    const filesToProcess = Array.from(files).slice(0, remainingSlots);

    filesToProcess.forEach(file => {
      const url = URL.createObjectURL(file);
      newPhotos.push(url);
    });

    updateItem(itemId, 'fotos', [...item.fotos, ...newPhotos]);
    e.target.value = "";
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

  const isAdminOverride = role === 'admin' || role === 'supervisor';
  const isFormDisabled = isLockedPhase && !isAdminOverride;

  const totalGastado = allItems.reduce((s, i) => s + i.montoTotal, 0);


  const fechaFormateada = new Date(fechaFiltro + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const actionButtons = [
    { key: 'devueltoProveedor' as const, label: 'Dev. Proveedor', icon: RotateCcw, color: '#c2410c', bg: 'rgba(194,65,12,0.08)' },
    { key: 'merma' as const, label: 'Merma', icon: TrendingDown, color: '#b91c1c', bg: 'rgba(185,28,28,0.08)' },
    { key: 'sobrante' as const, label: 'Sobrante', icon: Package, color: '#1d4ed8', bg: 'rgba(29,78,216,0.08)' },
    { key: 'devueltoCliente' as const, label: 'Dev. Cliente', icon: ArrowLeftRight, color: '#047857', bg: 'rgba(4,120,87,0.08)' }
  ];

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      
      {/* ── HEADER ── */}
      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
          <ShoppingBag size={14} /> REGISTRO <ChevronRight size={10} /> <span style={{ color: "var(--foreground)" }}>COMPRAS DEL DÍA</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Registro Diario de Compras</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
              <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>JP</span>
              <span>Juanito Pérez</span>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border)" }} />
              <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{fechaFormateada}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            {isLockedPhase && isAdminOverride && (
              <div style={{ color: "var(--primary)", fontWeight: 800, fontSize: "9px", marginBottom: "4px", letterSpacing: "0.5px" }}>SOBREESCRITURA ADMIN</div>
            )}
            <div style={{ 
              padding: "8px 20px", borderRadius: "var(--radius-md)", 
              backgroundColor: isLockedPhase ? "#dc2626" : "var(--primary)", 
              color: "white", fontWeight: 800, fontSize: "var(--font-xs)", 
              display: "inline-flex", alignItems: "center", gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}>
              <Clock size={14} />
              {isLockedPhase ? "CERRADO" : timeRemaining}
            </div>
          </div>
        </div>
      </header>

      {/* Tip Info Verde */}
      <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "center", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
        <AlertCircle size={18} color="var(--success)" />
        <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
          <strong>Importante:</strong> Registra las compras diarias y añade 'Productos Extra' si no están en tu lista. Las mermas y sobrantes se gestionan en las acciones de cada fila.
        </p>
      </div>

      {/* ── CONTROLES SUPERIORES ── */}
      <div className="responsive-flex" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--spacing-xl)", opacity: isFormDisabled ? 0.5 : 1, pointerEvents: isFormDisabled ? "none" : "auto", gap: "var(--spacing-md)" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
          <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px", color: "#333" }}>
            <Search size={12} style={{ marginRight: "4px", verticalAlign: "middle" }} />
            Buscar Producto
          </label>
          <input 
            type="text" placeholder="Nombre del producto..." 
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "10px 16px", width: "100%", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)" }}
          />
        </div>
        
        <button 
          className="responsive-full-width-btn"
          onClick={() => setShowAddModal(true)} 
          style={{ padding: "10px 24px", backgroundColor: "#0f766e", color: "white", border: "none", borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: "var(--font-xs)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <Plus size={14} /> ADICIONAR PRODUCTO EXTRA
        </button>
      </div>

      {/* ── ALERTA DE BLOQUEO ── */}
      {isFormDisabled && !isAdminOverride && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fca5a5", padding: "var(--spacing-lg)", borderRadius: "var(--radius-md)", marginBottom: "var(--spacing-xl)", display: "flex", alignItems: "center", gap: "var(--spacing-md)" }}>
          <Lock size={20} color="#dc2626" />
          <div>
            <p style={{ margin: 0, fontWeight: 800, color: "#b91c1c", fontSize: "var(--font-sm)" }}>Horario de registro finalizado (5:00 PM)</p>
            <p style={{ margin: "4px 0 0", color: "#dc2626", fontSize: "var(--font-xs)" }}>Contacta a tu supervisor para habilitar la edición fuera de horario.</p>
          </div>
        </div>
      )}

      {/* ── TABLA DE PRODUCTOS ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden", opacity: isFormDisabled && !isAdminOverride ? 0.5 : 1, pointerEvents: isFormDisabled && !isAdminOverride ? "none" : "auto" }}>
        <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "var(--secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>
            <ShoppingBag size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--primary)" }} />
            Productos del Día
          </h3>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", backgroundColor: "white", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border)" }}>
            {filteredItems.length} productos
          </span>
        </div>
        
        <div className="mobile-scroll-hint" style={{ marginTop: "8px" }}>
          <Hand size={14} /> <span>Desliza la tabla para ver más</span> <ArrowRight size={14} />
        </div>
        <div style={{ overflowX: "auto" }}>
          <table className="compact-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ width: "40px", textAlign: "center" }}>#</th>
                <th style={{ width: "160px", minWidth: "160px", maxWidth: "160px" }}>Producto</th>
                <th style={{ textAlign: "center", width: "110px" }}>Cant. Física</th>
                <th style={{ textAlign: "center", width: "120px" }}>Unidad</th>
                <th style={{ textAlign: "center", width: "120px" }}>Costo Unit.</th>
                <th style={{ textAlign: "center", width: "120px", backgroundColor: "rgba(255,69,0,0.06)" }}>Total (S/)</th>
                <th style={{ textAlign: "center", width: "170px" }}>Proveedor</th>
                <th style={{ textAlign: "center", width: "100px" }}>Boleta</th>
                <th style={{ textAlign: "center", width: "110px" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => (
                <tr key={item.id} style={{ transition: "background 0.15s", backgroundColor: item.esAdicional ? "rgba(16,185,129,0.04)" : "transparent" }}>
                  {/* # */}
                  <td style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "11px" }}>{idx + 1}</td>
                  
                  {/* PRODUCTO */}
                  <td style={{ padding: "var(--spacing-md)" }}>
                    <div style={{ fontWeight: 700, fontSize: "var(--font-sm)" }}>{item.nombre}</div>
                    {item.esAdicional && (
                      <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(16,185,129,0.12)", color: "#047857", fontWeight: 800, marginTop: "4px", display: "inline-block" }}>ADICIONAL</span>
                    )}
                    {item.cantidadSolicitada > 0 && (
                      <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>Solicitado: {item.cantidadSolicitada} {item.unidadVenta}</div>
                    )}
                  </td>
                  
                  {/* CANTIDAD */}
                  <td style={{ textAlign: "center" }}>
                    <input 
                      type="number" step="0.1" placeholder="0.0"
                      value={item.cantidadComprada || ""} 
                      onChange={(e) => updateItem(item.id, "cantidadComprada", Number(e.target.value))} 
                      style={{ width: "80px", padding: "8px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", textAlign: "center", fontSize: "var(--font-sm)", fontWeight: 700, transition: "border-color 0.2s" }}
                      onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                      onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                    />
                  </td>

                  {/* UNIDAD */}
                  <td style={{ textAlign: "center" }}>
                    <select 
                      value={item.unidadCompra} 
                      onChange={(e) => updateItem(item.id, "unidadCompra", e.target.value)} 
                      style={{ padding: "8px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 600, backgroundColor: "white", cursor: "pointer" }}
                    >
                      <option value="KG">KILOS (KG)</option>
                      <option value="GRAMOS">GRAMOS</option>
                      <option value="CAJAS">CAJAS</option>
                      <option value="ATADOS">ATADOS</option>
                      <option value="PAQUETES">PAQUETES</option>
                      <option value="UNIDAD">UNIDAD</option>
                    </select>
                  </td>

                  {/* COSTO UNITARIO */}
                  <td style={{ textAlign: "center" }}>
                    <div style={{ position: "relative", width: "90px", margin: "0 auto" }}>
                      <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>S/</span>
                      <input 
                        type="number" step="0.01" placeholder="0.00"
                        value={item.costoUnitario || ""} 
                        onChange={(e) => updateItem(item.id, "costoUnitario", Number(e.target.value))} 
                        style={{ width: "100%", padding: "8px 8px 8px 24px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--font-sm)", transition: "border-color 0.2s" }}
                        onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
                        onBlur={(e) => e.target.style.borderColor = "var(--border)"}
                      />
                    </div>
                  </td>

                  {/* TOTAL */}
                  <td style={{ textAlign: "center", backgroundColor: "rgba(255,69,0,0.04)" }}>
                    <span style={{ fontSize: "var(--font-base)", fontWeight: 800, color: item.montoTotal > 0 ? "var(--primary)" : "var(--text-muted)" }}>
                      S/ {item.montoTotal.toFixed(2)}
                    </span>
                  </td>

                  {/* PROVEEDOR */}
                  <td style={{ textAlign: "center" }}>
                    <select 
                      value={item.proveedor} 
                      onChange={(e) => updateItem(item.id, "proveedor", e.target.value)} 
                      style={{ width: "150px", padding: "8px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 600, backgroundColor: "white", cursor: "pointer" }}
                    >
                      <option value="">— Seleccionar —</option>
                      {PROVEEDORES_SIMULADOS.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                      ))}
                    </select>
                  </td>

                  {/* BOLETA / FOTO */}
                  <td style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => setActivePhotoModal(item.id)}
                      style={{ 
                        padding: "6px 14px", 
                        backgroundColor: item.fotos.length > 0 ? "rgba(22,163,74,0.12)" : "rgba(255,69,0,0.08)", 
                        color: item.fotos.length > 0 ? "#16a34a" : "var(--primary)", 
                        border: `1.5px solid ${item.fotos.length > 0 ? "#16a34a" : "var(--primary)"}`, 
                        borderRadius: "20px", fontWeight: 800, fontSize: "10px", 
                        cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px", 
                        transition: "all 0.2s" 
                      }}
                    >
                      {item.fotos.length > 0 ? (
                        <><CheckCircle2 size={11} /> {item.fotos.length} foto{item.fotos.length > 1 ? "s" : ""}</>
                      ) : (
                        <><Upload size={11} /> Boletas</>
                      )}
                    </button>
                  </td>

                  {/* ACCIONES */}
                  <td style={{ textAlign: "center" }}>
                    <button
                      onClick={() => setActiveOptionsRow(item.id)}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#f3f4f6",
                        color: "#374151",
                        border: "1px solid var(--border)",
                        borderRadius: "6px",
                        fontWeight: 800,
                        fontSize: "10px",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        transition: "backgroundColor 0.15s"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "#e5e7eb"}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "#f3f4f6"}
                    >
                      <Settings size={12} /> Gestionar
                    </button>
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "60px 20px" }}>
                    <Search size={36} style={{ margin: "0 auto 10px", display: "block", opacity: 0.1 }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>No se encontraron productos en tu lista.</p>
                  </td>
                </tr>
              )}
              {/* Fila TOTAL */}
              {filteredItems.length > 0 && (
                <tr style={{ backgroundColor: "#111", color: "white" }}>
                  <td colSpan={5} style={{ textAlign: "right", fontWeight: 800, fontSize: "var(--font-sm)", padding: "var(--spacing-md) var(--spacing-lg)", border: "none" }}>
                    TOTAL GENERAL
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 800, fontSize: "var(--font-lg)", border: "none", color: "#ff6b35" }}>
                    S/ {totalGastado.toFixed(2)}
                  </td>
                  <td colSpan={3} style={{ border: "none" }} />
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTÓN GUARDAR ── */}
      <div style={{ marginTop: "var(--spacing-xl)", display: "flex", justifyContent: "flex-end", opacity: isFormDisabled && !isAdminOverride ? 0 : 1 }}>
        <button 
          onClick={validarYGuardar} 
          style={{ 
            backgroundColor: "var(--primary)", color: "white", border: "none", 
            padding: "14px 40px", borderRadius: "var(--radius-md)", 
            fontSize: "var(--font-sm)", fontWeight: 800, cursor: "pointer", 
            display: "inline-flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 14px rgba(255,69,0,0.3)",
            transition: "transform 0.15s, box-shadow 0.15s"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; e.currentTarget.style.boxShadow = "0 6px 20px rgba(255,69,0,0.4)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 4px 14px rgba(255,69,0,0.3)"; }}
        >
          <Save size={16} /> GUARDAR REGISTROS DEL DÍA
        </button>
      </div>

      {/* ══════ MODALES ══════ */}

      {/* Modal Añadir Producto Adicional */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ padding: "var(--spacing-xl)", width: "480px", borderTop: "4px solid #0f766e", animation: "slideDown 0.2s ease-out" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: "var(--font-lg)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Plus size={18} color="#0f766e" /> Añadir Producto Extra
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
            </div>
            
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Nombre del Producto</label>
              <input type="text" value={newAdicional.nombre} onChange={e => setNewAdicional({...newAdicional, nombre: e.target.value})} placeholder="Ej. MANGO KENT" style={{ width: "100%", padding: "10px 16px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }} />
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)", marginBottom: "var(--spacing-lg)" }}>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Cantidad</label>
                <input type="number" value={newAdicional.cantidad || ""} onChange={e => setNewAdicional({...newAdicional, cantidad: Number(e.target.value)})} style={{ width: "100%", padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Unidad</label>
                <select value={newAdicional.unidadCompra} onChange={e => setNewAdicional({...newAdicional, unidadCompra: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600, backgroundColor: "white" }}>
                  <option value="KG">KG</option>
                  <option value="GRAMOS">GRAMOS</option>
                  <option value="CAJAS">CAJAS</option>
                  <option value="ATADOS">ATADOS</option>
                  <option value="UNIDAD">UNIDAD</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--spacing-md)", marginBottom: "var(--spacing-xl)" }}>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Costo Unitario (S/)</label>
                <input type="number" step="0.01" value={newAdicional.costoUnitario || ""} onChange={e => setNewAdicional({...newAdicional, costoUnitario: Number(e.target.value)})} style={{ width: "100%", padding: "10px 16px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600 }} />
              </div>
              <div>
                <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "6px" }}>Proveedor</label>
                <select value={newAdicional.proveedor} onChange={e => setNewAdicional({...newAdicional, proveedor: e.target.value})} style={{ width: "100%", padding: "10px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-sm)", fontWeight: 600, backgroundColor: "white" }}>
                  <option value="">— Seleccione —</option>
                  {PROVEEDORES_SIMULADOS.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontWeight: 700, fontSize: "var(--font-xs)", borderRadius: "var(--radius-md)" }}>CANCELAR</button>
              <button onClick={agregarAdicional} style={{ flex: 1, padding: "12px", backgroundColor: "#0f766e", color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "var(--font-xs)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <Plus size={14} /> AÑADIR A TABLA
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Acciones (Merma, Sobrante, etc) */}
      {activeActionModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ padding: "var(--spacing-xl)", width: "440px", borderTop: "4px solid var(--primary)", animation: "slideDown 0.2s ease-out" }}>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: "var(--font-lg)" }}>{activeActionModal.title}</h3>
              <button onClick={() => setActiveActionModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
            </div>
            
            <div style={{ backgroundColor: "var(--secondary)", border: "1px solid var(--border)", padding: "10px var(--spacing-md)", borderRadius: "var(--radius-md)", marginBottom: "var(--spacing-lg)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase" }}>Producto:</span>
              <span style={{ fontSize: "var(--font-sm)", fontWeight: 800, color: "var(--primary)" }}>{activeActionModal.productName}</span>
            </div>

            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, display: "block", marginBottom: "8px" }}>
              Cantidad o notas detalladas de la incidencia:
            </label>
            <textarea 
              autoFocus
              rows={4} 
              placeholder="Ej. 2 kg en mal estado devueltos hoy..."
              value={activeActionModal.currentValue}
              onChange={(e) => setActiveActionModal({...activeActionModal, currentValue: e.target.value})}
              style={{ width: "100%", padding: "12px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", resize: "none", marginBottom: "var(--spacing-xl)", fontSize: "var(--font-sm)", backgroundColor: "#fafafa", transition: "border-color 0.2s" }}
              onFocus={(e) => e.target.style.borderColor = "var(--primary)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border)"}
            />

            <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
              <button onClick={() => setActiveActionModal(null)} style={{ flex: 1, padding: "12px", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontWeight: 700, fontSize: "var(--font-xs)", borderRadius: "var(--radius-md)" }}>CANCELAR</button>
              <button onClick={saveActionModal} style={{ flex: 1, padding: "12px", backgroundColor: "var(--primary)", color: "white", border: "none", cursor: "pointer", fontWeight: 800, fontSize: "var(--font-xs)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                <CheckCircle2 size={14} /> GUARDAR
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Boletas / Fotos */}
      {activePhotoModal && (() => {
        const item = allItems.find(i => i.id === activePhotoModal);
        if (!item) return null;
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="card" style={{ padding: "var(--spacing-xl)", width: "500px", maxWidth: "90vw", borderTop: "4px solid #16a34a", animation: "slideDown 0.2s ease-out", display: "flex", flexDirection: "column", maxHeight: "85vh" }}>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: "var(--font-lg)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Upload size={18} color="#16a34a" /> Boletas de {item.nombre}
                </h3>
                <button onClick={() => setActivePhotoModal(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
              </div>

              <div style={{ backgroundColor: "var(--secondary)", border: "1px dashed var(--border)", borderRadius: "var(--radius-md)", padding: "var(--spacing-xl)", textAlign: "center", marginBottom: "var(--spacing-lg)", position: "relative" }}>
                <input 
                  type="file" 
                  accept="image/*" 
                  multiple 
                  onChange={(e) => handlePhotoUpload(e, item.id)}
                  style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }}
                />
                <Camera size={24} style={{ opacity: 0.5, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontSize: "var(--font-sm)", fontWeight: 700, color: "var(--text-muted)" }}>
                  Toca aquí para seleccionar o tomar fotos
                </p>
                <p style={{ margin: "4px 0 0", fontSize: "10px", color: "var(--text-muted)" }}>
                  {item.fotos.length} de 6 fotos subidas
                </p>
              </div>

              <div style={{ overflowY: "auto", flex: 1, paddingRight: "4px" }}>
                {item.fotos.length > 0 ? (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "var(--spacing-md)" }}>
                    {item.fotos.map((f, i) => (
                      <div key={i} style={{ position: "relative", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "1" }}>
                        <img src={f} alt={`Boleta ${i+1}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        <button 
                          onClick={() => removePhoto(item.id, i)} 
                          style={{ position: "absolute", top: 6, right: 6, background: "rgba(239,68,68,0.9)", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", boxShadow: "0 2px 4px rgba(0,0,0,0.2)" }}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: "40px 0", textAlign: "center", opacity: 0.4 }}>
                    <p style={{ margin: 0, fontSize: "var(--font-sm)", fontWeight: 600 }}>No hay boletas subidas aún</p>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "var(--spacing-lg)", paddingTop: "var(--spacing-md)", borderTop: "1px solid var(--border)" }}>
                <button onClick={() => setActivePhotoModal(null)} style={{ width: "100%", padding: "12px", border: "1px solid var(--border)", background: "white", cursor: "pointer", fontWeight: 700, fontSize: "var(--font-xs)", borderRadius: "var(--radius-md)", color: "var(--text-main)" }}>
                  CERRAR VENTANA
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* Modal Seleccionar Acción (Merma, Sobrante, Dev) */}
      {activeOptionsRow && (() => {
        const item = allItems.find(i => i.id === activeOptionsRow);
        if (!item) return null;
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="card" style={{ padding: "var(--spacing-xl)", width: "380px", borderTop: "4px solid #374151", animation: "slideDown 0.2s ease-out" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-md)" }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: "var(--font-lg)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Settings size={18} color="#374151" /> Gestionar Producto
                </h3>
                <button onClick={() => setActiveOptionsRow(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
              </div>
              
              <div style={{ backgroundColor: "var(--secondary)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "var(--spacing-lg)", textAlign: "center", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)", fontWeight: 700, marginBottom: "4px" }}>PRODUCTO SELECCIONADO</div>
                <div style={{ fontSize: "var(--font-base)", fontWeight: 800, color: "var(--primary)" }}>{item.nombre}</div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {actionButtons.map((action) => {
                  const hasValue = item[action.key as keyof ProductRecord];
                  const Icon = action.icon;
                  return (
                    <button 
                      key={action.key}
                      onClick={() => {
                        setActiveOptionsRow(null);
                        openActionModal(item, action.key);
                      }}
                      style={{ 
                        padding: "12px 16px", 
                        backgroundColor: hasValue ? action.bg : "white", 
                        color: hasValue ? action.color : "var(--text-main)", 
                        border: `1px solid ${hasValue ? action.color + "40" : "var(--border)"}`, 
                        borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--font-sm)", 
                        cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        transition: "all 0.15s"
                      }}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Icon size={16} color={hasValue ? action.color : "var(--text-muted)"} />
                        {action.label}
                      </span>
                      {hasValue && <CheckCircle2 size={16} color={action.color} />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })()}

      <style jsx>{`
        @keyframes slideDown {
          from { transform: translateY(-10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
