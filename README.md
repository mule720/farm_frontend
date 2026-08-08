# AgroNexus — Frontend

React + TypeScript + Vite web application for the AgroNexus smart agrinexus-farm management platform.

## Tech Stack

- **Framework:** React 18 + TypeScript
- **Build tool:** Vite 5
- **Styling:** Tailwind CSS + shadcn/ui
- **GraphQL:** Native fetch (no Apollo — lightweight gqlRequest helper)
- **Auth:** GraphQL JWT (token in localStorage)
- **Deployment:** Nginx on GKE / Docker

## Local Development

```bash
# 1. Install dependencies
npm install

# 2. Start dev server (proxies /graphql → http://127.0.0.1:8000)
npm run dev
```

App runs at: http://localhost:8080

> **Note:** The Django backend must also be running on port 8000 for GraphQL to work.
> See [agronexus-backend](https://github.com/mule720/agronexus-backend).

## Build for Production

```bash
npm run build
# Output in dist/
```

## Key Pages & Modules

| Module | Route/View | Description |
|--------|-----------|-------------|
| Landing | `/` | Marketing page + sign-in |
| Dashboard | `app → dashboard` | Operations overview, KPIs |
| Production | `app → poultry / piggery / fish…` | Batch lifecycle management |
| Smart AI Engine | `app → smart-engine` | Daily feed & water plans |
| Inventory | `app → inventory` | Feed & stock management |
| Sales | `app → sales` | Customer orders |
| Finance | `app → finance` | P&L and expenses |
| Notifications | (bell icon in TopBar) | In-app alerts, 30s polling |
| Settings | `app → settings` | Profile, plan & subscription |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | GraphQL endpoint (production) e.g. `https://api.yourdomain.com/graphql/` |

In development the Vite proxy handles `/graphql` automatically — no `VITE_API_URL` needed.

## Docker

```bash
docker build --build-arg VITE_API_URL=https://api.yourdomain.com/graphql/ -t agronexus-frontend .
```
