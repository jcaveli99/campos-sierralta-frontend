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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const cleanUsername = email.replace("@campos-sierralta.com", "").trim();
    // Capitalize first letter to match database seed
    const formattedUsername = cleanUsername.charAt(0).toUpperCase() + cleanUsername.slice(1).toLowerCase();

    try {
      const res = await fetch("https://backent-sierralta.onrender.com/usuarios/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: formattedUsername, pass: password }),
      });

      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem("user_id", data.user.id.toString());
        localStorage.setItem("user_role", data.user.rol);
        localStorage.setItem("user_name", data.user.nombre);
        window.location.href = "/dashboard";
      } else {
        setError("Credenciales incorrectas. Verifique su usuario y contraseña.");
      }
    } catch (error) {
      console.error(error);
      setError("Error al conectar con el servidor. ¿Está encendido el backend?");
    }
  };

  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "flex", 
      alignItems: "center", 
      justifyContent: "center",
      backgroundImage: "linear-gradient(rgba(150, 150, 150, 0.6), rgba(150, 150, 150, 0.6)), url('/imagesfrutas.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
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
          <div style={{ marginTop: "-30px", marginBottom: "4px", display: "flex", justifyContent: "center" }}>
            <img 
              src="/ChatGPT Image 5 may 2026, 08_14_04 p.m..png" 
              alt="Logo Campos Sierralta" 
              style={{ 
                width: "300px", 
                height: "auto", 
                objectFit: "contain",
                transition: "transform 0.3s ease"
              }} 
              onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
              onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
            />
          </div>
          <p style={{ fontSize: "13px", color: "#111", fontWeight: 900, letterSpacing: "1.5px", margin: "-45px 0 0 0" }}>GESTIÓN DE COMPRAS E INVENTARIO</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, color: "#4b5563", paddingLeft: "4px" }}>Usuario</label>
            <div 
              style={{ 
                display: "flex", 
                alignItems: "center", 
                backgroundColor: "#f9fafb", 
                border: "2px solid transparent", 
                borderRadius: "14px", 
                transition: "all 0.2s", 
                boxShadow: "inset 0 1px 2px rgba(0,0,0,0.02)",
                overflow: "hidden"
              }}
              onFocus={(e) => { e.currentTarget.style.border = "2px solid rgba(255,69,0,0.3)"; e.currentTarget.style.backgroundColor = "#fff"; }}
              onBlur={(e) => { e.currentTarget.style.border = "2px solid transparent"; e.currentTarget.style.backgroundColor = "#f9fafb"; }}
            >
              <div style={{ paddingLeft: "16px", paddingRight: "8px", display: "flex", alignItems: "center" }}>
                <User size={18} color="#9ca3af" />
              </div>
              <input 
                type="text" 
                placeholder="Nombre de usuario" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: "14px 16px", 
                  backgroundColor: "transparent", 
                  border: "none", 
                  fontSize: "14px", 
                  color: "#111",
                  outline: "none",
                  minWidth: "50px"
                }}
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
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Dueño:</strong> <span>edmundo / admin123</span></div>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Supervisor:</strong> <span>angel / super123</span></div>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Encargado:</strong> <span>alex / tienda123</span></div>
             <div style={{ display: "flex", justifyContent: "space-between" }}><strong style={{ color: "#111" }}>Personal:</strong> <span>fabrizzio / fb123 (daniel/da123, jesus/js123)</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
