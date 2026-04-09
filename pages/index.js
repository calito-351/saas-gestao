import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { DragDropContext, Droppable, Draggable } from "react-beautiful-dnd";

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
      <div style={styles.center}>
        <div style={styles.box}>
          <h2>SaaS PRO</h2>
          <input placeholder="Email" onChange={e => (email = e.target.value)} />
          <input type="password" onChange={e => (password = e.target.value)} />
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
  const [team, setTeam] = useState([]);
  const [name, setName] = useState("");
  const [timelineInput, setTimelineInput] = useState("");

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
    if (orgId) {
      load();
      loadTeam();
    }
  }, [orgId]);

  async function load() {
    const { data } = await supabase
      .from("services")
      .select("*")
      .eq("org_id", orgId);

    setServices(data || []);
  }

  async function loadTeam() {
    const { data } = await supabase
      .from("team_members")
      .select("*")
      .eq("org_id", orgId);

    setTeam(data || []);
  }

  async function createProject() {
    await supabase.from("services").insert({
      name,
      org_id: orgId,
      status: "todo",
      progress: 20,
      timeline: []
    });

    setName("");
    load();
  }

  async function updateStatus(id, status) {
    await supabase.from("services").update({ status }).eq("id", id);
    load();
  }

  function onDragEnd(result) {
    if (!result.destination) return;
    updateStatus(result.draggableId, result.destination.droppableId);
  }

  function addTimeline(service) {
    const updated = [...(service.timeline || []), timelineInput];
    supabase.from("services").update({ timeline: updated }).eq("id", service.id);
    setTimelineInput("");
    load();
  }

  async function addMember(email) {
    await supabase.from("team_members").insert({
      email,
      org_id: orgId
    });
    loadTeam();
  }

  const columns = {
    todo: services.filter(s => s.status === "todo"),
    doing: services.filter(s => s.status === "doing"),
    done: services.filter(s => s.status === "done")
  };

  return (
    <div style={styles.app}>

      <div style={styles.sidebar}>
        <h2>Gestão</h2>
        <div>Dashboard</div>
      </div>

      <div style={styles.main}>

        {/* KPI */}
        <div style={styles.kpis}>
          <div>Total: {services.length}</div>
          <div>Risco: {services.filter(s => s.progress < 40).length}</div>
          <div>Done: {services.filter(s => s.status === "done").length}</div>
        </div>

        {/* CREATE */}
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Novo projeto" />
        <button onClick={createProject}>Criar</button>

        {/* BOARD */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div style={styles.board}>
            {Object.entries(columns).map(([key, items]) => (
              <Droppable droppableId={key} key={key}>
                {provided => (
                  <div ref={provided.innerRef} {...provided.droppableProps} style={styles.column}>
                    <h3>{key}</h3>

                    {items.map((item, i) => (
                      <Draggable key={item.id} draggableId={item.id} index={i}>
                        {provided => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            style={styles.card}
                          >
                            {item.name}

                            <input
                              placeholder="timeline"
                              value={timelineInput}
                              onChange={e => setTimelineInput(e.target.value)}
                            />
                            <button onClick={() => addTimeline(item)}>+</button>

                            {(item.timeline || []).map((t, i) => (
                              <div key={i}>• {t}</div>
                            ))}
                          </div>
                        )}
                      </Draggable>
                    ))}

                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>

        {/* TEAM */}
        <input placeholder="Adicionar membro" onKeyDown={e => {
          if (e.key === "Enter") addMember(e.target.value);
        }} />

        {team.map(m => (
          <div key={m.id}>{m.email}</div>
        ))}

      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh" },
  sidebar: { width: 200, background: "#1e3a8a", color: "white", padding: 20 },
  main: { flex: 1, padding: 20, background: "#f1f5f9" },
  kpis: { display: "flex", gap: 10, marginBottom: 20 },
  board: { display: "flex", gap: 10 },
  column: { flex: 1, background: "#ddd", padding: 10 },
  card: { background: "white", padding: 10, marginBottom: 10 },
  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  box: { display: "flex", flexDirection: "column", gap: 10 }
};
