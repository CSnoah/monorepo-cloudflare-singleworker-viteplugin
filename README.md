# React + Hono + Cloudflare Workers

This guide shows how to deploy a **React SPA frontend** and a **Hono backend** together as a **single Cloudflare Worker** from a monorepo.

The final architecture is:

```text
Project/
├── web/
│   └── React + Vite
│
└── api/
    ├── src/
    │   └── index.ts
    └── wrangler.jsonc
```

The React application is served from `/`, while the Hono API is served from `/api/*`.

---

## 1. Create a base directory

Create a directory for the project and navigate into it:

```bash
mkdir my-fullstack-app
cd my-fullstack-app
```

---

## 2. Create the React frontend

Create the React application using Vite:

```bash
npm create vite@latest
```

When prompted, choose React and your preferred variant.

For this example, the frontend directory will be:

```text
web/
```

---

## 3. Create the Hono backend

From the base project directory, create the Hono application:

```bash
npm create hono@latest api
```

Choose:

```text
cloudflare-workers
```

The backend will be created in:

```text
api/
```

---

## 4. Configure the Hono API route

Open:

```text
api/src/index.ts
```

Change the default route so that the backend uses the `/api` path:

```ts
import { Hono } from 'hono'

const app = new Hono()

app.get('/api/hello', (c) => {
  return c.text('Hello Hono!')
})

export default app
```

The reason for using `/api` is that the React application will be served from the base route `/`.

Therefore:

```text
/          → React frontend
/api/*     → Hono backend
```

This keeps the frontend and backend routes separate.

---

## 5. Project structure

At this point, the project should look approximately like this:

```text
my-fullstack-app/
├── web/
│   ├── src/
│   ├── package.json
│   └── ...
│
└── api/
    ├── src/
    │   └── index.ts
    ├── package.json
    └── wrangler.jsonc
```

---

## 6. Configure static assets in Wrangler

Open:

```text
api/wrangler.jsonc
```

Add the `assets` configuration:

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "api",
  "main": "src/index.ts",
  "compatibility_date": "2026-08-18",

  "assets": {
    "directory": "../web/dist",
    "not_found_handling": "single-page-application",
    "run_worker_first": ["/api/*"]
  }

  // "compatibility_flags": [
  //   "nodejs_compat"
  // ],

  // "vars": {
  //   "MY_VAR": "my-variable"
  // },

  // "kv_namespaces": [
  //   {
  //     "binding": "MY_KV_NAMESPACE",
  //     "id": "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
  //   }
  // ],

  // "r2_buckets": [
  //   {
  //     "binding": "MY_BUCKET",
  //     "bucket_name": "my-bucket"
  //   }
  // ],

  // "d1_databases": [
  //   {
  //     "binding": "MY_DB",
  //     "database_name": "my-database",
  //     "database_id": ""
  //   }
  // ],

  // "ai": {
  //   "binding": "AI"
  // },

  // "observability": {
  //   "enabled": true,
  //   "head_sampling_rate": 1
  // }
}
```

### What the asset configuration does

```json
"assets": {
  "directory": "../web/dist",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

#### `directory`

```json
"directory": "../web/dist"
```

This tells Cloudflare where the frontend's built static files are located.

The path is relative to the `api` directory:

```text
api/
└── wrangler.jsonc

../web/dist
     ↑
     └── web/dist
```

#### `not_found_handling`

```json
"not_found_handling": "single-page-application"
```

This tells Cloudflare to serve the frontend's `index.html` when a requested static asset isn't found.

This is useful for client-side routing with React Router.

#### `run_worker_first`

```json
"run_worker_first": ["/api/*"]
```

This tells Cloudflare to run the Worker first for requests matching `/api/*`.

That allows Hono to handle:

```text
/api/hello
/api/users
/api/login
/api/...
```

while the static asset system handles the React frontend.

---

## 7. Build the React application

Navigate into the frontend directory:

```bash
cd web
```

Build the React application:

```bash
npm run build
```

Vite creates the production build in:

```text
web/dist/
```

The resulting structure will look approximately like:

```text
web/
├── src/
├── dist/
│   ├── index.html
│   └── assets/
└── package.json
```

The `dist` directory is what Cloudflare will deploy as the Worker's static assets.

---

## 8. Deploy the Worker

Navigate to the backend directory:

```bash
cd ../api
```

Deploy the Worker with Wrangler:

```bash
npx wrangler deploy
```

Wrangler reads:

```text
api/wrangler.jsonc
```

and deploys both:

1. The Hono Worker code
2. The React production assets from `../web/dist`

---

## 9. View the deployment

After deployment, Cloudflare will provide a Worker URL similar to:

```text
https://api.noahmckegney.workers.dev/
```

You can also view the Worker in the Cloudflare dashboard.

---

## 10. Visit the frontend

Open:

```text
https://api.noahmckegney.workers.dev/
```

The React application is served from the base route:

```text
/
```

---

## 11. Visit the backend

The Hono API is available at:

```text
https://api.noahmckegney.workers.dev/api/hello
```

You should receive:

```text
Hello Hono!
```

---

# How the deployment works

The important part is that **one Worker handles both the backend code and the frontend's static assets**.

```text
                    Cloudflare Worker
                           │
              ┌────────────┴────────────┐
              │                         │
          Worker code              Static assets
              │                         │
        api/src/index.ts           web/dist/*
              │                         │
          Hono routes               React SPA
              │                         │
          /api/*                       /
```

For example:

```text
GET /
    ↓
React application

GET /assets/index-xxxx.js
    ↓
React static asset

GET /api/hello
    ↓
Hono Worker
    ↓
"Hello Hono!"
```

The Worker code is:

```text
Cloudflare Worker
│
├── 1. Worker code
│     └── api/src/index.ts
│
└── 2. Static assets
      └── web/dist/*
```

So you do **not** need a separate Worker just for the frontend. The frontend and backend can be deployed together as one Cloudflare Worker.

---

## Final project structure

After building the frontend, the relevant project structure is:

```text
my-fullstack-app/
│
├── web/
│   ├── src/
│   ├── dist/
│   │   ├── index.html
│   │   └── assets/
│   ├── package.json
│   └── ...
│
└── api/
    ├── src/
    │   └── index.ts
    ├── package.json
    └── wrangler.jsonc
```

The key configuration is:

```jsonc
"assets": {
  "directory": "../web/dist",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

This is what connects the React build to the Cloudflare Worker while allowing Hono to handle the `/api/*` routes.

## Cloudflare documentation

* [Cloudflare Workers Static Assets documentation](https://developers.cloudflare.com/workers/static-assets/)
* [Cloudflare Workers Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
