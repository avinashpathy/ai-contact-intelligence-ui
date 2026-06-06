export interface Contact {
    contactId: string;
    name: string;
    title: string;
    location: string;
    skills: string[];
  }
  
  export interface SearchResponse {
    response: string;
    contacts: Contact[];
  }