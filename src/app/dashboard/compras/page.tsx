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
  Hand,
  ArrowRight,
  AlertCircle,
  Upload,
  UserCircle,
  Timer
} from "lucide-react";



const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backent-sierralta.onrender.com';

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
  noSeCompro?: boolean;
}

const PROVEEDORES_SIMULADOS = [
  { id: "prov1", nombre: "Proveedor Principal SAC" },
  { id: "prov2", nombre: "Mercado Central - Puesto 15" },
  { id: "prov3", nombre: "Agro Sur SRL" },
  { id: "prov4", nombre: "Distribuidora El Sol" },
];

const WORKERS = ['Daniel', 'Jesus', 'Alex', 'Yamilet', 'Victor', 'Abraham', 'Fabricio'];

const getOperativeDate = () => {
  const now = new Date();
  const hour = now.getHours();
  const minute = now.getMinutes();
  
  // Si es antes de las 2:50 AM, consideramos el día operativo anterior
  if (hour < 2 || (hour === 2 && minute < 50)) {
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yYear = yesterday.getFullYear();
    const yMonth = String(yesterday.getMonth() + 1).padStart(2, '0');
    const yDay = String(yesterday.getDate()).padStart(2, '0');
    return `${yYear}-${yMonth}-${yDay}`;
  }
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function RegistroCompras() {
  const [allItems, setAllItems] = useState<ProductRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<string | null>(null);
  const [prorrogaTime, setProrrogaTime] = useState<number>(0);
  const [users, setUsers] = useState<any[]>([]); // New state for users
  const [userName, setUserName] = useState<string>("Trabajador");
  const [fechaFiltro, setFechaFiltro] = useState<string>(getOperativeDate());

  // Selección de trabajador (solo activo si eres dueño/admin)
  const [selectedWorkerView, setSelectedWorkerView] = useState<string>("Daniel");

  const [isLockedPhase, setIsLockedPhase] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdicional, setNewAdicional] = useState({ nombre: "", cantidad: 0, unidadCompra: "KG", costoUnitario: 0, proveedor: "" });
  const [activePhotoModal, setActivePhotoModal] = useState<string | null>(null);
  const [unidadesCompra, setUnidadesCompra] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/unidades`)
      .then(res => res.json())
      .then(data => setUnidadesCompra(data.map((u: any) => u.nombre)))
      .catch(console.error);
  }, []);

  // Recarga principal de datos (Se ejecuta al entrar o al cambiar el trabajador para los dueños)
  useEffect(() => {
    const currentRole = localStorage.getItem("user_role")?.toLowerCase() || "trabajador";
    const loggedName = localStorage.getItem("user_name") || "Trabajador";
    setRole(currentRole);
    setUserName(loggedName);

    const isOwner = currentRole === 'admin' || currentRole === 'dueño';
    const targetWorker = isOwner ? selectedWorkerView : loggedName;

    if (!isOwner && selectedWorkerView !== loggedName) {
      setSelectedWorkerView(loggedName);
    }
    
    // Obtener asignaciones y datos desde el Backend NestJS
    const fetchBackendData = async () => {
      try {
        const [resCompras, resAsignaciones, resUsers] = await Promise.all([
          fetch(`${API_URL}/compras?fecha=${fechaFiltro}`),
          fetch(`${API_URL}/usuarios/asignaciones`),
          fetch(`${API_URL}/usuarios`)
        ]);
        
        const serverData = await resCompras.json();
        const asignacionesDict = await resAsignaciones.json();
        const usersData = await resUsers.json();
        setUsers(usersData);
        
        const currentUser = usersData.find((u: any) => u.nombre.toLowerCase() === targetWorker.toLowerCase());
        if (currentUser && currentUser.prorroga_hasta) {
          setProrrogaTime(new Date(currentUser.prorroga_hasta).getTime());
        }
        
        // Búsqueda insensible a mayúsculas/minúsculas
        const assignedProducts = Object.entries(asignacionesDict).find(
          ([key]) => key.toLowerCase() === targetWorker.toLowerCase()
        )?.[1] as string[] || [];
        
        // Filtrar por trabajador
        const comprasDelTrabajador = serverData.filter((c: any) => c.trabajador?.nombre.toLowerCase() === targetWorker.toLowerCase());
        
        let baseItems = comprasDelTrabajador.map((p: any) => ({
          id: p.id,
          nombre: p.producto?.nombre || "DESCONOCIDO",
          cantidadSolicitada: Number(p.cantidad_solicitada) || 0,
          unidadVenta: p.unidad_venta || "KG",
          unidadCompra: p.unidad_compra || "KG",
          cantidadComprada: Number(p.cantidad_comprada) || 0,
          costoUnitario: Number(p.costo_unitario) || 0,
          montoTotal: Number(p.monto_total) || 0,
          proveedor: (p.proveedor_id || p.proveedor?.nombre || "").toLowerCase(),
          fotos: p.fotos?.map((f: any) => f.url_foto) || [],
          esAdicional: p.es_adicional || false,
          noSeCompro: p.no_se_compro || false
        }));

        if (assignedProducts.length > 0) {
           // Filtrar a solo lo asignado (si no es adicional)
           baseItems = baseItems.filter((p: any) => p.esAdicional || assignedProducts.includes(p.nombre));
           // Añadir en blanco los asignados que falten
           for (const pname of assignedProducts) {
             if (!baseItems.find((b: any) => b.nombre === pname)) {
               baseItems.push({
                 id: `gen-${pname}`, nombre: pname, cantidadSolicitada: 0, unidadVenta: "KG", unidadCompra: "KG",
                 cantidadComprada: 0, costoUnitario: 0, montoTotal: 0, proveedor: "", fotos: [], esAdicional: false
               });
             }
           }
        } else {
           // Si no tiene nada asignado, mostrar lo que ya guardó de todas formas
           baseItems = baseItems;
        }

        setAllItems(prev => {
           if (isOwner) return baseItems;
           if (prev.length === 0) return baseItems;
           
           // Para el trabajador: mantener sus cambios locales, solo añadir nuevos
           const merged = [...prev];
           baseItems.forEach((bItem: any) => {
              if (!merged.find(p => p.nombre === bItem.nombre)) {
                 merged.push(bItem);
              }
           });
           return merged;
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data from backend", error);
        setLoading(false);
      }
    };

    fetchBackendData();

    // Sistema de checar el tiempo (Para el trabajador activo del form)
    const checkTime = () => {
      const now = new Date();
      const horaActual = now.getHours();
      let enRango = horaActual >= 3 && horaActual < 15; // 3 AM a 3 PM
      
      let prorroga = prorrogaTime || 0;

      let statusMsg = "";
      if (now.getTime() < prorroga) {
         enRango = true;
         const remainingExt = Math.floor((prorroga - now.getTime()) / 60000);
         statusMsg = `Prórroga: ${remainingExt}m rst.`;
      } else if (enRango) {
         const remainingTo15h = (15 - horaActual) * 60 - now.getMinutes();
         const h = Math.floor(remainingTo15h / 60);
         const m = remainingTo15h % 60;
         statusMsg = `${h}h ${m}m rst`;
      } else {
         statusMsg = "CERRADO (3 PM)";
      }

      setIsLockedPhase(!enRango);
      setTimeRemaining(statusMsg);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    // Polling del Server (Cada 4 segundos)
    const syncInterval = setInterval(fetchBackendData, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [selectedWorkerView, fechaFiltro, prorrogaTime]);

  const updateItem = (id: string, field: keyof ProductRecord, value: any) => {
    setAllItems(prevItems => prevItems.map(item => {
      if (item.id !== id) return item;
      const updatedItem = { ...item, [field]: value };
      if (field === "cantidadComprada" || field === "costoUnitario") {
        updatedItem.montoTotal = parseFloat((updatedItem.cantidadComprada * updatedItem.costoUnitario).toFixed(2));
      }
      return updatedItem;
    }));
  };

  const saveItemToBackend = async (itemToSave: ProductRecord) => {
    const userId = Number(localStorage.getItem("user_id"));
    if (!userId) return;

    const payload = [{
      id: itemToSave.id, // ID ESTABLE, NO REGENERAR
      fecha: fechaFiltro,
      trabajador_id: userId,
      producto_nombre: itemToSave.nombre,
      cantidad_solicitada: itemToSave.cantidadSolicitada,
      unidad_venta: itemToSave.unidadVenta,
      unidad_compra: itemToSave.unidadCompra,
      cantidad_comprada: itemToSave.cantidadComprada,
      costo_unitario: itemToSave.costoUnitario,
      monto_total: itemToSave.montoTotal,
      proveedor_nombre: itemToSave.proveedor,
      es_adicional: itemToSave.esAdicional,
      no_se_compro: itemToSave.noSeCompro,
      fotos: itemToSave.fotos
    }];

    try {
      const res = await fetch(`${API_URL}/compras/sync`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error del servidor: ${err.message || 'Error desconocido'}`);
      }
    } catch(e) {
      console.error("Error auto-saving item", e);
      alert("Error de conexión al guardar el item.");
    }
  };

  const grantTime = async (minutes: number) => {
    const user = users.find(u => u.nombre.toLowerCase() === selectedWorkerView.toLowerCase());
    if (!user) {
      alert("No se encontró el usuario en la base de datos.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/usuarios/${user.id}/prorroga`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutos: minutes })
      });
      
      if (!res.ok) throw new Error("Error en servidor");

      alert(`Se ha otorgado ${minutes} minutos adicionales a ${selectedWorkerView}.`);
      window.location.reload();
    } catch (e) {
      alert("Error al guardar prórroga en el backend.");
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, itemId: string) => {
    const files = e.target.files;
    if (!files) return;
    const item = allItems.find(i => i.id === itemId);
    if (!item) return;
    
    const remainingSlots = 6 - item.fotos.length;
    if (remainingSlots <= 0) return alert("Límite de 6 fotos alcanzado.");

    const readFileAsBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
    };

    const uploadPromises = Array.from(files).slice(0, remainingSlots).map(file => readFileAsBase64(file));
    const base64Photos = await Promise.all(uploadPromises);
    
    const updatedPhotos = [...item.fotos, ...base64Photos];
    updateItem(itemId, 'fotos', updatedPhotos);
    saveItemToBackend({...item, fotos: updatedPhotos});
    e.target.value = "";
  };

  const removePhoto = (id: string, indexToRemove: number) => {
    const item = allItems.find(i => i.id === id);
    if (!item) return;
    const updatedPhotos = item.fotos.filter((_, i) => i !== indexToRemove);
    updateItem(id, 'fotos', updatedPhotos);
    saveItemToBackend({...item, fotos: updatedPhotos});
  };

  const eliminarAsignacion = async (idToRemove: string, productName: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente a ${productName} de las asignaciones de ${selectedWorkerView}?`)) return;

    setAllItems(allItems.filter(i => i.id !== idToRemove));

    let assignedUpdated = null;
    let itemsUpdated = null;

    const rawAsignaciones = localStorage.getItem("workers_assignments");
    if (rawAsignaciones) {
        const parsed = JSON.parse(rawAsignaciones);
        if (parsed[selectedWorkerView]) {
            parsed[selectedWorkerView] = parsed[selectedWorkerView].filter((p: string) => p !== productName);
            assignedUpdated = parsed;
            localStorage.setItem("workers_assignments", JSON.stringify(parsed));
        }
    }

    const saveKey = `orden_compra_actual_${fechaFiltro}_${selectedWorkerView}`;
    const rawData = localStorage.getItem(saveKey);
    if (rawData) {
        let items = JSON.parse(rawData);
        items = items.filter((i: any) => i.id !== idToRemove);
        itemsUpdated = items;
        localStorage.setItem(saveKey, JSON.stringify(items));
    }

    // Sync to Server
    try {
       const payload: any = {};
       if (assignedUpdated) payload["workers_assignments"] = assignedUpdated;
       if (itemsUpdated) payload[saveKey] = itemsUpdated;
       await fetch('/api/sync', { method: 'POST', body: JSON.stringify(payload) });
    } catch(e) {}
  };

  const agregarAdicional = async () => {
    if (!newAdicional.nombre) return;
    const itemName = newAdicional.nombre.toUpperCase();
    const item: ProductRecord = {
      id: `ext-${Math.random()}`,
      nombre: itemName,
      cantidadSolicitada: 0,
      unidadVenta: newAdicional.unidadCompra,
      unidadCompra: newAdicional.unidadCompra,
      cantidadComprada: newAdicional.cantidad,
      costoUnitario: newAdicional.costoUnitario,
      montoTotal: parseFloat((newAdicional.cantidad * newAdicional.costoUnitario).toFixed(2)),
      proveedor: newAdicional.proveedor,
      fotos: [],
      esAdicional: true
    };
    
    const newItemsList = [...allItems, item];
    setAllItems(newItemsList);
    
    let assignedUpdated = null;
    if (isOwnerMode) {
      const rawAsignaciones = localStorage.getItem("workers_assignments");
      const parsed = rawAsignaciones ? JSON.parse(rawAsignaciones) : {};
      if (!parsed[selectedWorkerView]) parsed[selectedWorkerView] = [];
      if (!parsed[selectedWorkerView].includes(itemName)) {
          parsed[selectedWorkerView].push(itemName);
          assignedUpdated = parsed;
          localStorage.setItem("workers_assignments", JSON.stringify(parsed));
      }
    }

    const targetWorker = (role === 'admin' || role === 'dueño') ? selectedWorkerView : userName;
    const saveKey = `orden_compra_actual_${fechaFiltro}_${targetWorker}`;
    localStorage.setItem(saveKey, JSON.stringify(newItemsList));

    // Sync to Server
    try {
       const payload: any = {};
       if (assignedUpdated) payload["workers_assignments"] = assignedUpdated;
       payload[saveKey] = newItemsList;
       await fetch('/api/sync', { method: 'POST', body: JSON.stringify(payload) });
    } catch(e) {}

    setShowAddModal(false);
    setNewAdicional({ nombre: "", cantidad: 0, unidadCompra: "KG", costoUnitario: 0, proveedor: "" });
  };


  const validarYGuardar = async () => {
    const userId = Number(localStorage.getItem("user_id"));
    if (!userId) return alert("Error: Usuario no identificado.");

    const payload = allItems.map(item => ({
      id: item.id,
      fecha: fechaFiltro,
      trabajador_id: userId,
      producto_nombre: item.nombre,
      cantidad_solicitada: item.cantidadSolicitada,
      unidad_venta: item.unidadVenta,
      unidad_compra: item.unidadCompra,
      cantidad_comprada: item.cantidadComprada,
      costo_unitario: item.costoUnitario,
      monto_total: item.montoTotal,
      proveedor_nombre: item.proveedor,
      es_adicional: item.esAdicional,
      no_se_compro: item.noSeCompro,
      fotos: item.fotos
    }));
    
    // Sync to Server
    try {
       const res = await fetch(`${API_URL}/compras/sync`, { 
         method: 'POST', 
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload) 
       });
       if (!res.ok) {
         const err = await res.json();
         alert(`Error del servidor: ${err.message || 'Error desconocido'}`);
       } else {
         alert(`Información guardada. Cualquier dato incompleto será reportado naranja al administrador.`);
       }
    } catch(e) {
       console.error("Error al guardar", e);
       alert("Error de conexión al guardar.");
    }
  };

  const filteredItems = allItems.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isOwnerMode = role === 'admin' || role === 'dueño';
  // Bloquear form si está cerrado y eres trabajador
  const isFormDisabled = isLockedPhase && !isOwnerMode;

  const totalGastado = allItems.reduce((s, i) => s + i.montoTotal, 0);

  const fechaFormateada = new Date(fechaFiltro + "T12:00:00").toLocaleDateString("es-PE", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  if (loading) return <div style={{ padding: "100px", textAlign: "center" }}>Cargando...</div>;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      
      <header style={{ marginBottom: isOwnerMode ? "var(--spacing-md)" : "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
          <ShoppingBag size={14} /> REGISTRO <ChevronRight size={10} /> <span style={{ color: "var(--foreground)" }}>COMPRAS DEL DÍA</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Registro Diario de Compras</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)", fontSize: "var(--font-xs)" }}>
              <span style={{ width: "28px", height: "28px", borderRadius: "50%", backgroundColor: "var(--primary)", color: "white", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: "10px", fontWeight: 800 }}>{userName.slice(0, 2).toUpperCase()}</span>
              <span style={{ fontWeight: 700 }}>{userName} ({role})</span>
              <span style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border)" }} />
              <span style={{ fontWeight: 700, textTransform: "capitalize" }}>{fechaFormateada}</span>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ 
              padding: "8px 20px", borderRadius: "var(--radius-md)", 
              backgroundColor: isLockedPhase ? "#dc2626" : "var(--primary)", 
              color: "white", fontWeight: 800, fontSize: "var(--font-xs)", 
              display: "inline-flex", alignItems: "center", gap: "6px",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
            }}>
              {isLockedPhase ? <Lock size={14} /> : <Clock size={14} />}
              {isLockedPhase ? "CERRADO" : timeRemaining}
            </div>
          </div>
        </div>
      </header>

      {/* ── PANEL EXCLUSIVO PARA EL DUEÑO ── */}
      {isOwnerMode && (
        <div style={{ padding: "16px", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "8px", marginBottom: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
             <h3 style={{ margin: 0, fontSize: "12px", color: "var(--primary)", display: "flex", alignItems: "center", gap: "6px" }}><UserCircle size={16}/> SELECCIONE TRABAJADOR PARA AUDITORÍA</h3>
             <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)" }}>DAR PRÓRROGA A {selectedWorkerView.toUpperCase()}:</span>
                <button onClick={()=>grantTime(15)} style={{ backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>+15m</button>
                <button onClick={()=>grantTime(30)} style={{ backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>+30m</button>
                <button onClick={()=>grantTime(60)} style={{ backgroundColor: "#16a34a", color: "white", border: "none", borderRadius: "4px", padding: "4px 8px", fontSize: "10px", cursor: "pointer", fontWeight: "bold" }}>+1H</button>
             </div>
          </div>
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px", marginBottom: "12px" }}>
            {WORKERS.map(w => (
              <button 
                key={w} onClick={() => setSelectedWorkerView(w)}
                style={{
                  padding: "8px 16px", borderRadius: "20px", fontWeight: 700, fontSize: "11px", cursor: "pointer", whiteSpace: "nowrap",
                  border: selectedWorkerView === w ? "none" : "1px solid var(--border)",
                  backgroundColor: selectedWorkerView === w ? "var(--primary)" : "#f8f9fa",
                  color: selectedWorkerView === w ? "white" : "var(--text-main)",
                }}
              >
                {w}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderTop: "1px dashed var(--border)", paddingTop: "12px" }}>
            <span style={{ fontSize: "11px", fontWeight: 800, color: "var(--text-muted)" }}>AUDITAR FECHA DE REGISTRO:</span>
            <input 
              type="date"
              value={fechaFiltro}
              onChange={(e) => setFechaFiltro(e.target.value)}
              style={{ padding: "6px 12px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 700 }}
            />
          </div>
        </div>
      )}

      {/* Tips / Feedback para Trabajador */}
      {!isOwnerMode && (
        <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "flex-start", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
          <AlertCircle size={18} color="var(--success)" style={{ marginTop: "2px", flexShrink: 0 }} />
          <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
            <strong>Importante:</strong> Registra las compras diarias corroborando todo para que salga en estado "Verde". Los casilleros sin foto o con información incompleta le llegarán "Anaranjados" al dueño.
          </p>
        </div>
      )}

      {/* ── ALERTA DE REGISTRO REMOVIDA A PETICIÓN ── */}


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
      </div>

      {/* ── TABLA DE PRODUCTOS ── */}
      <div className="card" style={{ padding: 0, overflow: "hidden", opacity: isFormDisabled ? 0.5 : 1, pointerEvents: isFormDisabled ? "none" : "auto" }}>
        <div style={{ padding: "var(--spacing-md) var(--spacing-lg)", backgroundColor: "var(--secondary)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0, fontSize: "var(--font-base)", fontWeight: 800 }}>
            <ShoppingBag size={16} style={{ marginRight: "8px", verticalAlign: "middle", color: "var(--primary)" }} />
            Productos de {isOwnerMode ? selectedWorkerView : "Hoy"}
          </h3>
          <span style={{ fontSize: "10px", fontWeight: 700, color: "var(--text-muted)", backgroundColor: "white", padding: "4px 12px", borderRadius: "20px", border: "1px solid var(--border)" }}>
            {filteredItems.length} productos
          </span>
        </div>
        
        <div style={{ overflowX: "auto" }}>
          <table className="compact-table" style={{ width: "100%" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ width: "40px", textAlign: "center" }}>Est</th>
                <th style={{ width: "160px", minWidth: "160px", maxWidth: "160px" }}>Producto</th>
                <th style={{ textAlign: "center", width: "110px" }}>Cant. Física</th>
                <th style={{ textAlign: "center", width: "120px" }}>Unidad</th>
                <th style={{ textAlign: "center", width: "120px" }}>Costo Unit.</th>
                <th style={{ textAlign: "center", width: "120px", backgroundColor: "rgba(255,69,0,0.06)" }}>Total (S/)</th>
                <th style={{ textAlign: "center", width: "170px" }}>Proveedor</th>
                <th style={{ textAlign: "center", width: "100px" }}>Boleta</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, idx) => {
                
                // Color Logic
                let rowBgColor = "transparent";
                let incompleteMsgs: string[] = [];

                if (item.noSeCompro) {
                  rowBgColor = "#f1f5f9"; // Gris/Slate claro para saltado/no comprado (Positivo Neutral)
                } else if (!item.cantidadComprada || item.cantidadComprada <= 0) {
                  rowBgColor = "#fee2e2"; // Rojo (Vacío total)
                } else {
                  const validProviderIds = PROVEEDORES_SIMULADOS.map(p => p.id);
                  if (!item.proveedor || !validProviderIds.includes(item.proveedor)) incompleteMsgs.push("Proveedor");
                  if (!item.costoUnitario) incompleteMsgs.push("Costo Unit");
                  if (item.fotos.length === 0) incompleteMsgs.push("Foto Boleta");

                  if (incompleteMsgs.length > 0) {
                     rowBgColor = "#ffedd5"; // Naranja (Incompleto)
                  } else {
                     rowBgColor = "#dcfce7"; // Verde (Completo)
                  }
                }

                return (
                <tr key={item.id} style={{ transition: "background 0.15s", backgroundColor: rowBgColor }}>
                  {/* ESTADO DE COLOR Y MSJ ALERTA */}
                  <td data-label="Estado" style={{ textAlign: "center", borderRight: "2px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ 
                      width: "10px", 
                      height: "10px", 
                      borderRadius: "50%", 
                      margin: "0 auto", 
                      backgroundColor: rowBgColor === "#f1f5f9" ? "#64748b" : rowBgColor === "#dcfce7" ? "#16a34a" : rowBgColor === "#ffedd5" ? "#ea580c" : "#dc2626",
                      boxShadow: `0 0 0 3px ${rowBgColor === "#f1f5f9" ? "rgba(100, 116, 139, 0.2)" : rowBgColor === "#dcfce7" ? "rgba(22, 163, 74, 0.2)" : rowBgColor === "#ffedd5" ? "rgba(234, 88, 12, 0.2)" : "rgba(220, 38, 38, 0.2)"}`
                    }} />
                  </td>
                  
                  {/* PRODUCTO */}
                  <td data-label="Producto" style={{ padding: "var(--spacing-md)", position: "relative" }}>
                    <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                      <div style={{ fontWeight: 800, fontSize: "14px", color: rowBgColor === "#ffedd5" ? "#9a3412" : rowBgColor === "#fee2e2" ? "#7f1d1d" : rowBgColor === "#f1f5f9" ? "#334155" : "inherit", textDecoration: item.noSeCompro ? "line-through" : "none", textAlign: "right" }}>{item.nombre}</div>
                      
                      {item.esAdicional && (
                        <span style={{ fontSize: "9px", padding: "2px 8px", borderRadius: "10px", backgroundColor: "rgba(0,0,0,0.1)", display: "inline-block" }}>ADICIONAL</span>
                      )}

                      {item.noSeCompro && (
                        <div style={{ fontSize: "10px", color: "white", backgroundColor: "#64748b", padding: "4px 8px", borderRadius: "12px", fontWeight: "bold" }}>
                          NO COMPRADO
                        </div>
                      )}

                      {!item.noSeCompro && incompleteMsgs.length > 0 && item.cantidadComprada > 0 && (
                        <div style={{ fontSize: "11px", color: "#c2410c", fontWeight: 700, textAlign: "right" }}>
                          Falta: {incompleteMsgs.join(", ")}
                        </div>
                      )}
                      {!item.noSeCompro && item.cantidadComprada <= 0 && (
                        <div style={{ fontSize: "11px", color: "#991b1b", fontWeight: 700, textAlign: "right" }}>
                          Sin reporte de stock hoy.
                        </div>
                      )}
                      
                      {!isOwnerMode && (
                        <div style={{ marginTop: "8px", width: "100%", display: "flex", justifyContent: "flex-end" }}>
                          <label style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", color: "#475569", fontWeight: "bold", userSelect: "none", backgroundColor: "#f1f5f9", padding: "6px 10px", borderRadius: "6px" }}>
                            <input 
                              type="checkbox" 
                              checked={item.noSeCompro || false}
                              style={{ width: "16px", height: "16px" }}
                              onChange={(e) => {
                                updateItem(item.id, "noSeCompro", e.target.checked);
                                let updatedItem = {...item, noSeCompro: e.target.checked};
                                if (e.target.checked) {
                                  updateItem(item.id, "cantidadComprada", 0);
                                  updateItem(item.id, "costoUnitario", 0);
                                  updateItem(item.id, "proveedor", "");
                                  updatedItem = {...updatedItem, cantidadComprada: 0, costoUnitario: 0, proveedor: ""};
                                }
                                saveItemToBackend(updatedItem);
                              }} 
                              disabled={isFormDisabled}
                            />
                            No se compró
                          </label>
                        </div>
                      )}
                    </div>
                  </td>
                  
                  {/* CANTIDAD */}
                  <td data-label="Cant. Física" style={{ textAlign: "center" }}>
                    <input 
                      type="number" step="0.1" placeholder=""
                      value={item.cantidadComprada || ""} 
                      onChange={(e) => updateItem(item.id, "cantidadComprada", Number(e.target.value))} 
                      onBlur={() => saveItemToBackend(item)}
                      disabled={item.noSeCompro || isOwnerMode || isFormDisabled}
                      style={{ width: "80px", padding: "8px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", textAlign: "center", fontSize: "var(--font-sm)", fontWeight: 700, opacity: item.noSeCompro ? 0.4 : 1 }}
                    />
                  </td>

                  {/* UNIDAD */}
                  <td data-label="Unidad" style={{ textAlign: "center" }}>
                      <select 
                        value={item.unidadCompra} 
                        onChange={(e) => {
                          updateItem(item.id, "unidadCompra", e.target.value);
                          saveItemToBackend({...item, unidadCompra: e.target.value});
                        }} 
                        disabled={item.noSeCompro || isOwnerMode || isFormDisabled}
                        style={{ padding: "8px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "var(--font-xs)", fontWeight: 600, backgroundColor: "white", cursor: "pointer", opacity: item.noSeCompro ? 0.4 : 1 }}
                      >
                        {unidadesCompra.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                  </td>

                  {/* COSTO UNITARIO */}
                  <td data-label="Costo Unit." style={{ textAlign: "center" }}>
                    <div style={{ position: "relative", width: "95px", margin: "0 auto", opacity: item.noSeCompro ? 0.4 : 1 }}>
                      <span style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", fontSize: "11px", color: "var(--text-muted)", fontWeight: 700 }}>S/</span>
                      <input 
                        type="number" step="0.01" placeholder=""
                        value={item.costoUnitario || ""} 
                        onChange={(e) => updateItem(item.id, "costoUnitario", Number(e.target.value))} 
                        onBlur={() => saveItemToBackend(item)}
                        disabled={item.noSeCompro || isOwnerMode || isFormDisabled}
                        style={{ width: "100%", padding: "8px 8px 8px 24px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontWeight: 700, fontSize: "var(--font-sm)" }}
                      />
                    </div>
                  </td>

                  {/* TOTAL */}
                  <td data-label="Total (S/)" style={{ textAlign: "center", backgroundColor: item.noSeCompro ? "transparent" : "rgba(0,0,0,0.03)", opacity: item.noSeCompro ? 0.4 : 1 }}>
                    <span style={{ fontSize: "var(--font-base)", fontWeight: 800, color: item.noSeCompro ? "#94a3b8" : "inherit" }}>
                      S/ {item.montoTotal.toFixed(2)}
                    </span>
                  </td>

                  {/* PROVEEDOR */}
                  <td data-label="Proveedor" style={{ textAlign: "center" }}>
                    <select 
                      value={item.proveedor} 
                      onChange={(e) => {
                        updateItem(item.id, "proveedor", e.target.value);
                        saveItemToBackend({...item, proveedor: e.target.value});
                      }} 
                      disabled={item.noSeCompro || isOwnerMode || isFormDisabled}
                      style={{ width: "140px", padding: "8px 6px", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "10px", fontWeight: 700, backgroundColor: "white", cursor: "pointer", opacity: item.noSeCompro ? 0.4 : 1 }}
                    >
                      <option value=""></option>
                      {PROVEEDORES_SIMULADOS.map(prov => (
                        <option key={prov.id} value={prov.id}>{prov.nombre}</option>
                      ))}
                    </select>
                  </td>

                  {/* BOLETA / FOTO */}
                  <td data-label="Boleta" style={{ textAlign: "center" }}>
                    <button 
                      onClick={() => setActivePhotoModal(item.id)}
                      style={{ 
                        padding: "6px 14px", 
                        backgroundColor: item.fotos.length > 0 ? "rgba(22,163,74,0.12)" : "white", 
                        color: item.fotos.length > 0 ? "#16a34a" : "var(--primary)", 
                        border: `2px solid ${item.fotos.length > 0 ? "#16a34a" : "var(--border)"}`, 
                        borderRadius: "20px", fontWeight: 800, fontSize: "10px", cursor: "pointer"
                      }}
                    >
                      {item.fotos.length > 0 ? `${item.fotos.length} foto(s)` : `Subir Foto`}
                    </button>
                  </td>

                  {/* ELIMINAR (SOLO DUEÑO) - REMOVIDO PARA MODO AUDITORIA ESTRICTO */}

                </tr>
              )})}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: "center", padding: "60px 20px" }}>

                    <Search size={36} style={{ margin: "0 auto 10px", display: "block", opacity: 0.1 }} />
                    <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>No hay asignaciones para este trabajador.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── BOTÓN GUARDAR ── */}
      {!isOwnerMode && (
        <div style={{ textAlign: "right", marginTop: "var(--spacing-xl)" }}>
          <button 
            onClick={validarYGuardar}
            disabled={isFormDisabled}
            style={{ 
              backgroundColor: "var(--primary)", color: "white", border: "none", 
              padding: "14px 40px", borderRadius: "var(--radius-md)", 
              fontSize: "var(--font-sm)", fontWeight: 800, cursor: "pointer", 
              display: "inline-flex", alignItems: "center", gap: "8px",
              boxShadow: "0 4px 14px rgba(255,69,0,0.3)"
            }}
          >
            <Save size={16} /> GUARDAR MÁS INFORMACIÓN
          </button>
        </div>
      )}

      {/* ══════ MODALES ══════ */}
      {showAddModal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(3px)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div className="card" style={{ padding: "var(--spacing-xl)", width: "480px", borderTop: "4px solid #0f766e" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--spacing-lg)" }}>
              <h3 style={{ margin: 0, fontWeight: 800, fontSize: "var(--font-lg)" }}>
                Añadir Extra para {selectedWorkerView}
              </h3>
              <button onClick={() => setShowAddModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)" }}><X size={20} /></button>
            </div>
            {/* Minimal inputs para extraer lógica */}
            <div style={{ marginBottom: "var(--spacing-lg)" }}>
              <label style={{ fontSize: "12px", fontWeight: 700, display: "block", marginBottom: "6px" }}>Nombre del Producto</label>
              <input type="text" value={newAdicional.nombre} onChange={e => setNewAdicional({...newAdicional, nombre: e.target.value})} style={{ width: "100%", padding: "10px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontSize: "14px", fontWeight: 700 }} />
            </div>
            <div style={{ display: "flex", gap: "var(--spacing-md)" }}>
              <button onClick={() => setShowAddModal(false)} style={{ flex: 1, padding: "12px", border: "1px solid var(--border)"}}>CANCELAR</button>
              <button onClick={agregarAdicional} style={{ flex: 1, padding: "12px", backgroundColor: "#0f766e", color: "white", border: "none" }}>AÑADIR A TABLA</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Fotos (Abridged check due to text length, core mechanics maintained) */}
      {activePhotoModal && (() => {
        const item = allItems.find(i => i.id === activePhotoModal);
        if (!item) return null;
        return (
          <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", zIndex: 10000, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <div className="card" style={{ padding: "var(--spacing-xl)", width: "500px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--spacing-lg)" }}>
                <h3 style={{ margin: 0, fontWeight: 800 }}>Boletas - {item.nombre}</h3>
                <button onClick={() => setActivePhotoModal(null)} style={{ border: "none", background: "none", cursor: "pointer" }}><X size={20} /></button>
              </div>
              <div style={{ position: "relative", border: "1px dashed #ccc", padding: "40px", textAlign: "center", borderRadius: "8px", marginBottom: "20px" }}>
                <input type="file" multiple onChange={(e) => handlePhotoUpload(e, item.id)} style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", opacity: 0, cursor: "pointer" }} />
                <Camera size={24} style={{ opacity: 0.5, marginBottom: "8px" }} />
                <p style={{ margin: 0, fontSize: "14px", fontWeight: "bold", color: "#666" }}>Toca aquí para seleccionar fotos</p>
              </div>
              {item.fotos.length > 0 && (
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "20px" }}>
                    {item.fotos.map((f, i) => (
                      <div key={i} style={{ width: "100px", height: "100px", position: "relative" }}>
                         <img src={f} alt={`foto`} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "6px" }} />
                         <button onClick={() => removePhoto(item.id, i)} style={{ position:"absolute", top: 4, right: 4, background: "red", color: "white", border: "none", borderRadius: "50px", width: "24px", height: "24px", cursor: "pointer" }}><Trash2 size={12}/></button>
                      </div>
                    ))}
                 </div>
              )}
              <button onClick={() => setActivePhotoModal(null)} style={{ width: "100%", padding: "12px", backgroundColor: "var(--primary)", color: "white", border: "none", borderRadius: "6px", fontWeight: "bold", cursor: "pointer" }}>GUARDAR Y CERRAR FOTOS</button>
            </div>
          </div>
        );
      })()}

    </div>
  );
}
