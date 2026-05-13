"use client";

import { useState, useEffect } from "react";
import { Users, Clock, Package, Check, Save, UserCheck, Timer } from "lucide-react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://backent-sierralta.onrender.com';

// Trabajadores requeridos
const WORKERS = ['Daniel', 'Jesus', 'Alex', 'Yamilet', 'Victor', 'Abraham', 'Fabricio'];

// Lista amplia de productos para ejemplos
const AVAILABLE_PRODUCTS = [
  "PLATANO", "FRESA", "BRÓCOLI BANDEJA", "TOMATE ESPECIAL", 
  "PAPA HUAYRO", "CEBOLLA ROJA", "AJÍ AMARILLO", "AGUAYMANTO",
  "MANZANA ISRAEL", "MANGO KENT", "PAPA BLANCA", "ZANAHORIA"
];

export default function EquipoConfig() {
  const [role, setRole] = useState<string | null>(null);
  
  const [assignments, setAssignments] = useState<Record<string, string[]>>({});
  const [extensions, setExtensions] = useState<Record<string, number>>({});
  const [selectedWorker, setSelectedWorker] = useState<string>(WORKERS[0]);
  const [users, setUsers] = useState<any[]>([]); // New state for users

  useEffect(() => {
    setRole(localStorage.getItem("user_role")?.toLowerCase() || "trabajador");
    
    const fetchAsignaciones = async () => {
      try {
        const [resAsig, resUsers] = await Promise.all([
          fetch(`${API_URL}/usuarios/asignaciones`),
          fetch(`${API_URL}/usuarios`)
        ]);
        
        const data = await resAsig.json();
        const usersData = await resUsers.json();
        setUsers(usersData);

        if (data && Object.keys(data).length > 0) {
          setAssignments(data);
        } else {
          const defaults: Record<string, string[]> = {};
          WORKERS.forEach(w => defaults[w] = []);
          setAssignments(defaults);
        }
      } catch (error) {
        console.error("Error fetching asignaciones:", error);
      }
    };
    fetchAsignaciones();

    // Cargar si existe tiempo extra
    const storedExt = localStorage.getItem("workers_extra_time");
    if (storedExt) {
      setExtensions(JSON.parse(storedExt));
    }
  }, []);

  const saveAssignments = async () => {
    try {
      await fetch(`${API_URL}/usuarios/asignaciones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(assignments)
      });
      alert("Asignaciones guardadas correctamente en la Base de Datos");
    } catch (error) {
      alert("Error al guardar asignaciones en el servidor");
    }
  };

  const toggleProduct = (product: string) => {
    setAssignments(prev => {
      const wList = prev[selectedWorker] || [];
      if (wList.includes(product)) {
        return { ...prev, [selectedWorker]: wList.filter(p => p !== product) };
      } else {
        return { ...prev, [selectedWorker]: [...wList, product] };
      }
    });
  };

  const grantTime = async (minutes: number) => {
    const user = users.find(u => u.nombre === selectedWorker);
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

      alert(`Se ha otorgado ${minutes} minutos adicionales a ${selectedWorker}.`);
    } catch (e) {
      alert("Error al guardar prórroga en el backend.");
    }
  };

  const clearTime = async () => {
    const user = users.find(u => u.nombre === selectedWorker);
    if (!user) return;

    try {
      await fetch(`${API_URL}/usuarios/${user.id}/prorroga`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minutos: 0 }) // 0 means clear
      });
    } catch (e) {}
  };


  if (role !== "admin" && role !== "dueño") {
    return (
      <div style={{ padding: "100px", textAlign: "center" }}>
        <h2>Acceso Denegado</h2>
        <p>Solo el dueño tiene permiso para gestionar asignaciones y horarios al equipo.</p>
      </div>
    );
  }

  const isTimeGranted = extensions[selectedWorker] && extensions[selectedWorker] > Date.now();
  const workerList = assignments[selectedWorker] || [];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", paddingBottom: "100px", width: "100%" }}>
      <header style={{ marginBottom: "var(--spacing-xl)", borderBottom: "1px solid var(--border)", paddingBottom: "var(--spacing-md)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--spacing-sm)", color: "var(--primary)", fontWeight: 700, fontSize: "10px", marginBottom: "8px" }}>
          <Users size={14} /> GESTIÓN <span style={{ color: "var(--foreground)" }}>DE EQUIPO</span>
        </div>
        <h1 style={{ fontSize: "var(--font-xl)", fontWeight: 800, margin: "0 0 var(--spacing-sm) 0" }}>Control de Trabajadores</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "var(--font-sm)", margin: 0 }}>
          Asigna los productos que cada trabajador va a gestionar, y otórgales prórroga en caso requieran llenar "Registro de Compras" o "Inventario" fuera de su horario (3:00 AM a 3:00 PM).
        </p>
      </header>

      <div style={{ display: "flex", gap: "var(--spacing-xl)", flexWrap: "wrap" }}>
        {/* PANEL IZQUIERDO: SELECCIÓN DE TRABAJADOR Y HORARIOS */}
        <div style={{ flex: "1 1 300px" }}>
          <div className="card" style={{ padding: "var(--spacing-lg)", marginBottom: "var(--spacing-lg)" }}>
            <h3 style={{ margin: "0 0 var(--spacing-md) 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <UserCheck size={18} color="var(--primary)" /> Empleados
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
              {WORKERS.map(w => (
                <button
                  key={w}
                  onClick={() => setSelectedWorker(w)}
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    borderRadius: "var(--radius-md)",
                    fontWeight: 700,
                    border: "2px solid",
                    borderColor: selectedWorker === w ? "var(--primary)" : "transparent",
                    backgroundColor: selectedWorker === w ? "rgba(255, 69, 0, 0.05)" : "var(--secondary)",
                    cursor: "pointer",
                    color: selectedWorker === w ? "var(--primary)" : "var(--text-main)"
                  }}
                >
                  {w}
                  {(assignments[w] && assignments[w].length > 0) && (
                    <span style={{ float: "right", fontSize: "10px", backgroundColor: "#e2e8f0", padding: "2px 6px", borderRadius: "10px", color: "#64748b" }}>
                      {assignments[w].length} prod
                    </span>
                  )}
                  {extensions[w] && extensions[w] > Date.now() && (
                    <span style={{ float: "right", fontSize: "10px", backgroundColor: "rgba(16,185,129,0.1)", color: "#047857", padding: "2px 6px", borderRadius: "10px", marginRight: "4px" }}>
                      +Tiempo
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="card" style={{ padding: "var(--spacing-lg)", borderTop: "4px solid #f59e0b" }}>
            <h3 style={{ margin: "0 0 var(--spacing-md) 0", display: "flex", alignItems: "center", gap: "8px" }}>
              <Timer size={18} color="#f59e0b" /> Extensión de Horario
            </h3>
            <p style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)", marginBottom: "var(--spacing-md)" }}>
              Otorga minutos extra a <strong>{selectedWorker}</strong> para poder llenar datos fuera de las 3:00 PM establecidas.
            </p>
            
            {isTimeGranted && (
               <div style={{ padding: "10px", backgroundColor: "rgba(16,185,129,0.1)", color: "#047857", borderRadius: "4px", fontSize: "12px", fontWeight: "bold", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                 <span>✅ Prórroga activa</span>
                 <button onClick={clearTime} style={{ background: "transparent", color: "red", border: "none", cursor: "pointer", fontSize: "10px", textDecoration: "underline" }}>Anular</button>
               </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
              <button 
                onClick={() => grantTime(15)}
                style={{ padding: "10px 0", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}>
                +15 min
              </button>
              <button 
                onClick={() => grantTime(30)}
                style={{ padding: "10px 0", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}>
                +30 min
              </button>
              <button 
                onClick={() => grantTime(60)}
                style={{ padding: "10px 0", backgroundColor: "white", border: "1px solid var(--border)", borderRadius: "var(--radius-md)", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}>
                +1 hora
              </button>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO: ASIGNACIÓN DE PRODUCTOS */}
        <div className="card" style={{ flex: "2 1 500px", padding: 0 }}>
          <div style={{ padding: "var(--spacing-lg)", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: "0", display: "flex", alignItems: "center", gap: "8px" }}>
                <Package size={18} color="var(--primary)" /> Productos Asignados
              </h3>
              <p style={{ margin: "4px 0 0", fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>
                Selecciona los productos de los cuales se encarga <strong>{selectedWorker}</strong>.
              </p>
            </div>
            <button 
              onClick={saveAssignments}
              style={{ backgroundColor: "var(--primary)", color: "white", border: "none", padding: "10px 20px", borderRadius: "var(--radius-md)", fontWeight: 800, fontSize: "var(--font-xs)", cursor: "pointer", display: "inline-flex", gap: "6px", alignItems: "center" }}
            >
              <Save size={14} /> GUARDAR
            </button>
          </div>

          <div style={{ padding: "var(--spacing-lg)", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "12px" }}>
            {AVAILABLE_PRODUCTS.map(product => {
              const isSelected = workerList.includes(product);
              return (
                <div 
                  key={product} 
                  onClick={() => toggleProduct(product)}
                  style={{
                    padding: "14px 16px",
                    borderRadius: "var(--radius-md)",
                    border: `2px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                    backgroundColor: isSelected ? "rgba(255,69,0,0.03)" : "white",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    cursor: "pointer",
                    transition: "all 0.15s"
                  }}
                >
                  <span style={{ fontSize: "var(--font-xs)", fontWeight: isSelected ? 800 : 600, color: isSelected ? "var(--primary)" : "var(--text-main)" }}>
                    {product}
                  </span>
                  {isSelected && <Check size={16} color="var(--primary)" />}
                </div>
              );
            })}
          </div>
          
        </div>
      </div>
    </div>
  );
}
