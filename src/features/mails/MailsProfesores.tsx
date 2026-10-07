import React, { useEffect, useState } from "react";
import data from "./mailsProfesores.json";
import "./mailsProfesores.css";
import { toast } from "react-toastify";
import useIsMobile from "../../hooks/useIsMobile";

type Mail = {
  area: string;
  curso: string;
  profesor: string;
  materia: string;
  email: string;
};

interface MailsProfesoresProps {
  searchTerm: string;
}

const MailsProfesores: React.FC<MailsProfesoresProps> = ({ searchTerm }) => {
  const [mails, setMails] = useState<Mail[]>([]);

  const isMobile = useIsMobile();

  const [sortConfig, setSortConfig] = useState<{
    key: keyof Mail;
    direction: "ascending" | "descending";
  } | null>(null);
  const [loading, setLoading] = useState(true);

  const anioStyle = {
    "1ro": "primero",
    "2do": "segundo",
    "3ro": "tercero",
    "4to": "cuarto",
    "5to": "quinto",
  };

  const notify = () => {
    toast(
      <div className="popup-copy">
        <span className="material-symbols-rounded">content_copy</span>
        <span>¡Mail copiado!</span>
      </div>
    );
  };

  useEffect(() => {
    setLoading(true);
    setMails(data);
    setLoading(false);
  }, []);

  const sortedMails = React.useMemo(() => {
    const sortableItems = [...mails];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [mails, sortConfig]);

  const requestSort = (key: keyof Mail) => {
    let direction: "ascending" | "descending" = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const normalizeText = (text: string) => {
    return text
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();
  };

  const filteredMails = sortedMails.filter(
    (item) =>
      normalizeText(item.profesor).includes(normalizeText(searchTerm)) ||
      normalizeText(item.materia).includes(normalizeText(searchTerm))
  );

  const getSortIndicator = (key: string) => {
    if (sortConfig && sortConfig.key === key) {
      return sortConfig.direction === "ascending" ? " ↑" : " ↓";
    }
    return "";
  };

  const copyToClipboard = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      notify();
    } catch (error) {
      console.error("Error al copiar al portapapeles:", error);
    }
  };

  return (
    <>
      {loading && (
        <div className="text-center" style={{ fontSize: "1.5rem" }}>
          Cargando...
        </div>
      )}

      {!isMobile ? (
        <table className="table-mails">
          <thead className="table-thead">
            <tr className="th-mails">
              <th onClick={() => requestSort("profesor")}>
                Profesor/a {getSortIndicator("profesor")}
              </th>
              <th onClick={() => requestSort("materia")}>
                Materia {getSortIndicator("materia")}
              </th>
              <th onClick={() => requestSort("curso")}>
                Año {getSortIndicator("curso")}
              </th>
              <th onClick={() => requestSort("area")}>
                Área {getSortIndicator("area")}
              </th>
              <th onClick={() => requestSort("email")}>
                Email {getSortIndicator("email")}
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredMails.map((item, index) => (
              <tr key={index} className="mail-tr">
                <td>{item.profesor}</td>
                <td className="materias-td">{item.materia}</td>
                <td>
                  <div
                    className={anioStyle[item.curso as keyof typeof anioStyle]}>
                    {item.curso}
                  </div>
                </td>
                <td>{item.area}</td>
                <td className="mail-url">
                  <a
                    href={`mailto:${item.email}`}
                    onClick={(e) => {
                      e.preventDefault();
                      copyToClipboard(item.email);
                    }}>
                    {item.email}
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          {filteredMails.map((item) => (
            <article className="mail-article">
              <div className="mail-info">
                <div
                  className={`${
                    anioStyle[item.curso as keyof typeof anioStyle]
                  } mail-curso`}>
                  {item.curso}
                </div>
                <div>
                  <h3>{item.profesor}</h3>
                  <p className="mail-info-materia">{item.materia}</p>
                </div>
              </div>

              <button
                className="copy-button"
                onClick={(e) => {
                  e.preventDefault();
                  copyToClipboard(item.email);
                }}>
                <span className="material-symbols-rounded">content_copy</span>
              </button>
            </article>
          ))}
        </div>
      )}

    </>
  );
};

export default MailsProfesores;
