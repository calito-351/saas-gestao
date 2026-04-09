import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [status, setStatus] = useState("A ligar...");

  useEffect(() => {
    async function test() {
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        setStatus("Erro ligação");
      } else {
        setStatus("Ligado ao Supabase");
      }
    }

    test();
  }, []);

  return <h1>{status}</h1>;
}
