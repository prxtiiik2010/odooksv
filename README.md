# ProcureFlow

End-to-end procurement management system for hackathons.

## Tech Stack

- **Frontend**: Next.js 16 (App Router)
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT (access + refresh token rotation)
- **PDF**: pdfkit

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Create or update `.env` with your PostgreSQL connection string:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/procurement?schema=public"
JWT_SECRET="generate-a-strong-random-secret"
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 3. Apply migrations & seed demo data

```bash
npx prisma migrate dev --name init
npx prisma generate
npm run seed
```

### 4. Run dev server

```bash
npm run dev
```

### 5. Open the app

Navigate to `http://localhost:3000`

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Procurement Officer | rajesh@company.com | Password123! |
| Approver | priya@company.com | Password123! |
| Vendor | amit@sharmasteel.com | Password123! |
| Admin | admin@company.com | Password123! |

## Auth System

- **Access token**: JWT, 15-minute expiry, contains user data
- **Refresh token**: DB-backed, 7-day expiry, rotated on every refresh
- **Password reset**: Single-use token via email link (logged to console in dev)
- **Audit log**: Every auth event (login, logout, register, reset) is recorded
- **Rate limiting**: Brute-force protection on login (5 attempts/15min), register (3/hr), password reset (3/hr)

## Password Requirements

Minimum 8 characters with at least one uppercase, lowercase, number, and special character.

## Workflow

1. **Procurement Officer** creates RFQs and assigns vendors
2. **Vendors** log in and submit quotations
3. **Officer** compares quotations in the RFQ detail view
4. **Approver** reviews and approves/rejects quotations
5. **PO** is automatically generated upon approval
6. **PDF** can be downloaded from the PO page

## Project Structure

```
src/
  app/
    api/
      auth/
        login/       # POST — authenticate, returns access + refresh token
        register/    # POST — create account
        logout/       # POST — revoke all refresh tokens
        refresh/     # POST — rotate refresh token
        forgot-password/  # POST — initiate reset
        reset-password/   # POST — consume reset token
      vendors/     # Vendor management
      rfq/         # RFQ CRUD
      quotations/  # Quote submission & approval
      po/          # Purchase orders & PDF generation
      dashboard/   # Stats
    login/         # Login + forgot password pages
    register/      # Registration page
    forgot-password/
    reset-password/
    dashboard/     # Main app pages
    vendors/
    rfq/
    quotations/
    po/
  lib/
    api.ts           # API client helper
    store.tsx        # Auth context + refresh token logic
    auth.ts          # JWT utils, refresh tokens, password reset
    auth-utils.ts    # Re-exports from auth.ts
    db.ts            # Prisma client singleton
    rate-limit.ts    # Sliding-window rate limiter
    audit-log.ts     # Audit logger
  components/
    Layout.tsx      # Dashboard sidebar + navigation
prisma/
  schema.prisma     # DB schema + all models
  migrations/       # Migration history
scripts/
  seed.ts          # Demo data seeder
```

## Smart Recommendation

The quotation comparison table includes a weighted scoring system:

- **Price weight**: 60%
- **Delivery weight**: 40%

The vendor with the highest combined score is highlighted as the recommendation.