import axios from "axios";

import type {
  Contact,
  SearchResponse
} from "../types/contact";

const api = axios.create({
  baseURL: "http://localhost:8000"
});

type DynamoString = {
  S?: string;
};

type DynamoList = {
  L?: DynamoString[];
};

type ApiContact = Partial<{
  contactId: string | DynamoString;
  name: string | DynamoString;
  title: string | DynamoString;
  location: string | DynamoString;
  skills: string[] | DynamoList;
}>;

const readString = (
  value: unknown
) => {
  if (typeof value === "string") {
    return value;
  }

  if (
    value &&
    typeof value === "object" &&
    "S" in value &&
    typeof value.S === "string"
  ) {
    return value.S;
  }

  return "";
};

const readStringList = (
  value: unknown
) => {
  if (Array.isArray(value)) {
    return value
      .map(readString)
      .filter(Boolean);
  }

  if (
    value &&
    typeof value === "object" &&
    "L" in value &&
    Array.isArray(value.L)
  ) {
    return value.L
      .map(readString)
      .filter(Boolean);
  }

  return [];
};

const normalizeContact = (
  contact: ApiContact
): Contact => ({
  contactId: readString(contact.contactId),
  name: readString(contact.name),
  title: readString(contact.title),
  location: readString(contact.location),
  skills: readStringList(contact.skills)
});

const filterContactsMentionedInSummary = (
  contacts: Contact[],
  summary: string
) => {
  const normalizedSummary =
    summary.toLocaleLowerCase();

  const mentionedContacts =
    contacts.filter((contact) =>
      contact.name &&
      normalizedSummary.includes(
        contact.name.toLocaleLowerCase()
      )
    );

  return mentionedContacts.length > 0
    ? mentionedContacts
    : contacts;
};

const normalizeSearchResponse = (
  data: {
    response?: unknown;
    contacts?: unknown;
  }
): SearchResponse => {
  const response =
    readString(data.response);

  const contacts =
    Array.isArray(data.contacts)
      ? data.contacts.map((contact) =>
        normalizeContact(contact as ApiContact)
      )
      : [];

  return {
    response,
    contacts: filterContactsMentionedInSummary(
      contacts,
      response
    )
  };
};

export const searchContacts = async (
  query: string
): Promise<SearchResponse> => {

  const response =
    await api.post(
      "/search",
      { query }
    );

  return normalizeSearchResponse(response.data);
};

export const getContact = async (
  contactId: string
): Promise<Contact> => {

  const response =
    await api.get(
      `/contacts/${contactId}`
    );

  return normalizeContact(response.data);
};

export const getContactCount =
  async () => {

    const response =
      await api.get(
        "/contacts/count"
      );

    return response.data;
};
