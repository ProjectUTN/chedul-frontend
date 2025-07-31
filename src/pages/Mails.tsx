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
      <h1>Correos de profesores</h1>
      <SearchBar searchTerm={searchTerm} onSearchChange={handleSearchChange} />
      <MailsProfesores searchTerm={searchTerm} />
    </>
  );
}

export default Mails;
