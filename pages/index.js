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
  const [team, setTeam] = useState([]);
  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

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

  async function addService() {
    await supabase.from("services").insert({
      name,
      org_id: orgId,
      status: "todo",
      progress: 20,
      start_date: start,
      end_date: end
    });

    setName("");
    load();
  }

  async function invite() {
    await supabase.from("team_members").insert({
      email: inviteEmail,
      org_id: orgId
    });

    setInviteEmail("");
    loadTeam();
  }

  function daysBetween(a, b) {
    return (new Date(b) - new Date(a)) / (1000 * 60 * 60 * 24);
  }

  return (
    <div style={styles.app}>
      
      {/* SIDEBAR */}
      <div style={styles.sidebar}>
        <h2>SaaS PRO</h2>
        <div>Dashboard</div>
        <div>Equipa</div>
        <div onClick={() => supabase.auth.signOut()} style={{ marginTop: 20 }}>
          Logout
        </div>
      </div>

      {/* MAIN */}
      <div style={styles.main}>

        <h1>Dashboard</h1>

        {/* CREATE PROJECT */}
        <div style={styles.create}>
          <input placeholder="Projeto" value={name} onChange={e => setName(e.target.value)} />
          <input type="date" value={start} onChange={e => setStart(e.target.value)} />
          <input type="date" value={end} onChange={e => setEnd(e.target.value)} />
          <button onClick={addService}>Criar</button>
        </div>

        {/* TEAM */}
        <div style={styles.team}>
          <h3>Equipa</h3>
          <input placeholder="Email membro" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} />
          <button onClick={invite}>Adicionar</button>

          {team.map(m => (
            <div key={m.id}>{m.email} ({m.role})</div>
          ))}
        </div>

        {/* GANTT */}
        <div style={styles.gantt}>
          <h3>Timeline</h3>

          {services.map(s => {
            const duration = daysBetween(s.start_date, s.end_date) || 1;

            return (
              <div key={s.id} style={styles.ganttRow}>
                <span style={{ width: 150 }}>{s.name}</span>

                <div style={styles.ganttBarContainer}>
                  <div
                    style={{
                      width: `${duration * 20}px`,
                      background: "#2563eb",
                      height: 20,
                      borderRadius: 4
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </div>
  );
}

const styles = {
  app: { display: "flex", height: "100vh", fontFamily: "Arial" },
  sidebar: { width: 220, background: "#1e293b", color: "white", padding: 20 },
  main: { flex: 1, padding: 20, background: "#f8fafc" },

  create: { display: "flex", gap: 10, marginBottom: 20 },

  team: {
    background: "white",
    padding: 15,
    marginBottom: 20,
    borderRadius: 10
  },

  gantt: {
    background: "white",
    padding: 15,
    borderRadius: 10
  },

  ganttRow: {
    display: "flex",
    alignItems: "center",
    marginBottom: 10
  },

  ganttBarContainer: {
    flex: 1,
    background: "#e5e7eb",
    height: 20,
    marginLeft: 10
  },

  center: { display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" },
  box: { display: "flex", flexDirection: "column", gap: 10 }
};
