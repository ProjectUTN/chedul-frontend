import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authProvider";
import { mensajeDeError } from "../api/client";
import {
  getAccesos,
  getAlumnos,
  getResumen,
  type AccesoAdmin,
  type AlumnoAdmin,
  type CantidadPorDia,
  type ResumenAdmin,
} from "../features/admin/api";
import "../features/admin/admin.css";

// Panel de administracion: cuantos alumnos hay, cuantos entran y quienes.
// Solo lo ven los admins (la API responde 404 a los demas).

const fechaCorta = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "2-digit" }) : "—";

const hace = (iso: string | null) => {
  if (!iso) return "nunca";
  const minutos = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutos < 1) return "recién";
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  const dias = Math.round(horas / 24);
  return dias === 1 ? "ayer" : `hace ${dias} días`;
};

const METODO: Record<string, { texto: string; icono: string }> = {
  clave: { texto: "Contraseña", icono: "key" },
  google: { texto: "Google", icono: "account_circle" },
};

function Grafico({ titulo, datos, color }: { titulo: string; datos: CantidadPorDia[]; color: string }) {
  const maximo = Math.max(1, ...datos.map((d) => d.cantidad));
  const total = datos.reduce((suma, d) => suma + d.cantidad, 0);
  return (
    <section className="card admin-grafico">
      <header>
        <h2>{titulo}</h2>
        <span>
          <b>{total}</b> en 30 días
        </span>
      </header>
      <div className="admin-grafico__barras" style={{ "--color": color } as React.CSSProperties}>
        {datos.map((d, i) => (
          <div
            key={d.dia}
            className="admin-grafico__barra"
            style={{ "--alto": `${(d.cantidad / maximo) * 100}%`, "--i": i } as React.CSSProperties}
            title={`${new Date(`${d.dia}T12:00:00`).toLocaleDateString("es-AR", { day: "numeric", month: "short" })}: ${d.cantidad}`}>
            {d.cantidad > 0 && <span>{d.cantidad}</span>}
          </div>
        ))}
      </div>
      <footer>
        <span>{fechaCorta(`${datos[0]?.dia}T12:00:00`)}</span>
        <span>Hoy</span>
      </footer>
    </section>
  );
}

function Admin() {
  const { user } = useAuth();
  const [resumen, setResumen] = useState<ResumenAdmin | null>(null);
  const [accesos, setAccesos] = useState<AccesoAdmin[]>([]);
  const [alumnos, setAlumnos] = useState<AlumnoAdmin[]>([]);
  const [total, setTotal] = useState(0);
  const [porPagina, setPorPagina] = useState(50);
  const [buscar, setBuscar] = useState("");
  const [pagina, setPagina] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user?.es_admin) return;
    Promise.all([getResumen(), getAccesos()])
      .then(([r, a]) => {
        setResumen(r);
        setAccesos(a);
      })
      .catch((err) => setError(mensajeDeError(err, "No se pudo cargar el panel")));
  }, [user]);

  // La busqueda espera a que dejes de escribir
  useEffect(() => {
    if (!user?.es_admin) return;
    const espera = setTimeout(() => {
      getAlumnos(buscar, pagina)
        .then((r) => {
          setAlumnos(r.alumnos);
          setTotal(r.total);
          setPorPagina(r.por_pagina);
        })
        .catch((err) => setError(mensajeDeError(err, "No se pudieron cargar los alumnos")));
    }, 250);
    return () => clearTimeout(espera);
  }, [user, buscar, pagina]);

  if (!user?.es_admin) return <Navigate to="/inicio" replace />;

  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const numeros: { titulo: string; valor: number | undefined; icono: string; detalle?: string }[] = [
    {
      titulo: "Alumnos",
      valor: resumen?.alumnos,
      icono: "group",
      detalle: `+${resumen?.nuevos_30_dias ?? 0} en 30 días`,
    },
    { titulo: "Nuevos esta semana", valor: resumen?.nuevos_7_dias, icono: "person_add" },
    { titulo: "Activos hoy", valor: resumen?.activos_24_horas, icono: "bolt", detalle: "últimas 24 h" },
    { titulo: "Activos esta semana", valor: resumen?.activos_7_dias, icono: "trending_up" },
    { titulo: "Ingresos hoy", valor: resumen?.accesos_hoy, icono: "login" },
    { titulo: "Con estado cargado", valor: resumen?.con_estado_cargado, icono: "school" },
    { titulo: "Con Google", valor: resumen?.con_google, icono: "account_circle" },
    { titulo: "Aportes", valor: resumen?.aportes, icono: "library_books" },
    { titulo: "Comunidades", valor: resumen?.comunidades, icono: "groups" },
  ];

  return (
    <div className="admin">
      <div className="page-header">
        <div>
          <h1>Panel de administración</h1>
          <p>Cuántos alumnos usan Chedul, cuándo entran y quiénes son.</p>
        </div>
      </div>

      {error && <p className="form-error">{error}</p>}

      <ul className="admin-numeros">
        {numeros.map((n, i) => (
          <li key={n.titulo} className="card" style={{ "--i": i } as React.CSSProperties}>
            <span className="material-symbols-rounded">{n.icono}</span>
            <b>{n.valor ?? "…"}</b>
            <span>{n.titulo}</span>
            {n.detalle && <small>{n.detalle}</small>}
          </li>
        ))}
      </ul>

      {resumen && (
        <div className="admin-graficos">
          <Grafico titulo="Registros por día" datos={resumen.registros_por_dia} color="var(--accent)" />
          <Grafico titulo="Ingresos por día" datos={resumen.accesos_por_dia} color="var(--green)" />
        </div>
      )}

      <div className="admin-columnas">
        <section className="card admin-alumnos">
          <header>
            <h2>
              Alumnos <span className="chip">{total}</span>
            </h2>
            <label className="admin-buscar">
              <span className="material-symbols-rounded">search</span>
              <input
                type="search"
                placeholder="Buscar por nombre o correo"
                value={buscar}
                onChange={(e) => {
                  setBuscar(e.target.value);
                  setPagina(1);
                }}
                aria-label="Buscar alumnos"
              />
            </label>
          </header>

          {alumnos.length === 0 ? (
            <p className="vacio">No hay alumnos que coincidan.</p>
          ) : (
            <div className="admin-tabla" role="table" aria-label="Alumnos">
              <div className="admin-tabla__fila admin-tabla__cabecera" role="row">
                <span role="columnheader">Alumno</span>
                <span role="columnheader">Registro</span>
                <span role="columnheader">Último ingreso</span>
                <span role="columnheader">Materias</span>
                <span role="columnheader">Aportes</span>
              </div>
              {alumnos.map((a) => (
                <div key={a.id} className="admin-tabla__fila" role="row">
                  <span role="cell" className="admin-alumno">
                    <strong>
                      {a.nombre}
                      {a.es_admin && <span className="chip chip-azul">admin</span>}
                      {a.google && (
                        <span className="material-symbols-rounded admin-google" title="Entró con Google">
                          account_circle
                        </span>
                      )}
                    </strong>
                    <small>{a.email}</small>
                  </span>
                  <span role="cell" data-etiqueta="Registro">
                    {fechaCorta(a.creado)}
                  </span>
                  <span role="cell" data-etiqueta="Último ingreso">
                    {hace(a.ultimo_acceso)}
                  </span>
                  <span role="cell" data-etiqueta="Materias">
                    {a.materias}
                  </span>
                  <span role="cell" data-etiqueta="Aportes">
                    {a.aportes}
                  </span>
                </div>
              ))}
            </div>
          )}

          {paginas > 1 && (
            <nav className="admin-paginas" aria-label="Páginas">
              <button
                type="button"
                className="btn btn-secundario"
                disabled={pagina === 1}
                onClick={() => setPagina(pagina - 1)}>
                <span className="material-symbols-rounded">chevron_left</span>
              </button>
              <span>
                {pagina} de {paginas}
              </span>
              <button
                type="button"
                className="btn btn-secundario"
                disabled={pagina === paginas}
                onClick={() => setPagina(pagina + 1)}>
                <span className="material-symbols-rounded">chevron_right</span>
              </button>
            </nav>
          )}
        </section>

        <section className="card admin-accesos">
          <header>
            <h2>Últimos ingresos</h2>
          </header>
          {accesos.length === 0 ? (
            <p className="vacio">Todavía no hay ingresos registrados.</p>
          ) : (
            <ul>
              {accesos.map((a, i) => (
                <li key={`${a.fecha}-${i}`}>
                  <span className="material-symbols-rounded" title={METODO[a.metodo]?.texto ?? a.metodo}>
                    {METODO[a.metodo]?.icono ?? "login"}
                  </span>
                  <span className="admin-accesos__quien">
                    <strong>{a.nombre}</strong>
                    <small>{a.email}</small>
                  </span>
                  <time dateTime={a.fecha} title={new Date(a.fecha).toLocaleString("es-AR")}>
                    {hace(a.fecha)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

export default Admin;
