# ProcureFlow

End-to-end procurement management system — from RFQ creation and vendor quotation to approval and purchase order generation.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16 (App Router), React 19, Tailwind CSS 4 |
| Backend | Next.js API Routes, Prisma ORM |
| Database | PostgreSQL |
| Auth | JWT (access + refresh token rotation), bcryptjs |
| PDF | pdfkit |

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@company.com | Password123! |
| Procurement Officer | rajesh@company.com | Password123! |
| Approver | priya@company.com | Password123! |
| Vendor | amit@sharmasteel.com | Password123! |

## Password Policy

Minimum 8 characters with at least one uppercase, lowercase, number, and special character.

---

## Workflow

```
Procurement Officer          Vendor           Approver
      |                       |                  |
   Create RFQ ─────────────► Assigned Vendors    |
      |                       |                  |
      |               Submit Quotation ─────────►|
      |                       |                  |
      |            Compare Quotes + Scores       |
      |                       |                  |
      |                  Approve / Reject ◄───────|
      |                       |                  |
      |            Generate Purchase Order         |
      |                       |                  |
      |             Download PDF PO               |
```

1. **Procurement Officer** creates RFQs and assigns vendors
2. **Vendors** log in and submit quotations with pricing and delivery terms
3. **Officer** compares quotations in the RFQ detail view using weighted scores
4. **Approver** reviews and approves or rejects quotations
5. **PO** is automatically generated upon approval
6. **PDF** purchase order can be downloaded from the PO page

---

## Smart Recommendation

The quotation comparison table uses a weighted scoring system:

- **Price weight**: 60% — lower price = higher score
- **Delivery weight**: 40% — faster delivery = higher score

The vendor with the highest combined score is highlighted as the recommended choice.

---

## Auth System

- **Access token**: JWT, 15-minute expiry, contains user data (id, role, name, email)
- **Refresh token**: DB-backed with 7-day expiry, rotated on every refresh
- **Password reset**: Single-use token sent via email link (logged to console in dev)
- **Audit log**: Every auth event (login, logout, register, reset) is recorded
- **Rate limiting**: Brute-force protection on login (5 attempts/15min), register (3/hr), password reset (3/hr)

---

## UI Design

The interface follows a clean SaaS-style design system:

- **Cards** — white surfaces with subtle backdrop blur, 12px border radius, soft shadows
- **Tables** — separated borders, uppercase column headers, hover row highlights
- **Chips** — rounded pill tags for vendor tags and status labels
- **Badges** — color-coded status indicators (OPEN, QUOTED, APPROVED, REJECTED)
- **States** — dedicated loading spinner, empty state, and error state for every data view
- **Typography** — Inter font throughout, consistent scale from 11px (labels) to 34px (stat values)

### Reusable Components (`src/components/ui.tsx`)

| Component | Purpose |
|-----------|---------|
| `PageHeader` | Title + description + optional action slot |
| `LoadingState` | Centered spinner with message |
| `EmptyState` | Dashed-card for empty list states |
| `ErrorState` | Error card with readable message |
| `Spinner` | Inline animated spinner |
| `TableContainer` | Responsive overflow-x wrapper |
| `formatCurrency()` | Format numbers as `Rs. X,XXX` with null safety |
| `formatDate()` | Safe date formatter with fallback |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login/            POST — authenticate, returns JWT tokens
│   │   │   ├── register/         POST — create account
│   │   │   ├── logout/          POST — revoke all refresh tokens
│   │   │   ├── refresh/         POST — rotate refresh token
│   │   │   ├── forgot-password/ POST — initiate password reset
│   │   │   └── reset-password/  POST — consume reset token
│   │   ├── dashboard/           GET — stats (RFQ count, pending approvals, recent POs)
│   │   ├── vendors/             GET / POST — vendor CRUD
│   │   ├── rfq/                 GET / POST — RFQ CRUD
│   │   ├── rfq/[id]/           GET — RFQ detail + quotation comparison
│   │   ├── quotations/         GET / POST — quote submission and listing
│   │   └── po/                  GET — purchase orders; GET /:id — PDF download
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   ├── reset-password/
│   ├── dashboard/    Main dashboard with stat cards and recent PO table
│   ├── vendors/       Vendor directory with add form
│   ├── rfq/           RFQ list with vendor chip selection for creation
│   ├── rfq/[id]/      RFQ detail with quotation comparison and approval actions
│   ├── quotations/    Quotation list and vendor submission form
│   └── po/           Purchase order list with PDF download
├── components/
│   ├── Layout.tsx    Sidebar navigation + user info + logout
│   └── ui.tsx        Shared UI components (PageHeader, LoadingState, etc.)
lib/
├── api.ts             API client with safe localStorage token parsing
├── store.tsx         Auth context (user state, login/logout, token refresh)
├── auth.ts           JWT signing and verification utilities
├── auth-server.ts    Server-side auth helpers (getAuthUser, token rotation)
├── db.ts             Prisma singleton instance
├── rate-limit.ts     Sliding-window rate limiter (DB-backed)
└── audit-log.ts      Audit event logger
prisma/
├── schema.prisma     Database schema with all models
└── migrations/       Prisma migration history
scripts/
└── seed.ts           Demo data seeder (users, vendors, RFQs, quotations, POs)
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |

> All sensitive values are managed via environment variables and **never committed** to the repository.

---

## API Design

All API routes return JSON. Error responses follow `{ error: "message" }` shape.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/login` | POST | Authenticate user, returns access + refresh tokens |
| `/api/auth/register` | POST | Create new account |
| `/api/auth/logout` | POST | Revoke all refresh tokens for user |
| `/api/auth/refresh` | POST | Rotate refresh token |
| `/api/auth/forgot-password` | POST | Initiate password reset |
| `/api/auth/reset-password` | POST | Reset password with token |
| `/api/vendors` | GET/POST | List and create vendors |
| `/api/rfq` | GET/POST | List and create RFQs |
| `/api/rfq/[id]` | GET | RFQ detail with quotation comparison |
| `/api/quotations` | GET/POST | List and submit quotations |
| `/api/quotations/[id]` | PATCH | Approve or reject a quotation |
| `/api/po` | GET | List all purchase orders |
| `/api/po/[id]` | GET | Download PO as PDF |
| `/api/dashboard` | GET | Aggregated stats for dashboard |

---

## Database Schema

```
User          — id, name, email, password, role, vendorId
Vendor        — id, name, email, gst, category
RFQ           — id, title, description, quantity, status, createdById
RFQVendor     — id, rfqId, vendorId (junction table)
Quotation     — id, rfqId, vendorId, price, deliveryDays, notes, status
PurchaseOrder — id, rfqId, quotationId, vendorId, poNumber, totalAmount, status
RefreshToken  — id, token, userId, expiresAt
PasswordResetToken — id, token, userId, expiresAt, usedAt
AuditLog      — id, userId, action, details, ipAddress, userAgent
RateLimitEntry — id, key, action, expiresAt
```