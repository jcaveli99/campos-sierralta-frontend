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
      // Forzar una navegación completa (hard-reload) en producción 
      // para evitar que Next.js caché el viejo estado y se bloquee.
      window.location.href = "/dashboard";
    } else {
      setError("Credenciales incorrectas. Pruebe con los usuarios de simulación.");
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      background: "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
      padding: "24px",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Decorative background blur elements */}
      <div style={{ position: "absolute", top: "-10%", left: "-10%", width: "300px", height: "300px", background: "rgba(255,69,0,0.15)", borderRadius: "50%", filter: "blur(60px)", zIndex: 0 }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "-10%", width: "400px", height: "400px", background: "rgba(16,185,129,0.1)", borderRadius: "50%", filter: "blur(60px)", zIndex: 0 }} />

      <div style={{ 
        width: "100%", 
        maxWidth: "420px", 
        backgroundColor: "rgba(255, 255, 255, 0.85)", 
        backdropFilter: "blur(20px)",
        borderRadius: "28px", 
        padding: "40px 32px",
        boxShadow: "0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.03)",
        border: "1px solid rgba(255,255,255,0.6)",
        zIndex: 1,
        position: "relative"
      }}>
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ 
            width: "72px", height: "72px", 
            background: "linear-gradient(135deg, var(--primary) 0%, #ff7b3a 100%)", 
            borderRadius: "22px", 
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: "20px",
            boxShadow: "0 12px 24px rgba(255, 69, 0, 0.3)",
            transform: "rotate(-5deg)",
            transition: "transform 0.3s ease"
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = "rotate(0deg) scale(1.05)"}
          onMouseLeave={(e) => e.currentTarget.style.transform = "rotate(-5deg)"}
          >
            <div style={{ transform: "rotate(5deg)" }}>
              <ShieldCheck color="white" size={34} strokeWidth={2.5} />
            </div>
          </div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#111", letterSpacing: "-0.5px", margin: "0 0 4px 0" }}>CAMPOS SIERRALTA</h1>
          <p style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1.5px", margin: 0 }}>GESTIÓN OPERATIVA</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#4b5563", paddingLeft: "4px" }}>Correo Electrónico</label>
            <div style={{ position: "relative" }}>
              <User size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input 
                type="email" 
                placeholder="ej: dueno@campos-sierralta.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  width: "100%", padding: "14px 16px 14px 44px", 
                  backgroundColor: "#f9fafb", border: "2px solid transparent", 
                  borderRadius: "14px", fontSize: "14px", color: "#111",
                  transition: "all 0.2s", outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                }}
                onFocus={(e) => { e.currentTarget.style.border = "2px solid rgba(255,69,0,0.3)"; e.currentTarget.style.backgroundColor = "#fff"; }}
                onBlur={(e) => { e.currentTarget.style.border = "2px solid transparent"; e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                required
              />
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#4b5563", paddingLeft: "4px" }}>Contraseña</label>
            <div style={{ position: "relative" }}>
              <Lock size={18} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
              <input 
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ 
                  width: "100%", padding: "14px 44px 14px 44px", 
                  backgroundColor: "#f9fafb", border: "2px solid transparent", 
                  borderRadius: "14px", fontSize: "14px", color: "#111",
                  transition: "all 0.2s", outline: "none",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)"
                }}
                onFocus={(e) => { e.currentTarget.style.border = "2px solid rgba(255,69,0,0.3)"; e.currentTarget.style.backgroundColor = "#fff"; }}
                onBlur={(e) => { e.currentTarget.style.border = "2px solid transparent"; e.currentTarget.style.backgroundColor = "#f9fafb"; }}
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#9ca3af", padding: "4px" }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {error && (
            <div style={{ background: "rgba(220, 38, 38, 0.1)", padding: "10px", borderRadius: "10px", border: "1px solid rgba(220,38,38,0.2)" }}>
              <p style={{ color: "var(--error)", fontSize: "11px", fontWeight: 600, textAlign: "center", margin: 0 }}>{error}</p>
            </div>
          )}

          <button style={{
            marginTop: "12px",
            width: "100%",
            padding: "16px",
            background: "linear-gradient(135deg, var(--primary) 0%, #ff7b3a 100%)",
            color: "white",
            border: "none",
            borderRadius: "14px",
            fontSize: "14px",
            fontWeight: 800,
            cursor: "pointer",
            boxShadow: "0 8px 16px rgba(255, 69, 0, 0.25)",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            textTransform: "uppercase",
            letterSpacing: "0.5px"
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 20px rgba(255, 69, 0, 0.35)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(255, 69, 0, 0.25)"; }}
          onPointerDown={(e) => { e.currentTarget.style.transform = "translateY(2px)"; e.currentTarget.style.boxShadow = "0 4px 8px rgba(255, 69, 0, 0.2)"; }}
          onPointerUp={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 20px rgba(255, 69, 0, 0.35)"; }}
          >
            Ingresar al Sistema
          </button>
        </form>

        <div style={{ marginTop: "32px", backgroundColor: "#f3f4f6", padding: "16px", borderRadius: "16px", border: "1px dashed #d1d5db" }}>
          <p style={{ fontSize: "10px", fontWeight: 800, color: "#6b7280", textTransform: "uppercase", marginBottom: "12px", textAlign: "center", letterSpacing: "0.5px" }}>Credenciales Demo</p>
          <div style={{ fontSize: "10px", color: "#4b5563", display: "flex", flexDirection: "column", gap: "8px" }}>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Dueño:</strong> <span>dueno@campos-sierralta.com / admin123</span></div>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Supervisor:</strong> <span>supervisor@campos-sierralta.com / super123</span></div>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Encargado:</strong> <span>tienda@campos-sierralta.com / tienda123</span></div>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Personal:</strong> <span>trabajador@campos-sierralta.com / mercado123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
