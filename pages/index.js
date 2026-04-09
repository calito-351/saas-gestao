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
      <div style={styles.loginPage}>
        <div style={styles.loginBox}>
          <h1>SaaS PRO</h1>
          <input placeholder="Email" onChange={e => (email = e.target.value)} />
          <input type="password" placeholder="Password" onChange={e => (password = e.target.value)} />
          <button onClick={() => supabase.auth.signInWithPassword({ email, password })}>
            Entrar
          </button>
        </div>
      </div>
    );
  }

  return <Dashboard session={session} />;
}

function Dashboard({ session }) {
  const [orgId, setOrgId] = useState(null);
  const [services, setServices] = useState([]);
  const [name, setName] = useState("");

  useEffect(() => {
    setup();
  }, []);

  async function setup() {
    const { data } = await supabase
      .from("memberships")
      .select("*")
      .eq("user_id", session.user.id);

    if (!data.length) {
      const { data: org } = await supabase
        .from("organizations")
        .insert({ name: "Empresa" })
        .select()
        .single();

      await supabase.from("memberships").insert({
        user_id: session.user.id,
        org_id: org.id,
        role: "admin"
      });

      setOrgId(org.id);
    } else {
      setOrgId(data[0].org_id);
    }
  }

  useEffect(() => {
    if (orgId) load();
  }, [orgId]);

  async function load() {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("org_id", orgId);

    setServices(data || []);
  }

  async function addService() {
    await supabase.from("services").insert({
      name,
      org_id: orgId,
      status: "todo",
      progress: 20
    });

    setName("");
    load();
  }

  async function updateStatus(id, status) {
    await supabase.from("services").update({ status }).eq("id", id);
    load();
  }

  return (
    <div style={styles.app}>
      
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>Gestão</h2>
        <div style={styles.menuActive}>Dashboard</div>
        <div style={styles.menu}>Projetos</div>
        <div style={styles.menu}>Equipa</div>

        <div style={styles.logout} onClick={() => supabase.auth.signOut()}>
          Logout
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        {/* HEADER */}
        <div style={styles.header}>
          <h1>Dashboard</h1>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Novo projeto..."
            style={styles.input}
          />
          <button onClick={addService} style={styles.primaryBtn}>
            + Criar
          </button>
        </div>

        {/* KPI */}
        <div style={styles.kpis}>
          <div style={styles.kpiBlue}>Total: {services.length}</div>
          <div style={styles.kpiOrange}>
            Em Curso: {services.filter(s => s.status === "doing").length}
          </div>
          <div style={styles.kpiGreen}>
            Concluído: {services.filter(s => s.status === "done").length}
          </div>
        </div>

        {/* KANBAN */}
        <div style={styles.kanban}>
          {["todo", "doing", "done"].map(col => (
            <div key={col} style={styles.column}>
              <h3>{col.toUpperCase()}</h3>

              {services.filter(s => s.status === col).map(s => (
                <div key={s.id} style={styles.card}>

                  <div style={styles.cardHeader}>
                    <b>{s.name}</b>
                    <span>{s.progress}%</span>
                  </div>

                  <div style={styles.progressBar}>
                    <div
                      style={{
                        width: `${s.progress}%`,
                        background: "#22c55e",
                        height: "100%"
                      }}
                    />
                  </div>

                  <div style={styles.cardActions}>
                    <button onClick={() => updateStatus(s.id, "todo")}>ToDo</button>
                    <button onClick={() => updateStatus(s.id, "doing")}>Doing</button>
                    <button onClick={() => updateStatus(s.id, "done")}>Done</button>
                  </div>

                </div>
              ))}
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", fontFamily: "Inter, sans-serif" },

  sidebar: {
    width: 240,
    background: "#0f172a",
    color: "white",
    padding: 20,
    display: "flex",
    flexDirection: "column"
  },

  menu: { padding: 10, opacity: 0.7 },
  menuActive: { padding: 10, background: "#2563eb", borderRadius: 8 },

  logout: { marginTop: "auto", cursor: "pointer" },

  main: { flex: 1, padding: 30, background: "#f8fafc" },

  header: {
    display: "flex",
    gap: 10,
    alignItems: "center",
    marginBottom: 20
  },

  input: { padding: 10, borderRadius: 6, border: "1px solid #ddd" },

  primaryBtn: {
    background: "#2563eb",
    color: "white",
    border: "none",
    padding: "10px 15px",
    borderRadius: 6,
    cursor: "pointer"
  },

  kpis: { display: "flex", gap: 10, marginBottom: 20 },

  kpiBlue: { flex: 1, background: "#2563eb", color: "white", padding: 15, borderRadius: 10 },
  kpiOrange: { flex: 1, background: "#f97316", color: "white", padding: 15, borderRadius: 10 },
  kpiGreen: { flex: 1, background: "#22c55e", color: "white", padding: 15, borderRadius: 10 },

  kanban: { display: "flex", gap: 20 },

  column: {
    flex: 1,
    background: "#e2e8f0",
    padding: 15,
    borderRadius: 10
  },

  card: {
    background: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    boxShadow: "0 2px 6px rgba(0,0,0,0.1)"
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 10
  },

  progressBar: {
    height: 6,
    background: "#e5e7eb",
    borderRadius: 5,
    overflow: "hidden",
    marginBottom: 10
  },

  cardActions: {
    display: "flex",
    gap: 5
  },

  loginPage: {
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center"
  },

  loginBox: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    padding: 30,
    borderRadius: 10,
    background: "white"
  }
};
