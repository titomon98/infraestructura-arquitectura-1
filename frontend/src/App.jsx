import { useEffect, useState } from "react";
import { getHealth, getLogins, postLogin } from "./api.js";

const fmt = (d) => new Date(d).toLocaleString("es", { dateStyle: "short", timeStyle: "medium" });

export default function App() {
  const [email, setEmail] = useState("");
  const [logins, setLogins] = useState([]);
  const [health, setHealth] = useState(null);
  const [msg, setMsg] = useState({ text: "", bad: false });
  const [busy, setBusy] = useState(false);
  const [newId, setNewId] = useState(null);

  const load = () => getLogins().then(setLogins).catch(() => {});
  const ping = () => getHealth().then(setHealth).catch((e) => setHealth(e.data || { status: "down" }));

  useEffect(() => {
    load(); ping();
    const t = setInterval(ping, 15000);
    return () => clearInterval(t);
  }, []);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setMsg({ text: "", bad: false });
    try {
      const row = await postLogin(email);
      setNewId(row.id); setEmail("");
      setMsg({ text: "Inicio de sesión registrado.", bad: false });
      load();
    } catch (err) {
      setMsg({ text: err.message || "No se pudo registrar.", bad: true });
    } finally {
      setBusy(false);
    }
  }

  const ok = health?.status === "ok";
  const healthText = !health ? "Verificando…" : ok ? `Base de datos activa · ${health.db.latency_ms} ms` : "Base de datos sin conexión";

  return (
    <main>
      <header>
        <h1>Registro de accesos</h1>
        <span className="health" role="status">
          <span className={"dot " + (health ? (ok ? "ok" : "bad") : "")} />
          {healthText}
        </span>
      </header>

      <form onSubmit={submit}>
        <input type="email" required placeholder="tu@correo.com" value={email}
               onChange={(e) => setEmail(e.target.value)} aria-label="Correo" />
        <button disabled={busy}>{busy ? "Registrando…" : "Iniciar sesión"}</button>
      </form>
      <p className={"msg " + (msg.bad ? "bad" : "")}>{msg.text}</p>

      <ol>
        {logins.length === 0 && <li className="empty">Aún no hay accesos. Registra el primero arriba.</li>}
        {logins.map((l) => (
          <li key={l.id} className={l.id === newId ? "new" : ""}>
            <span>{l.email}</span>
            <time dateTime={l.created_at}>{fmt(l.created_at)}</time>
          </li>
        ))}
      </ol>
    </main>
  );
}
