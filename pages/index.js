import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [session, setSession] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
    });
  }, []);

  if (!session) {
    let email = "";
    let password = "";

    return (
      <div style={styles.login}>
        <div style={styles.loginBox}>
          <h2>Gestão PRO</h2>
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
  const [team, setTeam] = useState([]);

  const [form, setForm] = useState({
    name: "",
    progress: 0,
    sla: ""
  });

  const [editing, setEditing] = useState(null);
  const [timelineInput, setTimelineInput] = useState("");

  useEffect(() => {
    load();
    loadTeam();
  }, []);

  async function load() {
    const { data } = await supabase.from("services").select("*");
    setServices(data || []);
  }

  async function loadTeam() {
    const { data } = await supabase.from("team_members").select("*");
    setTeam(data || []);
  }

  async function createProject() {
    await supabase.from("services").insert({
      ...form,
      timeline: []
    });

    setForm({ name: "", progress: 0, sla: "" });
    load();
  }

  async function updateProject(id, updates) {
    await supabase.from("services").update(updates).eq("id", id);
    load();
  }

  function addTimeline(service) {
    const updated = [...(service.timeline || []), timelineInput];
    updateProject(service.id, { timeline: updated });
    setTimelineInput("");
  }

  async function addMember(email) {
    await supabase.from("team_members").insert({ email });
    loadTeam();
  }

  function risk(p) {
    if (p < 30) return "🔴 Alto";
    if (p < 70) return "🟠 Médio";
    return "🟢 Baixo";
  }

  return (
    <div style={styles.app}>
      
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>Gestão PRO</h2>
        <div style={styles.active}>Dashboard</div>
        <div>Projetos</div>
        <div>Equipa</div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        <h1>Dashboard</h1>

        {/* KPI */}
        <div style={styles.kpis}>
          <div style={styles.kpiBlue}>
            {services.length}<br />Total
          </div>
          <div style={styles.kpiOrange}>
            {services.filter(s => s.progress < 40).length}<br />Risco
          </div>
          <div style={styles.kpiGreen}>
            {services.filter(s => s.progress > 80).length}<br />Concluído
          </div>
        </div>

        {/* CREATE */}
        <div style={styles.create}>
          <input
            placeholder="Projeto"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
          />
          <input
            type="number"
            placeholder="Progresso"
            value={form.progress}
            onChange={e => setForm({ ...form, progress: e.target.value })}
          />
          <input
            placeholder="SLA"
            value={form.sla}
            onChange={e => setForm({ ...form, sla: e.target.value })}
          />
          <button onClick={createProject}>Criar</button>
        </div>

        {/* PROJECT GRID */}
        <div style={styles.grid}>
          {services.map(s => (
            <div key={s.id} style={styles.card}>

              {editing === s.id ? (
                <>
                  <input
                    value={s.name}
                    onChange={e => updateProject(s.id, { name: e.target.value })}
                  />
                  <input
                    type="number"
                    value={s.progress}
                    onChange={e => updateProject(s.id, { progress: e.target.value })}
                  />
                  <input
                    value={s.sla || ""}
                    onChange={e => updateProject(s.id, { sla: e.target.value })}
                  />
                  <button onClick={() => setEditing(null)}>Guardar</button>
                </>
              ) : (
                <>
                  <h3>{s.name}</h3>
                  <p>{risk(s.progress)}</p>
                  <p>Progresso: {s.progress}%</p>
                  <p>SLA: {s.sla}</p>
                  <button onClick={() => setEditing(s.id)}>Editar</button>
                </>
              )}

              {/* PROGRESS */}
              <div style={styles.progress}>
                <div style={{
                  width: `${s.progress}%`,
                  background: "#22c55e",
                  height: "100%"
                }} />
              </div>

              {/* TIMELINE */}
              <div>
                <b>Timeline</b>
                <input
                  placeholder="Novo evento"
                  value={timelineInput}
                  onChange={e => setTimelineInput(e.target.value)}
                />
                <button onClick={() => addTimeline(s)}>+</button>

                {(s.timeline || []).map((t, i) => (
                  <div key={i}>• {t}</div>
                ))}
              </div>

            </div>
          ))}
        </div>

        {/* TEAM */}
        <div style={styles.team}>
          <h2>Equipa</h2>
          <input
            placeholder="Adicionar membro (Enter)"
            onKeyDown={e => {
              if (e.key === "Enter") addMember(e.target.value);
            }}
          />

          {team.map(m => (
            <div key={m.id}>👤 {m.email}</div>
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

  active: { background: "#2563eb", padding: 10, borderRadius: 8 },

  main: { flex: 1, padding: 30, background: "#f1f5f9" },

  kpis: { display: "flex", gap: 20, marginBottom: 20 },

  kpiBlue: { flex: 1, background: "#2563eb", color: "white", padding: 20, borderRadius: 10 },
  kpiOrange: { flex: 1, background: "#f97316", color: "white", padding: 20, borderRadius: 10 },
  kpiGreen: { flex: 1, background: "#22c55e", color: "white", padding: 20, borderRadius: 10 },

  create: { display: "flex", gap: 10, marginBottom: 20 },

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

  progress: {
    height: 6,
    background: "#ddd",
    margin: "10px 0"
  },

  team: {
    marginTop: 30,
    background: "white",
    padding: 20,
    borderRadius: 10
  },

  login: {
    display: "flex",
    height: "100vh",
    justifyContent: "center",
    alignItems: "center"
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
