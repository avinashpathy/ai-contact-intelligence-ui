import { useState }
from "react";

import SearchBar
from "../components/SearchBar";

import SearchResults
from "../components/SearchResults";

import Loading
from "../components/Loading";

import ErrorMessage
from "../components/ErrorMessage";

import {
  searchContacts
}
from "../api/contactApi";

import type {
  Contact
}
from "../types/contact";

export default function Home() {

  const [contacts, setContacts] =
    useState<Contact[]>([]);

  const [summary, setSummary] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [hasSearched, setHasSearched] =
    useState(false);

  const handleSearch =
    async (
      query: string
    ) => {

      try {

        setLoading(true);

        setError("");

        setHasSearched(true);

        const result =
          await searchContacts(
            query
          );

        setContacts(
          result.contacts
        );

        setSummary(
          result.response
        );

      } catch {

        setError(
          "Search failed"
        );

      } finally {

        setLoading(false);

      }
    };

  return (
    <div className="app">

      <header className="app-header">
        <h1>
          AI Contact Intelligence
        </h1>
        <p className="app-subtitle">
          Search your network with natural language
        </p>
      </header>

      <SearchBar
        onSearch={
          handleSearch
        }
        disabled={loading}
      />

      {
        loading &&
        <Loading />
      }

      {
        error &&
        <ErrorMessage
          message={error}
        />
      }

      {
        summary &&
        <section className="summary-section">
          <h2 className="section-heading">
            AI Summary
          </h2>
          <div className="summary-card">
            <p>
              {summary}
            </p>
          </div>
        </section>
      }

      {
        hasSearched &&
        !loading &&
        <section className="results-section">
          <div className="results-header">
            <h2 className="section-heading">
              Contacts
            </h2>
            {
              contacts.length > 0 &&
              <span className="results-count">
                {contacts.length}{" "}
                {contacts.length === 1
                  ? "result"
                  : "results"}
              </span>
            }
          </div>
          <SearchResults
            contacts={contacts}
          />
        </section>
      }

    </div>
  );
}
