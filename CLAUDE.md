# CLAUDE.md — Bisuteria Rodio Backend

## Project Overview

REST API backend for **Bisuteria Rodio** (a jewelry e-commerce store). Built with Node.js + Fastify, deployed on AWS EC2 (Ubuntu t2.micro). The API is consumed 24/7 by a Next.js frontend. Admin operations are protected via Google OAuth + JWT.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (CommonJS) |
| Framework | Fastify v5 |
| Language | TypeScript (strict mode, target ES2022) |
| ORM | Prisma v6 |
| Database | PostgreSQL via Neon (cloud-hosted) |
| Auth | Google OAuth2 + JWT (HttpOnly cookies) |
| Image Storage | Cloudinary |
| Build | `tsc` → `dist/` |
| Dev server | `tsx watch` |
| CI/CD | GitHub Actions → SSH → deploy.sh on EC2 |

---

## Project Structure

```
src/
├── app.ts                    # Fastify builder (no listen); registers plugins + routes
├── server.ts                 # Entry point — calls buildApp() + app.listen()
├── lib/
│   ├── config.ts             # Env var loader & validator (throws on missing vars)
│   ├── prisma.ts             # Prisma client singleton
│   └── cloudinary.ts         # uploadImageBuffer(), deleteCloudinaryImage()
├── plugins/
│   ├── cors.ts               # CORS (uses ALLOWED_ORIGIN env var)
│   ├── cookie.ts             # HTTP cookie parsing
│   ├── jwt.ts                # JWT from HttpOnly cookies; registers app.authenticate
│   └── oauth.ts              # Google OAuth2; registers app.googleOAuth2
├── modules/                  # Feature modules (preferred pattern)
│   ├── products/             # products.routes | .controller | .service | .schema
│   ├── catalog/              # categories & colors — catalog.routes | .controller | .service | .schema
│   ├── movements/            # stock movements — movements.routes | .controller | .service | .schema
│   └── cloudinary/           # asset management — cloudinary.routes | .controller | .service
├── routes/                   # Legacy top-level routes
│   ├── auth.routes.ts
│   └── pattern.routes.ts
├── controllers/              # Legacy controllers (auth, pattern)
├── services/                 # Legacy services (auth, pattern)
├── schemas/                  # Legacy schemas
├── types/
│   └── fastify.d.ts          # Augments Fastify: app.authenticate, app.googleOAuth2, JWT payload type
├── middlewares/              # Currently empty
└── scripts/
    └── seed.ts               # Seeds 8 sample products + uploads images to Cloudinary

prisma/
├── schema.prisma             # Database schema
└── migrations/               # Prisma migration history

.github/
└── workflows/
    └── deploy.yml            # CI/CD pipeline
```

---

## Architecture Conventions

### Module Pattern
All new features follow the module pattern inside `src/modules/`:

```
modules/<feature>/
├── <feature>.routes.ts       # Route registration + schema validation hooks
├── <feature>.controller.ts   # Request handling, HTTP responses
├── <feature>.service.ts      # Business logic, Prisma queries
└── <feature>.schema.ts       # Zod or JSON Schema validation definitions
```

### Route Prefixes

| Prefix | Access | Description |
|--------|--------|-------------|
| `GET /api/products` | Public | Product listing with filters |
| `GET /api/categories` | Public | List categories |
| `GET /api/colors` | Public | List colors |
| `GET /api/health` | Public | Health check |
| `/api/auth/*` | Public + JWT | Google OAuth flow, /me, logout |
| `/api/admin/*` | JWT required | All admin operations |

### Authentication Flow
- Google OAuth2 → callback → mint JWT → set HttpOnly cookie
- Protected routes use `preHandler: [app.authenticate]`
- JWT payload shape: `{ id: string; email: string }`
- Admin whitelist controlled by `ADMIN_ALLOWED_EMAILS` env var (comma-separated)

---

## Database

### Models

| Model | Purpose |
|-------|---------|
| `Product` | Jewelry item (name, price, stock, isVisible, categoryId, colorId) |
| `Category` | Dynamic category (name, slug) — NOT an enum |
| `Color` | Dynamic color (name, hex, slug) — NOT an enum |
| `Image` | Product image (url, publicId, order, productId) |
| `ProductMovement` | Stock transaction (PURCHASE \| SALE, quantity, productId) |
| `AdminUser` | Admin account (email, name, picture) |
| `AppConfig` | Key-value app configuration |

### Key Business Rules
- Products with `stock = 0` are auto-set to `isVisible = false`
- Categories and colors are database-driven (can be created/modified at runtime)
- Stock changes are tracked in `ProductMovement` for history

### Migration Commands
```bash
npm run db:migrate    # prisma migrate dev (creates new migration)
npm run db:push       # prisma db push && generate (schema sync, no migration file)
npm run db:studio     # Prisma Studio GUI
npm run seed          # Seed 8 sample products
```

**Always use `db:migrate` for production schema changes — creates a migration file that can be tracked in git.**

---

## Development Workflow

### Local Development
```bash
npm run dev           # tsx watch src/server.ts (hot reload)
```

### Build & Start (Production mode)
```bash
npm run build         # prisma generate && tsc → dist/
npm run start         # node dist/server.js
```

### Environment Variables (required)
```
PORT                  # Server port (default 3001)
NODE_ENV              # development | production
DATABASE_URL          # PostgreSQL connection string (Neon)
JWT_SECRET            # JWT signing secret
JWT_EXPIRES_IN        # Token expiration (e.g. 7d)
CLOUDINARY_CLOUD_NAME
CLOUDINARY_API_KEY
CLOUDINARY_API_SECRET
ALLOWED_ORIGIN        # CORS origin (frontend URL)
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
FRONTEND_URL          # Post-auth redirect target
ADMIN_ALLOWED_EMAILS  # Comma-separated admin whitelist
```

---

## Deployment

### CI/CD Pipeline
- **Trigger:** Push to `main` branch
- **Workflow:** `.github/workflows/deploy.yml`
- **Method:** GitHub Actions → SSH into EC2 → runs `/home/ubuntu/deploy.sh`
- **Required GitHub Secrets:** `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`

### EC2 Instance
- **Provider:** AWS EC2
- **OS:** Ubuntu (t2.micro)
- **Process Manager:** (managed via deploy.sh on the instance)
- The `deploy.sh` script lives on the EC2 instance, not in this repo

### Deployment Process
1. Push changes to `main`
2. GitHub Actions triggers automatically
3. SSH action connects to EC2 and runs deploy.sh
4. deploy.sh pulls latest code, installs deps, builds, and restarts the process

---

## Key Patterns & Decisions

1. **`app.ts` vs `server.ts`** — `app.ts` only builds the Fastify instance (testable); `server.ts` calls listen. Never add listen() to app.ts.

2. **Prisma transactions** — Use `prisma.$transaction()` for operations that must be atomic (e.g., creating a movement + updating product stock).

3. **HttpOnly JWT cookies** — Never expose JWT in response body or Authorization header. Always use cookies.

4. **Dynamic catalog** — Categories and colors are Prisma records, not TypeScript enums. Do not reintroduce enums for these.

5. **Cloudinary images** — All image uploads/deletes go through `src/lib/cloudinary.ts`. The `cloudinary` module handles admin asset management separately.

6. **Schema validation** — Routes use Fastify's built-in JSON Schema validation. New routes must define input schemas.

7. **Config validation** — `src/lib/config.ts` throws at startup if required env vars are missing. Add new required vars there.

---

## Fastify Type Augmentation

`src/types/fastify.d.ts` extends Fastify with:
```typescript
app.authenticate          // preHandler middleware for JWT-protected routes
app.googleOAuth2          // Google OAuth2 namespace
// JWT token payload:
{ id: string; email: string }
```

---

## Testing

No test suite is currently configured. When adding tests, prefer integration tests against a real (test) database over mocked Prisma calls.

---

## Related Projects

- **Frontend:** Next.js app consuming this API (repository separate)
- **Database:** Neon PostgreSQL (cloud) — connection via `DATABASE_URL`
- **Image CDN:** Cloudinary — `coragem/products/` folder convention for product images
