"use client";

import { useState, useEffect } from "react";
import { Package, TrendingDown, History, AlertCircle, Save, Lock, Clock, UserCircle, CheckCircle2, Trash2 } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backent-sierralta.onrender.com';

interface InventoryRecord {
  id: string; // Puede ser el nombre corto
  producto: string;
  stockAnterior: number; // Por defecto lo que había
  unidad: string;
  merma: number;
  motivoMerma: string;
  detalleOtro: string;
  stockActual: number; // auto-calculado: stockAnterior - merma
  noHuboSobrante?: boolean;
  noHuboMerma?: boolean;
}


const MOTIVOS_MERMA = [
  "Daño en el transporte",
  "Maduración excesiva",
  "Perdida de productos",
  "Mal estado proveedor",
  "Otro"
];

const DEFAULT_INVENTORY = [
  { id: "PLATANO", producto: "PLATANO", stockAnterior: 15, unidad: "Kg", merma: 0, motivoMerma: "", detalleOtro: "", stockActual: 15 },
  { id: "FRESA", producto: "FRESA", stockAnterior: 8, unidad: "Taper", merma: 0, motivoMerma: "", detalleOtro: "", stockActual: 8 },
  { id: "PAPA HUAYRO", producto: "PAPA HUAYRO", stockAnterior: 12, unidad: "Kg", merma: 0, motivoMerma: "", detalleOtro: "", stockActual: 12 },
  { id: "ZANAHORIA", producto: "ZANAHORIA", stockAnterior: 5, unidad: "Kg", merma: 0, motivoMerma: "", detalleOtro: "", stockActual: 5 },
  { id: "CEBOLLA ROJA", producto: "CEBOLLA ROJA", stockAnterior: 20, unidad: "Kg", merma: 0, motivoMerma: "", detalleOtro: "", stockActual: 20 },
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
    return yesterday.toISOString().split("T")[0];
  }
  return now.toISOString().split("T")[0];
};

export default function Inventario() {
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [role, setRole] = useState<string>("trabajador");
  const [userName, setUserName] = useState<string>("Trabajador");
  const [mounted, setMounted] = useState(false);
  const [fechaFiltro, setFechaFiltro] = useState<string>(getOperativeDate());
  const [selectedWorkerView, setSelectedWorkerView] = useState<string>("Daniel");
  const [prorrogaTime, setProrrogaTime] = useState<number>(0);
  
  // Variables de Bloqueo Temporal
  const [isLockedPhase, setIsLockedPhase] = useState(false);
  const [statusTimerMsg, setStatusTimerMsg] = useState("");
  const [unidades, setUnidades] = useState<string[]>([]);

  useEffect(() => {
    fetch(`${API_URL}/unidades`)
      .then(res => res.json())
      .then(data => setUnidades(data.map((u: any) => u.nombre)))
      .catch(console.error);
  }, []);

  const isOwnerMode = role === "dueño" || role === "admin";
  const targetWorker = isOwnerMode ? selectedWorkerView : userName;

  useEffect(() => {
    setMounted(true);
    const currentRole = localStorage.getItem("user_role")?.toLowerCase() || "trabajador";
    const uName = localStorage.getItem("user_name") || "Trabajador";
    setRole(currentRole);
    setUserName(uName);
    
    if (currentRole !== 'admin' && currentRole !== 'dueño' && selectedWorkerView !== uName) {
       setSelectedWorkerView(uName);
    }

    const loadTarget = currentRole === "admin" || currentRole === "dueño" ? selectedWorkerView : uName;

    const checkTime = () => {
      const now = new Date();
      const horaActual = now.getHours();
      let enRango = horaActual >= 3 && horaActual < 15; // 3 AM a 3 PM

      let prorroga = prorrogaTime || 0;

      let msg = "";
      if (now.getTime() < prorroga) {
         enRango = true;
         msg = `Prórroga activa (Faltan ${Math.floor((prorroga - now.getTime()) / 60000)}m)`;
      } else if (enRango) {
         const rem = (15 - horaActual) * 60 - now.getMinutes();
         msg = `${Math.floor(rem / 60)}h ${rem % 60}m restantes`;
      } else {
         msg = "CERRADO (Fuera de horario 3:00 AM - 3:00 PM)";
      }

      setIsLockedPhase(!enRango);
      setStatusTimerMsg(msg);
    };

    checkTime();
    const interval = setInterval(checkTime, 60000);

    // Cargar datos inicialmente
    cargarDatosDia(fechaFiltro, loadTarget);

    const doSync = () => {
       cargarDatosDia(fechaFiltro, loadTarget);
       checkTime();
    };

    doSync();
    const syncInterval = setInterval(doSync, 4000);

    return () => {
      clearInterval(interval);
      clearInterval(syncInterval);
    };
  }, [selectedWorkerView, fechaFiltro]);

  const cargarDatosDia = async (dateStr: string, activeTgt: string) => {
    try {
      const [resInv, resAsignaciones, resUsers] = await Promise.all([
        fetch(`${API_URL}/inventario?fecha=${dateStr}`),
        fetch(`${API_URL}/usuarios/asignaciones`),
        fetch(`${API_URL}/usuarios`)
      ]);
      
      const serverData = await resInv.json();
      const asignacionesDict = await resAsignaciones.json();
      const usersData = await resUsers.json();
      
      const currentUser = usersData.find((u: any) => u.nombre.toLowerCase() === activeTgt.toLowerCase());
      if (currentUser && currentUser.prorroga_hasta) {
        setProrrogaTime(new Date(currentUser.prorroga_hasta).getTime());
      }
      
      // Búsqueda insensible a mayúsculas/minúsculas
      const assignedProducts = Object.entries(asignacionesDict).find(
        ([key]) => key.toLowerCase() === activeTgt.toLowerCase()
      )?.[1] as string[] || [];
      
      const invDelTrabajador = serverData.filter((i: any) => i.trabajador?.nombre.toLowerCase() === activeTgt.toLowerCase());
      
      let masterData = invDelTrabajador.map((p: any) => ({
        id: p.id || `inv-${p.producto?.nombre || "DESCONOCIDO"}`,
        producto: p.producto?.nombre || "DESCONOCIDO",
        stockAnterior: Number(p.stock_guardado) || 0,
        unidad: p.unidad || "Kg",
        merma: Number(p.merma) || 0,
        motivoMerma: p.motivo_merma || "",
        detalleOtro: p.detalle_otro || "",
        stockActual: (Number(p.stock_guardado) || 0) - (Number(p.merma) || 0),
        noHuboSobrante: p.no_hubo_sobrante || false,
        noHuboMerma: p.no_hubo_merma || false
      }));

      if (assignedProducts.length > 0) {
        masterData = masterData.filter((item: any) => assignedProducts.includes(item.producto.toUpperCase()));
        // Crear en blanco si faltan
        assignedProducts.forEach((pap: string) => {
            if (!masterData.find((m: any) => m.producto.toUpperCase() === pap)) {
              masterData.push({ id: pap, producto: pap, stockAnterior: 0, unidad: "Kg", merma: 0, motivoMerma: "", detalleOtro: "", stockActual: 0 });
            }
        });
      }

        setRecords(prev => {
           if (isOwnerMode) return masterData;
           if (prev.length === 0) return masterData;
           
           const merged = [...prev];
           masterData.forEach((mItem: any) => {
              if (!merged.find(p => p.producto === mItem.producto)) {
                 merged.push(mItem);
              }
           });
           return merged;
        });
    } catch (error) {
      console.error("Error fetching data from backend", error);
    }
  };

  const grantTime = async (minutes: number) => {
    const rawExt = localStorage.getItem("workers_extra_time");
    const extObj = rawExt ? JSON.parse(rawExt) : {};
    extObj[selectedWorkerView] = Date.now() + (minutes * 60000);
    localStorage.setItem("workers_extra_time", JSON.stringify(extObj));
    
    try {
       await fetch('/api/sync', { method: 'POST', body: JSON.stringify({ "workers_extra_time": extObj }) });
    } catch(e) {}

    alert(`Otorgados ${minutes} mins a ${selectedWorkerView}.`);
    window.location.reload(); 
  };

  const eliminarAsignacion = async (idToRemove: string, productName: string) => {
    if (!window.confirm(`¿Seguro que deseas eliminar permanentemente a ${productName} de las asignaciones de ${selectedWorkerView}?`)) return;

    setRecords(records.filter(r => r.id !== idToRemove));

    let assignedUpdated = null;
    let itemsUpdated = null;

    const rawAsignaciones = localStorage.getItem("workers_assignments");
    if (rawAsignaciones) {
        const parsed = JSON.parse(rawAsignaciones);
        if (parsed[selectedWorkerView]) {
            parsed[selectedWorkerView] = parsed[selectedWorkerView].filter((p: string) => p !== productName.toUpperCase());
            assignedUpdated = parsed;
            localStorage.setItem("workers_assignments", JSON.stringify(parsed));
        }
    }

    const saveKey = `inventario_dia_${fechaFiltro}_${selectedWorkerView}`;
    const guardado = localStorage.getItem(saveKey);
    if (guardado) {
        let savedRecords = JSON.parse(guardado);
        savedRecords = savedRecords.filter((r: any) => r.id !== idToRemove);
        itemsUpdated = savedRecords;
        localStorage.setItem(saveKey, JSON.stringify(savedRecords));
    }

    try {
       const payload: any = {};
       if (assignedUpdated) payload["workers_assignments"] = assignedUpdated;
       if (itemsUpdated) payload[saveKey] = itemsUpdated;
       await fetch('/api/sync', { method: 'POST', body: JSON.stringify(payload) });
    } catch(e) {}
  };

  const updateRecord = (id: string, field: keyof InventoryRecord, val: any) => {
    setRecords(prev => prev.map(r => {
      if (r.id !== id) return r;
      const nw = { ...r, [field]: val };
      
      if (field === 'noHuboSobrante' && val === true) {
        nw.stockAnterior = 0;
      }
      if (field === 'noHuboMerma' && val === true) {
        nw.merma = 0;
        nw.motivoMerma = "";
      }

      if (field === 'stockAnterior' || field === 'merma' || field === 'noHuboSobrante' || field === 'noHuboMerma') {
         nw.stockActual = (nw.stockAnterior || 0) - (nw.merma || 0);
         if (nw.stockActual < 0) nw.stockActual = 0; 
      }
      return nw;
    }));
  };

  const saveRecordToBackend = async (item: InventoryRecord) => {
    const userId = Number(localStorage.getItem("user_id"));
    if (!userId) return;

    const payload = [{
      fecha: fechaFiltro,
      trabajador_id: userId,
      producto_nombre: item.producto,
      stock_guardado: item.stockAnterior,
      unidad: item.unidad,
      merma: item.merma,
      motivo_merma: item.motivoMerma,
      detalle_otro: item.detalleOtro,
      no_hubo_sobrante: item.noHuboSobrante,
      no_hubo_merma: item.noHuboMerma
    }];

    try {
      const res = await fetch(`${API_URL}/inventario/sync`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload) 
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Error del servidor: ${err.message || 'Error desconocido'}`);
      }
    } catch(e) {
      console.error("Error auto-saving inventory", e);
      alert("Error de conexión al guardar el item.");
    }
  };

  const saveInventory = async () => {
    if (isLockedPhase && (role === "trabajador")) {
       alert("No tienes permiso de guardar fuera de horario.");
       return;
    }
    const userId = Number(localStorage.getItem("user_id"));
    if (!userId) return alert("Error: Usuario no identificado.");

    const payload = records.map(item => ({
      fecha: fechaFiltro,
      trabajador_id: userId,
      producto_nombre: item.producto,
      stock_guardado: item.stockAnterior,
      unidad: item.unidad,
      merma: item.merma,
      motivo_merma: item.motivoMerma,
      detalle_otro: item.detalleOtro,
      no_hubo_sobrante: item.noHuboSobrante,
      no_hubo_merma: item.noHuboMerma
    }));

    try {
       const res = await fetch(`${API_URL}/inventario/sync`, { 
         method: 'POST', 
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(payload) 
       });
       if (!res.ok) {
         const err = await res.json();
         alert(`Error del servidor: ${err.message || 'Error desconocido'}`);
       } else {
         alert(`Inventario del ${fechaFiltro} guardado exitosamente.`);
       }
    } catch(e) {
       console.error("Error al guardar", e);
       alert("Error de conexión al guardar.");
    }
  };


  if (!mounted) return null;

  const isPastDate = fechaFiltro !== new Date().toISOString().split("T")[0];
  const effectivelyReadOnly = isOwnerMode || isLockedPhase || isPastDate;

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "80px", width: "100%" }}>
      <header style={{ marginBottom: isOwnerMode ? "var(--spacing-md)" : "var(--spacing-lg)", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 8px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <Package size={24} color="var(--primary)"/> Control de Stock y Mermas
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
             {isOwnerMode ? "Vista de sólo lectura y auditoría por cada trabajador de la tienda." : "Visualiza y actualiza los sobrantes de tus productos asignados."}
          </p>
        </div>
        
        <div style={{ textAlign: "right" }}>
           <input 
             type="date" 
             value={fechaFiltro}
             onChange={e => setFechaFiltro(e.target.value)}
             style={{ padding: "8px 12px", border: "2px solid var(--border)", borderRadius: "var(--radius-md)", fontWeight: 700, marginBottom: "8px" }}
           />
           {!isOwnerMode && (
             <div style={{ padding: "6px 12px", backgroundColor: isLockedPhase ? "#fef2f2" : "#f0fdf4", color: isLockedPhase ? "#dc2626" : "#16a34a", borderRadius: "16px", fontSize: "11px", fontWeight: 800, display: "flex", alignItems: "center", gap: "6px", border: `1px solid ${isLockedPhase ? '#fca5a5' : '#bbf7d0'}` }}>
               {isLockedPhase ? <Lock size={12} /> : <Clock size={12} />}
               {statusTimerMsg}
             </div>
           )}
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
          <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "4px" }}>
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
        </div>
      )}

      {/* Tip Info Verde */}
      {!isOwnerMode && (
        <div style={{ padding: "var(--spacing-md)", backgroundColor: "rgba(22, 163, 74, 0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(22, 163, 74, 0.2)", display: "flex", alignItems: "flex-start", gap: "var(--spacing-md)", marginBottom: "var(--spacing-md)" }}>
          <AlertCircle size={18} color="var(--success)" style={{ flexShrink: 0, marginTop: "2px" }} />
          <p style={{ margin: 0, fontSize: "var(--font-xs)", color: "var(--success)" }}>
            <strong>Importante:</strong> Registra la cantidad de inventario que "quedó" hoy en la columna <strong>Stock Guardado</strong>. Si hubo pérdidas o podredumbre, ingrésalo en <strong>Merma</strong> y elige el motivo correspondiente para que calculen el remanente real al final.
          </p>
        </div>
      )}

      {/* ── ALERTA DE INVENTARIO REMOVIDA A PETICIÓN ── */}

      
      {isOwnerMode && (
        <div style={{ padding: "12px 16px", backgroundColor: "#eff6ff", color: "#1e3a8a", border: "1px solid #bfdbfe", borderRadius: "8px", marginBottom: "24px", fontSize: "12px", fontWeight: "bold", display: "flex", justifyContent: "space-between" }}>
          <span>MODO AUDITORÍA (Solo Lectura): Estás visualizando los registros de <strong>{selectedWorkerView}</strong>.</span>
          <span>{statusTimerMsg}</span>
        </div>
      )}

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ overflowX: "auto" }}>
          <table className="compact-table" style={{ minWidth: "100%", whiteSpace: "nowrap" }}>
            <thead>
              <tr style={{ backgroundColor: "#f8f9fa" }}>
                <th style={{ width: "40px", textAlign: "center" }}>Est</th>
                <th style={{ width: "220px", minWidth: "220px" }}>Producto Asignado</th>
                <th style={{ width: "120px", textAlign: "center" }}>Stock Guardado<br/><span style={{fontSize: "9px", color:"#666"}}>(Sobrante Físico)</span></th>
                <th style={{ width: "130px", textAlign: "center" }}>Presentación<br/><span style={{fontSize: "9px", color:"#666"}}>(Unidad)</span></th>
                <th style={{ width: "110px", textAlign: "center", backgroundColor: "rgba(239, 68, 68, 0.05)", color: "#b91c1c" }}>Merma / Pérdida<br/><span style={{fontSize: "9px", color:"#666"}}>(Descuento)</span></th>
                <th style={{ width: "200px", textAlign: "center" }}>Motivo de Mermado</th>
                <th style={{ width: "140px", textAlign: "center", backgroundColor: "rgba(22, 163, 74, 0.05)", color: "#15803d" }}>STOCK ACTUAL<br/><span style={{fontSize: "9px", color:"#666"}}>(Stock Guardado - Merma)</span></th>
                {isOwnerMode && <th style={{ textAlign: "center", width: "50px" }}>Del</th>}
              </tr>
            </thead>
            <tbody>
              {records.map(rec => {
                let rowBgColor = "transparent";
                if ((!rec.stockAnterior || rec.stockAnterior <= 0) && !rec.noHuboSobrante) {
                    rowBgColor = "#fee2e2"; // Rojo si está vacío y no ha marcado "No hubo sobrante"
                } else {
                    rowBgColor = "#dcfce7"; // Verde si ya tiene stock registrado o marcó "No hubo sobrante"
                }

                return (
                <tr key={rec.id} style={{ transition: "background 0.15s", backgroundColor: rowBgColor }}>
                  {/* ESTADO */}
                  <td data-label="Estado" style={{ textAlign: "center", borderRight: "2px solid rgba(0,0,0,0.05)" }}>
                    <div style={{ width: "12px", height: "12px", borderRadius: "50%", margin: "0 auto", backgroundColor: rowBgColor === "#dcfce7" ? "#16a34a" : "#dc2626" }} />
                  </td>

                  <td data-label="Producto" style={{ padding: "16px" }}>
                    <div style={{ fontWeight: 800, fontSize: "13px", color: rowBgColor === "#fee2e2" ? "#7f1d1d" : "inherit" }}>{rec.producto}</div>
                    {(!rec.stockAnterior || rec.stockAnterior <= 0) && !rec.noHuboSobrante && (
                      <div style={{ fontSize: "9px", color: "#991b1b", marginTop: "4px", fontWeight: 700 }}>
                        Falta informar stock del día
                      </div>
                    )}

                    {!effectivelyReadOnly && (
                      <div style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <label style={{ fontSize: "10px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#475569", fontWeight: "bold", userSelect: "none" }}>
                          <input 
                            type="checkbox" 
                            checked={rec.noHuboSobrante || false}
                            onChange={(e) => {
                              updateRecord(rec.id, "noHuboSobrante", e.target.checked);
                              let updatedRec = {...rec, noHuboSobrante: e.target.checked};
                              if (e.target.checked) updatedRec.stockAnterior = 0;
                              saveRecordToBackend(updatedRec);
                            }} 
                            disabled={effectivelyReadOnly}
                          />
                          No hubo sobrante
                        </label>
                        <label style={{ fontSize: "10px", display: "flex", alignItems: "center", gap: "6px", cursor: "pointer", color: "#475569", fontWeight: "bold", userSelect: "none" }}>
                          <input 
                            type="checkbox" 
                            checked={rec.noHuboMerma || false}
                            onChange={(e) => {
                              updateRecord(rec.id, "noHuboMerma", e.target.checked);
                              let updatedRec = {...rec, noHuboMerma: e.target.checked};
                              if (e.target.checked) { updatedRec.merma = 0; updatedRec.motivoMerma = ""; }
                              saveRecordToBackend(updatedRec);
                            }} 
                            disabled={effectivelyReadOnly}
                          />
                          No hubo merma
                        </label>
                      </div>
                    )}
                  </td>
                  
                  {/* Stock Inicial / Sobrante */}
                  <td data-label="Stock Guardado" style={{ textAlign: "center" }}>
                    <input 
                      type="number" step="0.1" min="0" placeholder=""
                      value={rec.stockAnterior || ""}
                      onChange={e => updateRecord(rec.id, 'stockAnterior', Number(e.target.value))}
                      onBlur={() => saveRecordToBackend(rec)}
                      disabled={effectivelyReadOnly || rec.noHuboSobrante}
                      style={{ width: "80px", padding: "8px", textAlign: "center", borderRadius: "6px", border: "1px solid var(--border)", fontWeight: "bold", opacity: rec.noHuboSobrante ? 0.4 : 1 }}
                    />
                  </td>

                  {/* Unidad */}
                  <td data-label="Presentación" style={{ textAlign: "center" }}>
                      <select 
                        value={rec.unidad}
                        onChange={e => {
                          updateRecord(rec.id, 'unidad', e.target.value);
                          saveRecordToBackend({...rec, unidad: e.target.value});
                        }}
                        disabled={effectivelyReadOnly}
                        style={{ padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: effectivelyReadOnly ? "transparent" : "white" }}
                      >
                        {unidades.map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                  </td>

                  {/* Merma */}
                  <td data-label="Merma / Pérdida" style={{ textAlign: "center", backgroundColor: "rgba(239, 68, 68, 0.02)" }}>
                    <input 
                      type="number" step="0.1" min="0" placeholder=""
                      value={rec.merma || ""}
                      onChange={e => updateRecord(rec.id, 'merma', Number(e.target.value))}
                      onBlur={() => saveRecordToBackend(rec)}
                      disabled={effectivelyReadOnly || rec.noHuboMerma}
                      style={{ width: "80px", padding: "8px", textAlign: "center", borderRadius: "6px", border: "1px solid var(--border)", fontWeight: "bold", color: "#b91c1c", opacity: rec.noHuboMerma ? 0.4 : 1 }}
                    />
                  </td>

                  {/* Motivos */}
                  <td data-label="Motivo de Mermado" style={{ textAlign: "center", padding: "8px" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px", alignItems: "center" }}>
                      <select 
                        value={rec.motivoMerma}
                        onChange={e => {
                          updateRecord(rec.id, 'motivoMerma', e.target.value);
                          saveRecordToBackend({...rec, motivoMerma: e.target.value});
                        }}
                        disabled={effectivelyReadOnly || rec.merma <= 0 || rec.noHuboMerma}
                        style={{ width: "180px", padding: "8px", borderRadius: "6px", border: "1px solid var(--border)", backgroundColor: (effectivelyReadOnly || rec.noHuboMerma) ? "transparent" : "white", fontSize: "11px", opacity: rec.noHuboMerma ? 0.4 : 1 }}
                      >
                        <option value="">-- Sin Merma --</option>
                        {MOTIVOS_MERMA.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                      
                      {rec.motivoMerma === "Otro" && (
                        <input 
                          type="text" placeholder="Escriba detalle del motivo"
                          value={rec.detalleOtro}
                          onChange={e => updateRecord(rec.id, 'detalleOtro', e.target.value)}
                          onBlur={() => saveRecordToBackend(rec)}
                          disabled={effectivelyReadOnly}
                          style={{ width: "180px", padding: "6px", borderRadius: "4px", border: "1px solid #f59e0b", fontSize: "10px" }}
                        />
                      )}
                    </div>
                  </td>

                  {/* Stock Actual Auto Calculado */}
                  <td data-label="Stock Actual" style={{ textAlign: "center", backgroundColor: "rgba(22, 163, 74, 0.05)", fontWeight: 800, fontSize: "16px", color: rec.stockActual > 0 ? "#15803d" : "#94a3b8" }}>
                    {rec.stockActual.toFixed(2)} <span style={{fontSize: "12px"}}>{rec.unidad}</span>
                  </td>

                  {/* ELIMINAR (SOLO DUEÑO) */}
                  {isOwnerMode && (
                    <td data-label="Acciones" style={{ textAlign: "center", padding: "8px" }}>
                      <button 
                        onClick={() => eliminarAsignacion(rec.id, rec.producto)} 
                        style={{ background: "#ef4444", color: "white", border: "none", borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
                        <Trash2 size={12} />
                      </button>
                    </td>
                  )}

                </tr>

              )})}
              {records.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "50px 20px", color: "var(--text-muted)", fontStyle: "italic" }}>
                    {isOwnerMode ? `No hay asignaciones o registros para ${selectedWorkerView}.` : "El dueño no te ha asignado ningún producto para realizar el registro de inventario hoy."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(!effectivelyReadOnly && records.length > 0) && (
        <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end" }}>
          <button 
            onClick={saveInventory}
            style={{ backgroundColor: "var(--primary)", color: "white", padding: "14px 40px", borderRadius: "8px", border: "none", fontWeight: "bold", fontSize: "14px", cursor: "pointer", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 12px rgba(255, 69, 0, 0.2)" }}
          >
            <Save size={18} /> CONFIRMAR Y GUARDAR INVENTARIO 
          </button>
        </div>
      )}

    </div>
  );
}
