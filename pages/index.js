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
      <div style={styles.center}>
        <div style={styles.box}>
          <h2>SaaS PRO</h2>
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
  const [editing, setEditing] = useState(null);
  const [timelineText, setTimelineText] = useState("");

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
      progress: 10,
      timeline: []
    });

    setName("");
    load();
  }

  async function updateService(id, updates) {
    await supabase.from("services").update(updates).eq("id", id);
    load();
  }

  async function onDrop(e, status) {
    const id = e.dataTransfer.getData("id");
    await updateService(id, { status });
  }

  function onDragStart(e, id) {
    e.dataTransfer.setData("id", id);
  }

  function addTimeline(service) {
    const updated = [...(service.timeline || []), timelineText];
    updateService(service.id, { timeline: updated });
    setTimelineText("");
  }

  return (
    <div style={styles.app}>
      
      <div style={styles.sidebar}>
        <h2>SaaS PRO</h2>
        <div>Dashboard</div>
        <div onClick={() => supabase.auth.signOut()} style={{ marginTop: 20 }}>
          Logout
        </div>
      </div>

      <div style={styles.main}>
        <h1>Dashboard</h1>

        {/* CREATE */}
        <div style={{ marginBottom: 20 }}>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Novo projeto" />
          <button onClick={addService}>Criar</button>
        </div>

        {/* KANBAN */}
        <div style={styles.kanban}>
          {["todo", "doing", "done"].map(col => (
            <div
              key={col}
              style={styles.column}
              onDragOver={e => e.preventDefault()}
              onDrop={e => onDrop(e, col)}
            >
              <h3>{col.toUpperCase()}</h3>

              {services.filter(s => s.status === col).map(s => (
                <div
                  key={s.id}
                  style={styles.card}
                  draggable
                  onDragStart={e => onDragStart(e, s.id)}
                >

                  {/* EDIT */}
                  {editing === s.id ? (
                    <>
                      <input
                        value={s.name}
                        onChange={e => updateService(s.id, { name: e.target.value })}
                      />
                      <input
                        type="number"
                        value={s.progress}
                        onChange={e => updateService(s.id, { progress: e.target.value })}
                      />
                      <button onClick={() => setEditing(null)}>Guardar</button>
                    </>
                  ) : (
                    <>
                      <b>{s.name}</b>
                      <p>{s.progress}%</p>
                      <button onClick={() => setEditing(s.id)}>Editar</button>
                    </>
                  )}

                  {/* PROGRESS */}
                  <div style={styles.progress}>
                    <div style={{ width: `${s.progress}%`, background: "green", height: "100%" }} />
                  </div>

                  {/* TIMELINE */}
                  <div style={{ marginTop: 10 }}>
                    <input
                      placeholder="Adicionar evento"
                      value={timelineText}
                      onChange={e => setTimelineText(e.target.value)}
                    />
                    <button onClick={() => addTimeline(s)}>+</button>

                    {(s.timeline || []).map((t, i) => (
                      <div key={i} style={{ fontSize: 12 }}>
                        - {t}
                      </div>
                    ))}
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
  app: { display: "flex", height: "100vh", fontFamily: "Arial" },
  sidebar: { width: 200, background: "#1e293b", color: "white", padding: 20 },
  main: { flex: 1, padding: 20, background: "#f1f5f9" },
  kanban: { display: "flex", gap: 10 },
  column: { flex: 1, background: "#e2e8f0", padding: 10 },
  card: { background: "white", padding: 10, marginBottom: 10, borderRadius: 8 },
  progress: { height: 6, background: "#ddd", marginTop: 5 },
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  box: { display: "flex", flexDirection: "column", gap: 10 }
};
