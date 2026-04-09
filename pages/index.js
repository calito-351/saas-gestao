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
      <div style={{ padding: 40 }}>
        <h2>Login</h2>
        <input onChange={e => (email = e.target.value)} placeholder="email" />
        <input onChange={e => (password = e.target.value)} type="password" />
        <button onClick={() => supabase.auth.signInWithPassword({ email, password })}>
          Entrar
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login feito com sucesso</h1>
      <button onClick={() => supabase.auth.signOut()}>
        Logout
      </button>
    </div>
  );
}
