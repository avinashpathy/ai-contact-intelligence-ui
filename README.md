# Contact Intelligence UI

A React and TypeScript frontend for searching a contact network with natural language. The app sends a query to a backend search API, displays the AI-generated summary, and renders matching contacts with their role, location, and skills.

## Features

- Natural-language contact search
- AI summary display for each search result
- Contact cards with initials, title, location, and skills
- Loading and error states
- Normalization for both plain JSON responses and DynamoDB-style attribute values
- Vite-powered local development with TypeScript and ESLint

## Tech Stack

- React 19
- TypeScript
- Vite
- Axios
- ESLint

## Project Structure

```text
contact-intelligence-ui/
├── public/                 # Static assets served by Vite
├── src/
│   ├── api/
│   │   └── contactApi.ts   # API client and response normalization
│   ├── components/         # Reusable UI components
│   ├── pages/
│   │   └── Home.tsx        # Main search page
│   ├── types/
│   │   └── contact.ts      # Shared TypeScript types
│   ├── App.tsx
│   ├── index.css
│   └── main.tsx
├── index.html
├── package.json
├── tsconfig*.json
└── vite.config.ts
```

## Prerequisites

Install the following before running the project:

- Node.js 20 or newer
- npm
- A compatible backend API running locally on `http://localhost:8000`

## Getting Started

Clone the repository and install dependencies:

```bash
git clone <your-repository-url>
cd contact-intelligence-ui
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will print a local URL, usually:

```text
http://localhost:5173
```

Open that URL in your browser and search for contacts using natural language, for example:

```text
Find frontend developers in San Francisco
```

## Available Scripts

```bash
npm run dev
```

Starts the local Vite development server with hot module replacement.

```bash
npm run build
```

Runs the TypeScript build and creates a production build in `dist/`.

```bash
npm run lint
```

Runs ESLint across the project.

```bash
npm run preview
```

Serves the production build locally for previewing after `npm run build`.

## Backend API

The frontend expects the backend to be available at:

```text
http://localhost:8000
```

The API client is defined in `src/api/contactApi.ts`.

### Search Contacts

```http
POST /search
```

Request body:

```json
{
  "query": "Find frontend developers in San Francisco"
}
```

Expected response:

```json
{
  "response": "Found contacts with frontend experience in San Francisco.",
  "contacts": [
    {
      "contactId": "contact-1",
      "name": "Avery Johnson",
      "title": "Frontend Engineer",
      "location": "San Francisco",
      "skills": ["React", "TypeScript", "CSS"]
    }
  ]
}
```

The UI also supports DynamoDB-style values, for example:

```json
{
  "contactId": { "S": "contact-1" },
  "name": { "S": "Avery Johnson" },
  "title": { "S": "Frontend Engineer" },
  "location": { "S": "San Francisco" },
  "skills": {
    "L": [
      { "S": "React" },
      { "S": "TypeScript" }
    ]
  }
}
```

### Get Contact

```http
GET /contacts/:contactId
```

Returns a single contact object.

### Get Contact Count

```http
GET /contacts/count
```

Returns the backend's contact count response.

## Data Model

```ts
interface Contact {
  contactId: string;
  name: string;
  title: string;
  location: string;
  skills: string[];
}

interface SearchResponse {
  response: string;
  contacts: Contact[];
}
```

## Environment Configuration

The current API base URL is hardcoded in `src/api/contactApi.ts`:

```ts
baseURL: "http://localhost:8000"
```

If you deploy the backend or need different API URLs per environment, move this value to a Vite environment variable such as `VITE_API_BASE_URL`.

Example `.env.local`:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

Environment files are ignored by Git so secrets and local configuration are not committed.

## Build for Production

Create a production build:

```bash
npm run build
```

Preview it locally:

```bash
npm run preview
```

The generated production files are placed in `dist/`, which is intentionally ignored by Git.

## GitHub Notes

This repository includes a `.gitignore` that excludes generated files and local-only data, including:

- `node_modules/`
- `dist/`
- `.env` and `.env.*`
- logs
- build caches
- coverage output
- editor and OS files

Commit `package-lock.json` with the project. It helps keep dependency installs reproducible.

## Troubleshooting

If searches fail, check that the backend is running on `http://localhost:8000` and that `POST /search` returns the expected JSON shape.

If the app starts but the browser shows no results, open the browser developer tools and check the Network tab for API errors.

If dependencies behave unexpectedly, reinstall them:

```bash
npm install
```
