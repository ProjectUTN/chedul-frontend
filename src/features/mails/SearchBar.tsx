import React from "react";
import "./searchBar.css";

interface SearchBarProps {
  searchTerm: string;
  onSearchChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({
  searchTerm,
  onSearchChange,
  placeholder = "Buscar profesor o materia...",
}) => {
  return (
    <div className="input-search">
      <input
        autoFocus
        type="text"
        placeholder={placeholder}
        value={searchTerm}
        onChange={onSearchChange}
      />
      <span className="material-symbols-rounded search-icon">search</span>
    </div>
  );
};

export default SearchBar;
