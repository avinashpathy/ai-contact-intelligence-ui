# Flows

← [Back to docs index](./README.md)

This page walks through what happens, step by step, when someone uses the app.

- [1. Application startup flow](#1-application-startup-flow)
- [2. Search flow (end-to-end)](#2-search-flow-end-to-end)
  - [2.1 Flowchart](#21-flowchart)
  - [2.2 Sequence diagram](#22-sequence-diagram)
- [3. UI state machine](#3-ui-state-machine)
- [4. Response normalization flow](#4-response-normalization-flow)
- [5. Error flow](#5-error-flow)
- [6. Screen-by-screen walkthrough](#6-screen-by-screen-walkthrough)

---

## 1. Application startup flow

```mermaid
sequenceDiagram
    autonumber
    participant B as Browser
    participant H as index.html
    participant M as main.tsx
    participant R as React
    participant Hm as Home

    B->>H: GET /
    H->>B: HTML shell with root div + Inter font link
    B->>M: load module /src/main.tsx (dev) or /assets/index-[hash].js (prod)
    M->>M: import index.css (design tokens + styles)
    M->>R: createRoot(root div).render(StrictMode > App)
    R->>Hm: render Home with initial state
    Note over Hm: contacts=[], summary="", loading=false,<br/>error="", hasSearched=false
    Hm-->>B: Header + empty SearchBar only
```

No network call to the backend happens at startup. The first API request is made when the user submits a search.

> In development, `React.StrictMode` intentionally double-invokes renders to surface side-effect bugs. This is normal and does not happen in production builds.

---

## 2. Search flow (end-to-end)

### 2.1 Flowchart

```mermaid
flowchart TD
    A([User types a query]) --> B{Trimmed query<br/>empty?}
    B -- yes --> B1[Search button stays disabled<br/>Enter does nothing]
    B -- no --> C[User clicks Search or presses Enter]
    C --> D["SearchBar.handleSubmit()<br/>preventDefault, trim"]
    D --> E["Home.handleSearch(query)"]
    E --> F["setLoading(true)<br/>setError('')<br/>setHasSearched(true)"]
    F --> G[UI: input + button disabled,<br/>spinner shown,<br/>results section hidden]
    G --> H["contactApi.searchContacts(query)<br/>POST http://localhost:8000/search<br/>{ query }"]
    H --> I{HTTP success<br/>2xx?}
    I -- no / network error --> J["catch → setError('Search failed')"]
    I -- yes --> K["normalizeSearchResponse(data)"]
    K --> K1["readString(data.response) → summary"]
    K --> K2["data.contacts.map(normalizeContact)"]
    K2 --> L["filterContactsMentionedInSummary()"]
    K1 --> L
    L --> M["setContacts(result.contacts)<br/>setSummary(result.response)"]
    J --> N["finally → setLoading(false)"]
    M --> N
    N --> O{What to show?}
    O --> P1[error ≠ '' → red alert]
    O --> P2[summary ≠ '' → AI Summary card]
    O --> P3{contacts.length}
    P3 -- 0 --> Q1["'No contacts matched your search.'"]
    P3 -- ">0" --> Q2["'N results' badge + ContactCard grid"]
```

### 2.2 Sequence diagram

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant SB as SearchBar
    participant H as Home (state)
    participant API as contactApi.ts
    participant AX as Axios
    participant BE as Backend :8000
    participant SR as SearchResults / ContactCard

    U->>SB: type "Find frontend developers in SF"
    SB->>SB: setQuery(value) (local state)
    U->>SB: submit (click / Enter)
    SB->>H: onSearch("Find frontend developers in SF")
    H->>H: loading=true, error="", hasSearched=true
    H-->>U: spinner "Searching contacts..." (inputs disabled)
    H->>API: searchContacts(query)
    API->>AX: api.post("/search", { query })
    AX->>BE: POST /search  {"query": "..."}
    BE-->>AX: 200 { response, contacts[] }
    AX-->>API: response.data
    API->>API: normalizeSearchResponse(data)
    Note right of API: 1. readString(response)<br/>2. normalizeContact() each<br/>3. filter by names in summary
    API-->>H: SearchResponse { response, contacts }
    H->>H: setContacts, setSummary
    H->>H: finally: loading=false
    H->>SR: contacts
    SR-->>U: AI Summary + "N results" + contact cards

    alt request fails (network error, 4xx, 5xx)
        AX-->>API: throws AxiosError
        API-->>H: rejects
        H->>H: setError("Search failed"), finally loading=false
        H-->>U: red alert "Search failed"
    end
```

---

## 3. UI state machine

The five `useState` values in `Home` combine into a small set of visible states:

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle: Idle (first load)
    Idle: header + search bar only

    Loading: Loading
    Loading: spinner, inputs disabled
    Loading: (previous summary may still be visible)

    Results: Results
    Results: AI summary + N cards

    NoResults: No results
    NoResults: "No contacts matched your search."

    Error: Error
    Error: red "Search failed" alert

    Idle --> Loading: submit query
    Loading --> Results: 2xx and contacts.length > 0
    Loading --> NoResults: 2xx and contacts.length == 0
    Loading --> Error: request throws
    Results --> Loading: new search
    NoResults --> Loading: new search
    Error --> Loading: new search (error cleared)
```

| Visible state | `loading` | `error` | `hasSearched` | `contacts` | `summary` |
|---|---|---|---|---|---|
| Idle | `false` | `""` | `false` | `[]` | `""` |
| Loading | `true` | `""` | `true` | *(previous)* | *(previous)* |
| Results | `false` | `""` | `true` | non-empty | usually non-empty |
| No results | `false` | `""` | `true` | `[]` | any |
| Error | `false` | `"Search failed"` | `true` | *(previous)* | *(previous)* |

> ⚠️ `contacts` and `summary` are **not cleared** when a new search starts or fails. While loading, the *previous* AI summary stays visible. After a failure, the error alert appears **together with the previous search's summary and cards**. See [Known limitations](./DEVELOPMENT.md#9-known-limitations--improvement-ideas).

---

## 4. Response normalization flow

`normalizeSearchResponse` in `src/api/contactApi.ts` turns any backend payload into a strict `SearchResponse`.

```mermaid
flowchart TD
    RAW["raw response.data<br/>{ response?, contacts? }"] --> R1["readString(data.response)"]
    RAW --> C0{"Array.isArray<br/>(data.contacts)?"}
    C0 -- no --> C0N["contacts = []"]
    C0 -- yes --> C1["for each item → normalizeContact()"]

    C1 --> F1["contactId = readString(...)"]
    C1 --> F2["name = readString(...)"]
    C1 --> F3["title = readString(...)"]
    C1 --> F4["location = readString(...)"]
    C1 --> F5["skills = readStringList(...)"]

    subgraph RS["readString(value)"]
        direction TB
        s1{"typeof value<br/>=== 'string'?"} -- yes --> s1y["return value"]
        s1 -- no --> s2{"object with<br/>string .S?"}
        s2 -- yes --> s2y["return value.S"]
        s2 -- no --> s3["return ''"]
    end

    subgraph RSL["readStringList(value)"]
        direction TB
        l1{"Array?"} -- yes --> l1y["map(readString)<br/>.filter(Boolean)"]
        l1 -- no --> l2{"object with<br/>array .L?"}
        l2 -- yes --> l2y["value.L.map(readString)<br/>.filter(Boolean)"]
        l2 -- no --> l3["return []"]
    end

    F1 & F2 & F3 & F4 -.uses.-> RS
    F5 -.uses.-> RSL

    R1 --> FILT
    C0N --> FILT
    F1 & F2 & F3 & F4 & F5 --> FILT["filterContactsMentionedInSummary(contacts, summary)"]

    FILT --> FQ{"Any contact whose<br/>name appears in summary<br/>(case-insensitive)?"}
    FQ -- yes --> FY["keep only mentioned contacts"]
    FQ -- no --> FN["keep all contacts"]
    FY & FN --> OUT["SearchResponse { response, contacts }"]
```

Worked examples are in [API.md › Normalization rules](./API.md#2-normalization-rules).

---

## 5. Error flow

```mermaid
flowchart LR
    E1[Backend down /<br/>wrong port] --> X
    E2[CORS rejected] --> X
    E3[HTTP 4xx / 5xx] --> X
    E4[Timeout at the browser/OS level] --> X
    X["Axios throws"] --> C["Home catch {}"]
    C --> S["setError('Search failed')"]
    S --> F["finally: setLoading(false)"]
    F --> UI["ErrorMessage role=alert<br/>'Search failed'"]

    M1["Malformed but 2xx JSON<br/>(missing fields, wrong types)"] --> N["normalization<br/>→ '' / [] defaults"]
    N --> UI2["No error shown:<br/>empty summary and/or<br/>'No contacts matched'"]
```

Key points:
- **All transport and HTTP errors look the same to the user:** "Search failed". The original error is discarded (`catch {}` with no binding), so nothing is logged.
- **Bad data does not cause an error.** Normalization swallows it and the user sees empty results instead.

---

## 6. Screen-by-screen walkthrough

```text
┌────────────────────────────────────────────────────────┐
│              AI Contact Intelligence                   │  ← header
│        Search your network with natural language       │
│ ┌──────────────────────────────────────────┐┌────────┐ │
│ │ Find frontend developers in San Franci…  ││ Search │ │  ← SearchBar
│ └──────────────────────────────────────────┘└────────┘ │
└────────────────────────────────────────────────────────┘
                 ① IDLE (first load)

┌────────────────────────────────────────────────────────┐
│  [ query text, disabled ]           [ Search, dimmed ] │
│  ◌  Searching contacts...                              │  ← Loading
└────────────────────────────────────────────────────────┘
                 ② LOADING

┌────────────────────────────────────────────────────────┐
│  AI SUMMARY                                            │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Avery Johnson is a frontend engineer in SF …     │  │  ← summary-card
│  └──────────────────────────────────────────────────┘  │
│  CONTACTS                                   1 result   │
│  ┌───────────────────────┐                             │
│  │ (AJ) Avery Johnson    │                             │  ← ContactCard
│  │      Frontend Engineer│                             │
│  │ San Francisco         │                             │
│  │ [React][TypeScript]   │                             │
│  └───────────────────────┘                             │
└────────────────────────────────────────────────────────┘
                 ③ RESULTS

┌────────────────────────────────────────────────────────┐
│  CONTACTS                                              │
│  No contacts matched your search. Try a different query│
└────────────────────────────────────────────────────────┘
                 ④ NO RESULTS

┌────────────────────────────────────────────────────────┐
│  ┃ Search failed                                       │  ← ErrorMessage
└────────────────────────────────────────────────────────┘
                 ⑤ ERROR
```
