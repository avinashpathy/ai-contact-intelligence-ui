import ContactCard
from "./ContactCard";

import type { Contact }
from "../types/contact";

interface Props {
  contacts: Contact[];
}

export default function SearchResults({
  contacts
}: Props) {

  if (contacts.length === 0) {
    return (
      <p className="results-empty">
        No contacts matched your search. Try a different query.
      </p>
    );
  }

  return (
    <div className="results-grid">
      {
        contacts.map(
          contact => (
            <ContactCard
              key={
                contact.contactId
              }
              contact={contact}
            />
          )
        )
      }
    </div>
  );
}
