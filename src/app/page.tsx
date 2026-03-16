"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulación de Usuarios por Rol
    const users = [
      { email: "dueno@campos-sierralta.com", pass: "admin123", role: "admin", name: "Dueño Principal" },
      { email: "supervisor@campos-sierralta.com", pass: "super123", role: "supervisor", name: "Supervisor General" },
      { email: "tienda@campos-sierralta.com", pass: "tienda123", role: "encargado", name: "Encargado de Tienda" },
      { email: "trabajador@campos-sierralta.com", pass: "mercado123", role: "trabajador", name: "Trabajador Mercado" },
    ];

    const user = users.find(u => u.email === email && u.pass === password);

    if (user) {
      localStorage.setItem("user_role", user.role);
      localStorage.setItem("user_name", user.name);
      router.push("/dashboard");
    } else {
      setError("Credenciales incorrectas. Pruebe con los usuarios de simulación.");
    }
  };

  return (
    <div style={{ 
      height: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundColor: "#fcfcfc"
    }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px", padding: "var(--spacing-xl)" }}>
        <div style={{ textAlign: "center", marginBottom: "var(--spacing-xl)" }}>
          <div style={{ 
            width: "60px", 
            height: "60px", 
            backgroundColor: "var(--primary)", 
            borderRadius: "50%", 
            display: "inline-flex", 
            alignItems: "center", 
            justifyContent: "center",
            marginBottom: "var(--spacing-md)",
            boxShadow: "0 4px 10px rgba(255, 69, 0, 0.2)"
          }}>
            <ShieldCheck color="white" size={30} />
          </div>
          <h1 style={{ fontSize: "var(--font-lg)", fontWeight: 800, color: "var(--primary)" }}>CAMPOS SIERRALTA</h1>
          <p style={{ fontSize: "var(--font-xs)", color: "var(--text-muted)" }}>SISTEMA DE GESTIÓN OPERATIVA</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "var(--spacing-md)" }}>
          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "#333" }}>Correo Electrónico</label>
            <div style={{ position: "relative", marginTop: "4px" }}>
              <User size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
              <input 
                type="email" 
                placeholder="ej: dueno@campos-sierralta.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: "40px" }}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ fontSize: "var(--font-xs)", fontWeight: 700, color: "#333" }}>Contraseña</label>
            <div style={{ position: "relative", marginTop: "4px" }}>
              <Lock size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#999" }} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: "40px", paddingRight: "40px" }}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#999" }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && <p style={{ color: "var(--error)", fontSize: "10px", fontWeight: 600, textAlign: "center" }}>{error}</p>}

          <button className="btn-primary" style={{ padding: "var(--spacing-md)", marginTop: "var(--spacing-sm)", fontWeight: 700 }}>
            INICIAR SESIÓN
          </button>
        </form>

        <div style={{ marginTop: "var(--spacing-xl)", backgroundColor: "var(--secondary)", padding: "var(--spacing-md)", borderRadius: "var(--radius-sm)" }}>
          <p style={{ fontSize: "8px", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Usuarios de Prueba:</p>
          <div style={{ fontSize: "9px", color: "#666", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
             <div><strong>Dueño:</strong> dueno / admin123</div>
             <div><strong>Supervisor:</strong> supervisor / super123</div>
             <div><strong>Encargado:</strong> tienda / tienda123</div>
             <div><strong>Trabajador:</strong> trabajador / mercado123</div>
          </div>
        </div>
      </div>
    </div>
  );
}
