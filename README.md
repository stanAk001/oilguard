# OilGuard — Investment Fraud Training Lab

A full-stack, two-interface cybersecurity training application. It uses synthetic investor data to demonstrate suspicious investment and advance-fee patterns, alongside an investigator workspace for detection and analysis.

**Safety boundary:** all balances, returns, fee demands, users and transactions are fictional. The withdrawal workflow records a *simulated suspicious demand* and never charges money. No real payment processor, banking details, card details, PINs or OTPs are collected.

## Stack
- React + Vite + JavaScript ES modules
- Tailwind CSS
- Node.js + Express
- PostgreSQL + Prisma
- JWT authentication in HTTP-only cookies + bcrypt
- Recharts + Lucide React

## Requirements
- Node.js 20+
- PostgreSQL 14+

## Setup
1. Create a PostgreSQL database, e.g. `oilguard_lab`.
2. Copy `server/.env.example` to `server/.env` and set `DATABASE_URL` and `JWT_SECRET`.
3. From the project root:
   ```bash
   npm install
   npm run db:generate
   npm run db:migrate
   npm run db:seed
   npm run dev
   ```
4. Open the Vite URL printed in the terminal (normally `http://localhost:5173`).

## Demo accounts
After seeding:
- Investor: `investor@oilguard.local` / `DemoPass123!`
- Analyst: `analyst@oilguard.local` / `DemoPass123!`

Change these credentials before sharing the project. Seed accounts are for local demonstration only.

## Architecture
- `client/`: React single-page application.
- `server/`: Express API, Prisma schema, seed script and authorization middleware.
- Investor and investigator routes share the same database but are separated by server-side role checks.
- Investor balances and activity are loaded from the API, not hardcoded in UI components.
- The investigation dashboard uses seeded synthetic events and a transparent rules-based risk score.

## Useful commands
```bash
npm run dev
npm run build
npm run db:generate
npm run db:migrate
npm run db:seed
```

## Security controls demonstrated
- bcrypt password hashing
- HTTP-only, SameSite cookies
- JWT verification
- role-based authorization on server routes
- Helmet security headers
- login rate limiting
- server-side input validation
- Prisma parameterized queries
- audit events for simulated workflow actions

## Scope and limitations
This is a classroom starter application, not a financial product or production identity system. It deliberately does not integrate live or test payment processing. The withdrawal screen is a non-monetary simulation and the investigator view explains the red flags. Before deployment, add HTTPS, production secret management, CSRF protection appropriate to the deployment topology, robust account recovery, monitoring, backups and independent security review.
