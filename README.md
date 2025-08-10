# Three-Tier Web Development Educational Demo

This project demonstrates the evolution from pure frontend to full-stack using the same Anonymous Feedback feature.

Structure:
- `frontend-backend/only-frontend` – Vanilla JS, no persistence
- `frontend-backend/frontend-with-pseudo-backend` – Vanilla JS + LocalStorage
- `frontend-backend/frontend-with-backend` – Next.js client + Express/Prisma server

## Quickstart

### 1) Only Frontend
Open `frontend-backend/only-frontend/index.html` in your browser.

### 2) Frontend with Pseudo Backend
Open `frontend-backend/frontend-with-pseudo-backend/index.html` in your browser. Data persists in LocalStorage; supports edit/delete and export to JSON.

### 3) Full Stack

- Server
  - `cd frontend-backend/frontend-with-backend/server`
  - `npm install`
  - Copy `.env.example` to `.env` and set your `DATABASE_URL` and `OPENAI_API_KEY`
  - `npx prisma generate`
  - `npm run db:push` (or `npm run db:migrate` for production)
  - `npm run db:seed`
  - `npm run dev`

- Client
  - `cd ../client`
  - `npm install`
  - Copy `.env.local.example` to `.env.local` and set `NEXT_PUBLIC_BACKEND_URL`
  - `npm run dev`

Open the client at `http://localhost:3000`. The API runs at `http://localhost:3001` by default. 