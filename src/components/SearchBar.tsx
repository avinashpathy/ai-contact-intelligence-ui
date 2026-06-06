import { useState } from "react";

interface Props {
  onSearch: (
    query: string
  ) => void;
  disabled?: boolean;
}

export default function SearchBar({
  onSearch,
  disabled = false
}: Props) {

  const [query, setQuery] =
    useState("");

  const handleSubmit = () => {
    if (query.trim() && !disabled) {
      onSearch(query.trim());
    }
  };

  return (
    <form
      className="search-bar"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      <input
        className="search-bar__input"
        value={query}
        placeholder="Find frontend developers in San Francisco..."
        disabled={disabled}
        onChange={(e) =>
          setQuery(
            e.target.value
          )
        }
      />

      <button
        className="search-bar__button"
        type="submit"
        disabled={disabled || !query.trim()}
      >
        Search
      </button>

    </form>
  );
}
