import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
    supabase.auth.onAuthStateChange((_e, s) => setSession(s));
  }, []);

  if (!session) {
    let email = "";
    let password = "";

    return (
      <div style={styles.login}>
        <div style={styles.loginBox}>
          <h2>Gestão Serviços PRO</h2>
          <input placeholder="Email" onChange={e => (email = e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => (password = e.target.value)} />
          <button onClick={() => supabase.auth.signInWithPassword({ email, password })}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
}

function Dashboard() {
  const [services, setServices] = useState([]);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data } = await supabase.from("services").select("*");
    setServices(data || []);
  }

  function risk(progress) {
    if (progress < 30) return "Alto";
    if (progress < 70) return "Médio";
    return "Baixo";
  }

  function color(progress) {
    if (progress < 30) return "#ef4444";
    if (progress < 70) return "#f97316";
    return "#22c55e";
  }

  return (
    <div style={styles.app}>

      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>Gestão PRO</h2>
        <div style={styles.menuActive}>Dashboard</div>
        <div style={styles.menu}>Meus Serviços</div>
        <div style={styles.menu}>Equipa</div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>
        <h1>Dashboard</h1>

        {/* KPIs */}
        <div style={styles.kpis}>
          <div style={styles.kpiBlue}>
            Total de Serviços<br />{services.length}
          </div>

          <div style={styles.kpiOrange}>
            Serviços em Risco<br />
            {services.filter(s => s.progress < 40).length}
          </div>

          <div style={styles.kpiGreen}>
            Concluídos<br />
            {services.filter(s => s.progress >= 90).length}
          </div>
        </div>

        {/* CARDS */}
        <div style={styles.grid}>
          {services.map(s => (
            <div key={s.id} style={styles.card}>

              <h3>{s.name}</h3>

              <div style={styles.progressBar}>
                <div style={{
                  width: `${s.progress}%`,
                  background: color(s.progress),
                  height: "100%"
                }} />
              </div>

              <p><b>Progresso:</b> {s.progress}%</p>
              <p><b>Risco:</b> {risk(s.progress)}</p>
              <p><b>Prazo:</b> {s.end_date || "—"}</p>

              {/* TIMELINE */}
              <div>
                <b>Timeline:</b>
                {(s.timeline || []).map((t, i) => (
                  <div key={i} style={{ fontSize: 12 }}>
                    • {t}
                  </div>
                ))}
              </div>

              <button style={styles.btn}>Editar</button>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", fontFamily: "Inter" },

  sidebar: {
    width: 240,
    background: "#1e3a8a",
    color: "white",
    padding: 20
  },

  menu: { padding: 10, opacity: 0.8 },
  menuActive: { padding: 10, background: "#2563eb", borderRadius: 8 },

  main: { flex: 1, padding: 30, background: "#f1f5f9" },

  kpis: { display: "flex", gap: 20, marginBottom: 20 },

  kpiBlue: { flex: 1, background: "#2563eb", color: "white", padding: 20, borderRadius: 10 },
  kpiOrange: { flex: 1, background: "#f97316", color: "white", padding: 20, borderRadius: 10 },
  kpiGreen: { flex: 1, background: "#22c55e", color: "white", padding: 20, borderRadius: 10 },

  grid: {
    display: "grid",
    gridTemplateColumns: "1fr 1fr",
    gap: 20
  },

  card: {
    background: "white",
    padding: 20,
    borderRadius: 12,
    boxShadow: "0 4px 10px rgba(0,0,0,0.1)"
  },

  progressBar: {
    height: 8,
    background: "#ddd",
    borderRadius: 5,
    marginBottom: 10
  },

  btn: {
    marginTop: 10,
    padding: 8,
    background: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: 6
  },

  login: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    height: "100vh"
  },

  loginBox: {
    background: "white",
    padding: 30,
    borderRadius: 10,
    display: "flex",
    flexDirection: "column",
    gap: 10
  }
};
