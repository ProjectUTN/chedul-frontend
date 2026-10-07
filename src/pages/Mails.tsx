import { useState } from "react";
import MailsProfesores from "../features/mails/MailsProfesores";
import SearchBar from "../features/mails/SearchBar";

function Mails() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Mails de profesores</h1>
          <p>Buscá por profesor o materia y copiá el mail con un toque.</p>
        </div>
      </div>
      <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
      <MailsProfesores searchTerm={searchTerm} />
    </>
  );
}

export default Mails;
