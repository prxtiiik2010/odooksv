<<<<<<< HEAD
# ProcureFlow

End-to-end procurement management system for hackathons.

## Tech Stack

- **Frontend**: Next.js 14 (App Router)
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **Auth**: JWT
- **PDF**: pdfkit

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start MongoDB

Make sure MongoDB is running locally or update `MONGODB_URI` in `.env.local`.

### 3. Seed demo data

```bash
npx tsx scripts/seed.ts
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
| Procurement Officer | rajesh@company.com | password123 |
| Approver | priya@company.com | password123 |
| Vendor | amit@sharmasteel.com | password123 |
| Admin | admin@company.com | password123 |

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
    api/           # API routes
      auth/        # Login & register
      vendors/     # Vendor management
      rfq/         # RFQ CRUD
      quotations/  # Quote submission & approval
      po/          # Purchase orders & PDF generation
      dashboard/   # Stats
    login/         # Auth pages
    dashboard/     # Main app pages
    vendors/
    rfq/
    quotations/
    po/
  lib/
    api.ts         # API client helper
    store.ts       # Auth context
    auth.ts        # JWT verification
    db.ts          # MongoDB connection
  models/          # Mongoose schemas
```

## Smart Recommendation

The quotation comparison table includes a weighted scoring system:

- **Price weight**: 60%
- **Delivery weight**: 40%

The vendor with the highest combined score is highlighted as the recommendation.
=======
# odooksv
odoo x ksv hackathon 2026
>>>>>>> b251501f7d052f0a557a6123843b624a8bbac45a
